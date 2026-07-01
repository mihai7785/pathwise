from datetime import datetime
from pydantic import BaseModel


class LearningPathCreate(BaseModel):
    title: str
    description: str | None = None
    target_role: str | None = None
    status: str = "active"


class TopicCreate(BaseModel):
    title: str
    description: str | None = None
    status: str = "not_started"
    priority: str = "medium"
    parent_topic_id: str | None = None
    order_index: int = 0


class TopicRead(BaseModel):
    id: str
    learning_path_id: str
    parent_topic_id: str | None = None
    title: str
    description: str | None = None
    status: str
    priority: str
    order_index: int
    difficulty: int | None = None
    confidence: int | None = None
    estimated_hours: float | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LearningPathRead(BaseModel):
    id: str
    user_id: str
    title: str
    slug: str | None = None
    description: str | None = None
    target_role: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LearningPathWithTopics(LearningPathRead):
    topics: list[TopicRead]


class TopicUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    confidence: int | None = None
    estimated_hours: float | None = None
