from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.learning import LearningPath
from app.schemas.learning import LearningPathRead, LearningPathWithTopics
from app.services.seed import DEMO_USER_ID

router = APIRouter(prefix="/paths", tags=["paths"])


@router.get("", response_model=list[LearningPathRead])
def list_paths(db: Session = Depends(get_db)):
    return db.query(LearningPath).filter(LearningPath.user_id == DEMO_USER_ID).order_by(LearningPath.created_at.desc()).all()


@router.get("/{path_id}", response_model=LearningPathWithTopics)
def get_path(path_id: str, db: Session = Depends(get_db)):
    path = db.query(LearningPath).filter(LearningPath.id == path_id, LearningPath.user_id == DEMO_USER_ID).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return path
