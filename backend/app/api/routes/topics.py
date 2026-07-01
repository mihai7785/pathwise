from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.learning import Topic
from app.models.user import User
from app.schemas.learning import TopicUpdate

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/{topic_id}")
def get_topic(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    path_owned = topic.learning_path.user_id == current_user.id if topic.learning_path else False
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


@router.patch("/{topic_id}")
def update_topic(
    topic_id: str,
    payload: TopicUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    path_owned = topic.learning_path.user_id == current_user.id if topic.learning_path else False
    if not path_owned:
        raise HTTPException(status_code=404, detail="Topic not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(topic, field, value)

    db.add(topic)
    db.commit()
    db.refresh(topic)

    return {
        "id": topic.id,
        "learning_path_id": topic.learning_path_id,
        "title": topic.title,
        "description": topic.description,
        "status": topic.status,
        "priority": topic.priority,
        "confidence": topic.confidence,
        "estimated_hours": topic.estimated_hours,
        "resources": [
            {
                "id": link.resource.id,
                "title": link.resource.title,
                "type": link.resource.type,
                "summary": link.resource.summary,
                "relevance_score": link.relevance_score,
            }
            for link in topic.resources
        ],
        "notes": [note.content for note in topic.notes],
        "ai_actions": [
            "Explain this topic",
            "Generate a practical exercise",
            "Suggest next subtopics",
        ],
    }


@router.delete("/{topic_id}", status_code=204)
def delete_topic(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    path_owned = topic.learning_path.user_id == current_user.id if topic.learning_path else False
    if not path_owned:
        raise HTTPException(status_code=404, detail="Topic not found")

    db.delete(topic)
    db.commit()
