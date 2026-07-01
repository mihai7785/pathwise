from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.learning import LearningPath
from app.models.user import User
from app.schemas.learning import LearningPathRead, LearningPathWithTopics

router = APIRouter(prefix="/paths", tags=["paths"])


@router.get("", response_model=list[LearningPathRead])
def list_paths(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(LearningPath).filter(LearningPath.user_id == current_user.id).order_by(LearningPath.created_at.desc()).all()


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
