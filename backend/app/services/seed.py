import uuid

from sqlalchemy.orm import Session

from app.models.ai import AIConversation
from app.models.learning import LearningPath, Topic
from app.models.resource import Resource, ResourceTopicSuggestion, TopicResource
from app.models.user import User


DEMO_USER_ID = "user_demo"
PATH_ID = "path_ai_engineer"
TOPIC_IDS = {
    "python": "topic_python",
    "ml": "topic_ml",
    "llm": "topic_llm",
    "rag": "topic_rag",
    "agents": "topic_agents",
}


def seed_demo_data(db: Session) -> None:
    existing = db.get(User, DEMO_USER_ID)
    if existing:
        return

    user = User(id=DEMO_USER_ID, email="mihai@example.com", name="Mihai")
    path = LearningPath(
        id=PATH_ID,
        user_id=user.id,
        title="AI Engineer",
        description="Structured path for AI engineering foundations and applied systems.",
        target_role="AI Engineer",
        status="active",
    )
    topics = [
        Topic(id=TOPIC_IDS["python"], learning_path_id=path.id, title="Python for AI", status="done", priority="high", order_index=1, confidence=4),
        Topic(id=TOPIC_IDS["ml"], learning_path_id=path.id, title="ML Fundamentals", status="in_progress", priority="high", order_index=2, confidence=3),
        Topic(id=TOPIC_IDS["llm"], learning_path_id=path.id, title="LLM Foundations", status="in_progress", priority="high", order_index=3, confidence=2),
        Topic(id=TOPIC_IDS["rag"], learning_path_id=path.id, title="RAG Systems", status="not_started", priority="high", order_index=4),
        Topic(id=TOPIC_IDS["agents"], learning_path_id=path.id, title="Agents & Tool Use", status="not_started", priority="medium", order_index=5),
    ]
    resources = [
        Resource(id="res_rag_article", user_id=user.id, type="link", title="Practical RAG architecture notes", source_url="https://example.com/rag", summary="Overview of chunking, retrieval, and evaluation.", status="processed"),
        Resource(id="res_agent_note", user_id=user.id, type="text", title="Agent design notes", raw_text="Need to study tool calling, memory, evals, and orchestration.", summary="Personal note about agent study gaps.", status="linked"),
        Resource(id="res_inbox", user_id=user.id, type="image", title="Screenshot about embeddings", summary="Pending OCR and topic linking.", status="inbox"),
    ]
    links = [
        TopicResource(id=str(uuid.uuid4()), topic_id=TOPIC_IDS["rag"], resource_id="res_rag_article", added_by="ai", relevance_score=0.92),
        TopicResource(id=str(uuid.uuid4()), topic_id=TOPIC_IDS["agents"], resource_id="res_agent_note", added_by="user", relevance_score=0.89),
    ]
    suggestions = [
        ResourceTopicSuggestion(id=str(uuid.uuid4()), resource_id="res_inbox", topic_id=TOPIC_IDS["rag"], confidence_score=0.71, reason="Screenshot appears to mention embeddings and retrieval.", status="pending")
    ]
    conversation = AIConversation(id="conv_demo", user_id=user.id, title="AI Engineer Copilot", context_type="path", context_id=path.id)

    db.add(user)
    db.add(path)
    for item in topics + resources + links + suggestions:
        db.add(item)
    db.add(conversation)
    db.commit()
