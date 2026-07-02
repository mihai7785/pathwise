import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.ai import AIJob
from app.models.learning import Topic
from app.models.resource import Resource, TopicResource
from app.models.user import User
from app.schemas.resource import ResourceCreate, ResourceTopicLinkCreate
from app.services.resource_processing import process_resource

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("")
def list_resources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resources = db.query(Resource).filter(Resource.user_id == current_user.id).order_by(Resource.created_at.desc()).all()
    return [serialize_resource(resource, db) for resource in resources]


@router.post("")
def create_resource(
    payload: ResourceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = Resource(
        id=f"res_{uuid.uuid4().hex[:10]}",
        user_id=current_user.id,
        type=payload.type,
        title=payload.title,
        source_url=payload.source_url,
        raw_text=payload.raw_text,
        status="inbox",
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return serialize_resource(resource, db)


@router.post("/{resource_id}/process")
def process_resource_endpoint(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.user_id == current_user.id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    processed_resource, _job = process_resource(db, current_user, resource)
    return serialize_resource(processed_resource, db)


@router.post("/{resource_id}/link-topic")
def link_resource_to_topic(
    resource_id: str,
    payload: ResourceTopicLinkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.user_id == current_user.id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    topic = db.query(Topic).filter(Topic.id == payload.topic_id).first()
    if not topic or not topic.learning_path or topic.learning_path.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Topic not found")

    existing = (
        db.query(TopicResource)
        .filter(TopicResource.resource_id == resource.id, TopicResource.topic_id == topic.id)
        .first()
    )
    if existing:
        return {"ok": True, "already_linked": True, "topic_id": topic.id, "resource_id": resource.id}

    link = TopicResource(
        id=str(uuid.uuid4()),
        topic_id=topic.id,
        resource_id=resource.id,
        added_by="user",
    )
    db.add(link)
    if resource.status == "inbox":
        resource.status = "linked"
        db.add(resource)
    db.commit()

    return {
        "ok": True,
        "already_linked": False,
        "topic_id": topic.id,
        "topic_title": topic.title,
        "resource_id": resource.id,
    }


@router.delete("/{resource_id}", status_code=204)
def delete_resource(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.user_id == current_user.id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    db.delete(resource)
    db.commit()


@router.delete("/{resource_id}/topics/{topic_id}", status_code=204)
def unlink_resource_from_topic(
    resource_id: str,
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.user_id == current_user.id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic or not topic.learning_path or topic.learning_path.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Topic not found")

    link = (
        db.query(TopicResource)
        .filter(TopicResource.resource_id == resource.id, TopicResource.topic_id == topic.id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    db.delete(link)
    db.commit()


def serialize_resource(resource: Resource, db: Session):
    return {
        "id": resource.id,
        "title": resource.title,
        "type": resource.type,
        "status": resource.status,
        "source_url": resource.source_url,
        "extracted_text": resource.extracted_text,
        "summary": resource.summary,
        "linked_topics": [
            {
                "topic_id": link.topic_id,
                "topic_title": link.topic.title if link.topic else None,
            }
            for link in resource.topic_links
        ],
        "latest_job": _serialize_latest_job(resource, db),
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


def _serialize_latest_job(resource: Resource, db: Session):
    latest_job = (
        db.query(AIJob)
        .filter(AIJob.resource_id == resource.id)
        .order_by(AIJob.created_at.desc())
        .first()
    )
    if not latest_job:
        return None
    return {
        "id": latest_job.id,
        "type": latest_job.type,
        "status": latest_job.status,
        "provider": latest_job.provider,
        "model": latest_job.model,
        "error_message": latest_job.error_message,
    }
