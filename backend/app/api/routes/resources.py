from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.resource import Resource
from app.models.user import User

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("")
def list_resources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resources = db.query(Resource).filter(Resource.user_id == current_user.id).order_by(Resource.created_at.desc()).all()
    return [
        {
            "id": resource.id,
            "title": resource.title,
            "type": resource.type,
            "status": resource.status,
            "source_url": resource.source_url,
            "summary": resource.summary,
            "suggestions": [
                {
                    "topic_id": suggestion.topic_id,
                    "topic_title": suggestion.topic.title if suggestion.topic else None,
                    "confidence_score": suggestion.confidence_score,
                    "reason": suggestion.reason,
                    "status": suggestion.status,
                }
                for suggestion in resource.suggestions
            ],
        }
        for resource in resources
    ]
