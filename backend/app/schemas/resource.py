from typing import Optional

from pydantic import BaseModel

from app.schemas.common import TimestampedSchema


class ResourceCreate(BaseModel):
    type: str
    title: Optional[str] = None
    source_url: Optional[str] = None
    raw_text: Optional[str] = None


class ResourceRead(TimestampedSchema):
    id: str
    user_id: str
    type: str
    title: Optional[str] = None
    source_url: Optional[str] = None
    raw_text: Optional[str] = None
    extracted_text: Optional[str] = None
    summary: Optional[str] = None
    status: str


class ResourceTopicLinkCreate(BaseModel):
    topic_id: str
