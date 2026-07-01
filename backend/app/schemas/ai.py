from datetime import datetime
from pydantic import BaseModel


class AIConversationRead(BaseModel):
    id: str
    user_id: str
    title: str | None = None
    context_type: str | None = None
    context_id: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
