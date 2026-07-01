from typing import Optional

from pydantic import BaseModel

from app.models.models import ResourceStatus, ResourceType
from app.schemas.common import TimestampedSchema


class ResourceCreate(BaseModel):
    user_id: int
    type: ResourceType
    title: Optional[str] = None
    source_url: Optional[str] = None
    raw_text: Optional[str] = None


class ResourceRead(TimestampedSchema):
    id: int
    user_id: int
    type: ResourceType
    title: Optional[str] = None
    source_url: Optional[str] = None
    raw_text: Optional[str] = None
    extracted_text: Optional[str] = None
    summary: Optional[str] = None
    status: ResourceStatus
