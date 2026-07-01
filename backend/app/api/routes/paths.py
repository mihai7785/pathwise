import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.learning import LearningPath
from app.models.user import User
from app.schemas.learning import LearningPathCreate, LearningPathRead, LearningPathWithTopics, TopicCreate, TopicRead
from app.models.learning import Topic

router = APIRouter(prefix="/paths", tags=["paths"])


@router.get("", response_model=list[LearningPathRead])
def list_paths(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(LearningPath).filter(LearningPath.user_id == current_user.id).order_by(LearningPath.created_at.desc()).all()


@router.post("", response_model=LearningPathRead)
def create_path(
    payload: LearningPathCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    path = LearningPath(
        id=f"path_{uuid.uuid4().hex[:10]}",
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        target_role=payload.target_role,
        status=payload.status,
    )
    db.add(path)
    db.commit()
    db.refresh(path)
    return path


@router.get("/{path_id}", response_model=LearningPathWithTopics)
def get_path(
    path_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    path = db.query(LearningPath).filter(LearningPath.id == path_id, LearningPath.user_id == current_user.id).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return path


@router.post("/{path_id}/topics", response_model=TopicRead)
def create_topic_for_path(
    path_id: str,
    payload: TopicCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    path = db.query(LearningPath).filter(LearningPath.id == path_id, LearningPath.user_id == current_user.id).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    topic = Topic(
        id=f"topic_{uuid.uuid4().hex[:10]}",
        learning_path_id=path.id,
        parent_topic_id=payload.parent_topic_id,
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        order_index=payload.order_index,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic
