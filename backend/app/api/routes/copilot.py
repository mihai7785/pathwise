from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.learning import LearningPath, Topic
from app.models.resource import Resource
from app.models.user import User

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.get("/conversation")
def get_copilot_context(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topics = (
        db.query(Topic)
        .join(LearningPath, Topic.learning_path_id == LearningPath.id)
        .filter(LearningPath.user_id == current_user.id)
        .all()
    )
    resources = db.query(Resource).filter(Resource.user_id == current_user.id).all()
    in_progress_count = sum(1 for topic in topics if topic.status == "in_progress")
    inbox_count = sum(1 for resource in resources if resource.status == "inbox")

    return {
        "title": f"{current_user.name}'s Pathwise Copilot",
        "starter_prompts": [
            "What should I study next?",
            "Explain embeddings like I'm revising for an interview.",
            "Generate a practical RAG exercise.",
            "What resources do I already have about agents?",
        ],
        "provider_strategy": f"Pathwise is currently using a local heuristic copilot layer. You have {in_progress_count} topics in progress and {inbox_count} inbox resources waiting to be processed. Provider adapters are still planned behind this endpoint.",
    }
