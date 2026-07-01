from typing import Optional

from pydantic import BaseModel

from app.models.models import PathStatus, Priority, TopicStatus
from app.schemas.common import TimestampedSchema


class TopicBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TopicStatus = TopicStatus.not_started
    priority: Priority = Priority.medium
    parent_topic_id: Optional[int] = None
    order_index: int = 0


class TopicCreate(TopicBase):
    learning_path_id: int


class TopicRead(TopicBase, TimestampedSchema):
    id: int
    learning_path_id: int


class LearningPathBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_role: Optional[str] = None
    status: PathStatus = PathStatus.active


class LearningPathCreate(LearningPathBase):
    user_id: int


class LearningPathRead(LearningPathBase, TimestampedSchema):
    id: int
    user_id: int
