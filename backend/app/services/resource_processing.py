import json
import re
import uuid
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai import AIJob
from app.models.learning import LearningPath, Topic
from app.models.resource import Resource, ResourceFile, ResourceTopicSuggestion
from app.models.user import User

TOKEN_RE = re.compile(r"[a-zA-Z0-9]+")
MAX_SUGGESTIONS = 3
TOPIC_HINTS = {
    "rag": {"rag", "retrieval", "grounding", "chunking", "embedding", "embeddings", "vector", "search"},
    "agent": {"agent", "agents", "tool", "tools", "memory", "orchestration", "eval", "evals"},
    "llm": {"llm", "llms", "prompt", "prompts", "transformer", "token", "tokens"},
    "ml": {"ml", "machine", "learning", "classification", "regression", "model"},
    "python": {"python", "numpy", "pandas", "fastapi"},
}


def _tokenize(text: str | None) -> set[str]:
    if not text:
        return set()
    return {token.lower() for token in TOKEN_RE.findall(text)}


def _resource_source_text(resource: Resource) -> str:
    parts: list[str] = []
    if resource.title:
        parts.append(resource.title)
    if resource.raw_text:
        parts.append(resource.raw_text)
    if resource.source_url:
        parts.append(resource.source_url.replace("-", " ").replace("_", " "))
    if resource.type == "image" and not parts:
        parts.append("Image resource waiting for OCR extraction.")
    return "\n".join(part.strip() for part in parts if part and part.strip())


def _read_text_from_file(resource: Resource) -> str | None:
    if not resource.files:
        return None

    first_file: ResourceFile = resource.files[0]
    mime_type = (first_file.mime_type or "").lower()
    storage_path = Path(settings.uploads_dir) / first_file.storage_key
    if not storage_path.exists():
        return None

    if mime_type.startswith("text/") or first_file.file_name.lower().endswith((".md", ".txt", ".py", ".json", ".csv")):
        try:
            return storage_path.read_text(encoding="utf-8", errors="ignore").strip()
        except OSError:
            return None

    if mime_type == "application/json" or first_file.file_name.lower().endswith(".json"):
        try:
            parsed = json.loads(storage_path.read_text(encoding="utf-8", errors="ignore"))
            return json.dumps(parsed, indent=2)[:4000]
        except (OSError, json.JSONDecodeError):
            return None

    return None


def _infer_extracted_text(resource: Resource, source_text: str) -> str:
    file_text = _read_text_from_file(resource)
    if file_text:
        return file_text

    if resource.type == "image":
        if resource.raw_text:
            return resource.raw_text.strip()
        if resource.files:
            return f"Image file uploaded: {resource.files[0].file_name}. OCR pipeline not implemented yet."
        if resource.title:
            return f"Image note: {resource.title}"
        return "Image resource waiting for OCR extraction."
    if source_text.strip():
        return source_text.strip()
    if resource.source_url:
        parsed = urlparse(resource.source_url)
        host = parsed.netloc or resource.source_url
        return f"Link resource saved from {host}"
    return "Resource captured without additional text."


def _summarize(extracted_text: str) -> str:
    normalized = " ".join(extracted_text.split())
    if not normalized:
        return "No summary available yet."
    sentences = re.split(r"(?<=[.!?])\s+", normalized)
    if len(sentences) >= 2:
        return " ".join(sentences[:2])
    words = normalized.split()
    summary = " ".join(words[:30])
    if len(words) > 30:
        summary += "…"
    return summary


def _topic_score(topic: Topic, tokens: set[str]) -> float:
    topic_tokens = _tokenize(topic.title)
    topic_tokens |= _tokenize(topic.description)
    lowered = topic.title.lower()
    for key, hints in TOPIC_HINTS.items():
        if key in lowered:
            topic_tokens |= hints
    if not topic_tokens:
        return 0.0
    overlap = tokens & topic_tokens
    if not overlap:
        return 0.0
    return min(0.98, len(overlap) / max(2, len(topic_tokens) * 0.35))


def process_resource(db: Session, current_user: User, resource: Resource) -> tuple[Resource, AIJob]:
    job = AIJob(
        id=f"job_{uuid.uuid4().hex[:10]}",
        user_id=current_user.id,
        type="resource_processing",
        status="running",
        resource_id=resource.id,
        provider="pathwise-local",
        model="heuristic-v1",
        input_json={"resource_id": resource.id, "resource_type": resource.type},
    )
    db.add(job)
    db.flush()

    source_text = _resource_source_text(resource)
    extracted_text = _infer_extracted_text(resource, source_text)
    summary = _summarize(extracted_text)
    resource.extracted_text = extracted_text
    resource.summary = summary

    tokens = _tokenize(" ".join(filter(None, [resource.title, resource.raw_text, resource.source_url, extracted_text])))
    topics = (
        db.query(Topic)
        .join(LearningPath, Topic.learning_path_id == LearningPath.id)
        .filter(LearningPath.user_id == current_user.id)
        .all()
    )

    scores: list[tuple[Topic, float]] = []
    for topic in topics:
        score = _topic_score(topic, tokens)
        if score > 0:
            scores.append((topic, score))
    scores.sort(key=lambda item: item[1], reverse=True)
    top_scores = scores[:MAX_SUGGESTIONS]

    db.query(ResourceTopicSuggestion).filter(ResourceTopicSuggestion.resource_id == resource.id).delete()
    suggestions_payload = []
    for topic, score in top_scores:
        suggestion = ResourceTopicSuggestion(
            id=str(uuid.uuid4()),
            resource_id=resource.id,
            topic_id=topic.id,
            confidence_score=round(score, 2),
            reason=f"Matched topic keywords from “{topic.title}”.",
            status="pending",
        )
        db.add(suggestion)
        suggestions_payload.append({
            "topic_id": topic.id,
            "topic_title": topic.title,
            "confidence_score": round(score, 2),
        })

    resource.status = "linked" if resource.topic_links else "processed"
    db.add(resource)
    job.status = "completed"
    job.output_json = {"summary": summary, "suggestions": suggestions_payload}
    db.add(job)
    db.commit()
    db.refresh(resource)
    db.refresh(job)
    return resource, job
