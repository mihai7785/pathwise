import uuid

from sqlalchemy.orm import Session

from app.models.ai import AIConversation
from app.models.learning import LearningPath, Topic
from app.models.resource import Resource, ResourceTopicSuggestion, TopicResource
from app.models.user import User


def seed_user_starter_data(db: Session, user: User) -> None:
    existing = db.query(LearningPath).filter(LearningPath.user_id == user.id).first()
    if existing:
        return

    path_id = f"path_{uuid.uuid4().hex[:10]}"
    topic_ids = {
        "python": f"topic_{uuid.uuid4().hex[:10]}",
        "ml": f"topic_{uuid.uuid4().hex[:10]}",
        "llm": f"topic_{uuid.uuid4().hex[:10]}",
        "rag": f"topic_{uuid.uuid4().hex[:10]}",
        "agents": f"topic_{uuid.uuid4().hex[:10]}",
    }
    path = LearningPath(
        id=path_id,
        user_id=user.id,
        title="AI Engineer",
        description="Structured path for AI engineering foundations and applied systems.",
        target_role="AI Engineer",
        status="active",
    )
    topics = [
        Topic(id=topic_ids["python"], learning_path_id=path.id, title="Python for AI", status="done", priority="high", order_index=1, confidence=4),
        Topic(id=topic_ids["ml"], learning_path_id=path.id, title="ML Fundamentals", status="in_progress", priority="high", order_index=2, confidence=3),
        Topic(id=topic_ids["llm"], learning_path_id=path.id, title="LLM Foundations", status="in_progress", priority="high", order_index=3, confidence=2),
        Topic(id=topic_ids["rag"], learning_path_id=path.id, title="RAG Systems", status="not_started", priority="high", order_index=4),
        Topic(id=topic_ids["agents"], learning_path_id=path.id, title="Agents & Tool Use", status="not_started", priority="medium", order_index=5),
    ]
    resources = [
        Resource(id=f"res_{uuid.uuid4().hex[:10]}", user_id=user.id, type="link", title="Practical RAG architecture notes", source_url="https://example.com/rag", summary="Overview of chunking, retrieval, and evaluation.", status="processed"),
        Resource(id=f"res_{uuid.uuid4().hex[:10]}", user_id=user.id, type="text", title="Agent design notes", raw_text="Need to study tool calling, memory, evals, and orchestration.", summary="Personal note about agent study gaps.", status="linked"),
        Resource(id=f"res_{uuid.uuid4().hex[:10]}", user_id=user.id, type="image", title="Screenshot about embeddings", summary="Pending OCR and topic linking.", status="inbox"),
    ]
    links = [
        TopicResource(id=str(uuid.uuid4()), topic_id=topic_ids["rag"], resource_id=resources[0].id, added_by="ai", relevance_score=0.92),
        TopicResource(id=str(uuid.uuid4()), topic_id=topic_ids["agents"], resource_id=resources[1].id, added_by="user", relevance_score=0.89),
    ]
    suggestions = [
        ResourceTopicSuggestion(id=str(uuid.uuid4()), resource_id=resources[2].id, topic_id=topic_ids["rag"], confidence_score=0.71, reason="Screenshot appears to mention embeddings and retrieval.", status="pending")
    ]
    conversation = AIConversation(id=f"conv_{uuid.uuid4().hex[:10]}", user_id=user.id, title="Pathwise Copilot", context_type="path", context_id=path.id)

    db.add(path)
    for item in topics + resources + links + suggestions:
        db.add(item)
    db.add(conversation)
    db.commit()
