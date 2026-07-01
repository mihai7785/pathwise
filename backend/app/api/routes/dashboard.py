from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.learning import LearningPath, Topic
from app.models.resource import Resource
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    paths = db.query(LearningPath).filter(LearningPath.user_id == current_user.id).all()
    topics = db.query(Topic).join(LearningPath, Topic.learning_path_id == LearningPath.id).filter(LearningPath.user_id == current_user.id).all()
    resources = db.query(Resource).filter(Resource.user_id == current_user.id).all()

    topic_status_counts = (
        db.query(Topic.status, func.count(Topic.id))
        .join(LearningPath, Topic.learning_path_id == LearningPath.id)
        .filter(LearningPath.user_id == current_user.id)
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
