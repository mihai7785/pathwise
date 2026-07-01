from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String, index=True)
    slug: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_role: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="learning_paths")
    topics = relationship("Topic", back_populates="learning_path", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    learning_path_id: Mapped[str] = mapped_column(ForeignKey("learning_paths.id"), index=True)
    parent_topic_id: Mapped[str | None] = mapped_column(ForeignKey("topics.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="not_started")
    priority: Mapped[str] = mapped_column(String, default="medium")
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    difficulty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    learning_path = relationship("LearningPath", back_populates="topics")
    parent_topic = relationship("Topic", remote_side=[id], back_populates="children")
    children = relationship("Topic", back_populates="parent_topic")
    resources = relationship("TopicResource", back_populates="topic", cascade="all, delete-orphan")
    notes = relationship("TopicNote", back_populates="topic", cascade="all, delete-orphan")
    evidence_items = relationship("TopicEvidence", back_populates="topic", cascade="all, delete-orphan")
    progress_events = relationship("ProgressEvent", back_populates="topic", cascade="all, delete-orphan")


class TopicDependency(Base):
    __tablename__ = "topic_dependencies"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    topic_id: Mapped[str] = mapped_column(ForeignKey("topics.id"), index=True)
    depends_on_topic_id: Mapped[str] = mapped_column(ForeignKey("topics.id"), index=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TopicNote(Base):
    __tablename__ = "topic_notes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    topic_id: Mapped[str] = mapped_column(ForeignKey("topics.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    topic = relationship("Topic", back_populates="notes")


class TopicEvidence(Base):
    __tablename__ = "topic_evidence"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    topic_id: Mapped[str] = mapped_column(ForeignKey("topics.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(String)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    topic = relationship("Topic", back_populates="evidence_items")


class ProgressEvent(Base):
    __tablename__ = "progress_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    topic_id: Mapped[str] = mapped_column(ForeignKey("topics.id"), index=True)
    type: Mapped[str] = mapped_column(String)
    payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    topic = relationship("Topic", back_populates="progress_events")
