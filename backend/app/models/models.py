from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PathStatus(str, Enum):
    active = 'active'
    paused = 'paused'
    completed = 'completed'
    archived = 'archived'


class TopicStatus(str, Enum):
    not_started = 'not_started'
    in_progress = 'in_progress'
    blocked = 'blocked'
    done = 'done'


class Priority(str, Enum):
    low = 'low'
    medium = 'medium'
    high = 'high'


class ResourceType(str, Enum):
    link = 'link'
    text = 'text'
    image = 'image'
    pdf = 'pdf'


class ResourceStatus(str, Enum):
    inbox = 'inbox'
    processed = 'processed'
    linked = 'linked'
    archived = 'archived'


class AIJobType(str, Enum):
    resource_summary = 'resource_summary'
    topic_explanation = 'topic_explanation'
    topic_suggestion = 'topic_suggestion'
    exercise_generation = 'exercise_generation'
    next_step = 'next_step'


class AIJobStatus(str, Enum):
    pending = 'pending'
    running = 'running'
    completed = 'completed'
    failed = 'failed'


class User(TimestampMixin, Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    learning_paths: Mapped[list['LearningPath']] = relationship(back_populates='user', cascade='all, delete-orphan')
    resources: Mapped[list['Resource']] = relationship(back_populates='user', cascade='all, delete-orphan')


class LearningPath(TimestampMixin, Base):
    __tablename__ = 'learning_paths'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_role: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[PathStatus] = mapped_column(SqlEnum(PathStatus), default=PathStatus.active)

    user: Mapped['User'] = relationship(back_populates='learning_paths')
    topics: Mapped[list['Topic']] = relationship(back_populates='learning_path', cascade='all, delete-orphan')


class Topic(TimestampMixin, Base):
    __tablename__ = 'topics'

    id: Mapped[int] = mapped_column(primary_key=True)
    learning_path_id: Mapped[int] = mapped_column(ForeignKey('learning_paths.id'), index=True)
    parent_topic_id: Mapped[int | None] = mapped_column(ForeignKey('topics.id'), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[TopicStatus] = mapped_column(SqlEnum(TopicStatus), default=TopicStatus.not_started)
    priority: Mapped[Priority] = mapped_column(SqlEnum(Priority), default=Priority.medium)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    difficulty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)

    learning_path: Mapped['LearningPath'] = relationship(back_populates='topics')
    parent_topic: Mapped['Topic | None'] = relationship(remote_side='Topic.id', back_populates='children')
    children: Mapped[list['Topic']] = relationship(back_populates='parent_topic')
    resources: Mapped[list['TopicResource']] = relationship(back_populates='topic', cascade='all, delete-orphan')


class TopicDependency(TimestampMixin, Base):
    __tablename__ = 'topic_dependencies'
    __table_args__ = (UniqueConstraint('topic_id', 'depends_on_topic_id', name='uq_topic_dependency'),)

    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey('topics.id'), index=True)
    depends_on_topic_id: Mapped[int] = mapped_column(ForeignKey('topics.id'), index=True)


class Resource(TimestampMixin, Base):
    __tablename__ = 'resources'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    type: Mapped[ResourceType] = mapped_column(SqlEnum(ResourceType))
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ResourceStatus] = mapped_column(SqlEnum(ResourceStatus), default=ResourceStatus.inbox)

    user: Mapped['User'] = relationship(back_populates='resources')
    topics: Mapped[list['TopicResource']] = relationship(back_populates='resource', cascade='all, delete-orphan')


class TopicResource(TimestampMixin, Base):
    __tablename__ = 'topic_resources'
    __table_args__ = (UniqueConstraint('topic_id', 'resource_id', name='uq_topic_resource'),)

    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey('topics.id'), index=True)
    resource_id: Mapped[int] = mapped_column(ForeignKey('resources.id'), index=True)
    relevance_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    added_by: Mapped[str] = mapped_column(String(20), default='user')

    topic: Mapped['Topic'] = relationship(back_populates='resources')
    resource: Mapped['Resource'] = relationship(back_populates='topics')


class AIJob(TimestampMixin, Base):
    __tablename__ = 'ai_jobs'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    type: Mapped[AIJobType] = mapped_column(SqlEnum(AIJobType))
    status: Mapped[AIJobStatus] = mapped_column(SqlEnum(AIJobStatus), default=AIJobStatus.pending)
    resource_id: Mapped[int | None] = mapped_column(ForeignKey('resources.id'), nullable=True)
    topic_id: Mapped[int | None] = mapped_column(ForeignKey('topics.id'), nullable=True)
    provider: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    input_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
