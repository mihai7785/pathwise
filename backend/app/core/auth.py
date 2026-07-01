from __future__ import annotations

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserSession


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return authorization.strip()


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    token = _extract_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    session = db.query(UserSession).filter(UserSession.token == token).first()
    if not session or not session.user:
        raise HTTPException(status_code=401, detail="Invalid session")
    return session.user
