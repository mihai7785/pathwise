from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.learning import Topic
from app.services.seed import DEMO_USER_ID, PATH_ID

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/{topic_id}")
def get_topic(topic_id: str, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    path_owned = topic.learning_path.user_id == DEMO_USER_ID if topic.learning_path else False
    if not path_owned:
        raise HTTPException(status_code=404, detail="Topic not found")

    resource_links = [
        {
            "id": link.resource.id,
            "title": link.resource.title,
            "type": link.resource.type,
            "summary": link.resource.summary,
            "relevance_score": link.relevance_score,
        }
        for link in topic.resources
    ]

    return {
        "id": topic.id,
        "learning_path_id": topic.learning_path_id,
        "title": topic.title,
        "description": topic.description,
        "status": topic.status,
        "priority": topic.priority,
        "confidence": topic.confidence,
        "estimated_hours": topic.estimated_hours,
        "resources": resource_links,
        "notes": [note.content for note in topic.notes],
        "ai_actions": [
            "Explain this topic",
            "Generate a practical exercise",
            "Suggest next subtopics",
        ],
    }
