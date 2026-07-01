from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.db.session import get_db
from app.models.learning import LearningPath, Topic
from app.models.resource import Resource
from app.services.seed import DEMO_USER_ID

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(db: Session = Depends(get_db)):
    paths = db.query(LearningPath).filter(LearningPath.user_id == DEMO_USER_ID).all()
    topics = db.query(Topic).join(LearningPath, Topic.learning_path_id == LearningPath.id).filter(LearningPath.user_id == DEMO_USER_ID).all()
    resources = db.query(Resource).filter(Resource.user_id == DEMO_USER_ID).all()

    topic_status_counts = (
        db.query(Topic.status, func.count(Topic.id))
        .join(LearningPath, Topic.learning_path_id == LearningPath.id)
        .filter(LearningPath.user_id == DEMO_USER_ID)
        .group_by(Topic.status)
        .all()
    )

    next_topics = [
        {
            "id": topic.id,
            "title": topic.title,
            "status": topic.status,
            "priority": topic.priority,
        }
        for topic in topics
        if topic.status in {"not_started", "in_progress"}
    ][:3]

    return {
        "summary": {
            "paths": len(paths),
            "topics": len(topics),
            "resources": len(resources),
            "inbox_count": sum(1 for r in resources if r.status == "inbox"),
        },
        "topic_status_counts": [{"status": status, "count": count} for status, count in topic_status_counts],
        "next_topics": next_topics,
        "copilot_suggestions": [
            "Review ML Fundamentals before moving deeper into RAG.",
            "Process the embeddings screenshot from your inbox.",
            "Generate a practical exercise for LLM Foundations.",
        ],
    }
