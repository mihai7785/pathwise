from __future__ import annotations

import secrets
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User, UserSession
from app.schemas.auth import AuthResponse, LoginRequest, UserRead
from app.services.seed import seed_user_starter_data

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/dev-login", response_model=AuthResponse)
def dev_login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    created = False
    if not user:
        user = User(id=f"user_{uuid.uuid4().hex[:10]}", email=payload.email, name=payload.name)
        db.add(user)
        db.flush()
        created = True
    else:
        user.name = payload.name
        db.add(user)

    session = UserSession(
        id=f"sess_{uuid.uuid4().hex[:10]}",
        user_id=user.id,
        token=secrets.token_urlsafe(32),
    )
    db.add(session)
    db.commit()
    db.refresh(user)

    if created:
        seed_user_starter_data(db, user)
        db.refresh(user)

    return AuthResponse(token=session.token, user=user)


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
