from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(String)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    source_url: Mapped[str | None] = mapped_column(String, nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="inbox")
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="resources")
    files = relationship("ResourceFile", back_populates="resource", cascade="all, delete-orphan")
    topic_links = relationship("TopicResource", back_populates="resource", cascade="all, delete-orphan")
    suggestions = relationship("ResourceTopicSuggestion", back_populates="resource", cascade="all, delete-orphan")


class ResourceFile(Base):
    __tablename__ = "resource_files"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id"), index=True)
    storage_key: Mapped[str] = mapped_column(String)
    file_name: Mapped[str] = mapped_column(String)
    mime_type: Mapped[str] = mapped_column(String)
    file_size_bytes: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    resource = relationship("Resource", back_populates="files")


class TopicResource(Base):
    __tablename__ = "topic_resources"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    topic_id: Mapped[str] = mapped_column(ForeignKey("topics.id"), index=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id"), index=True)
    relevance_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    added_by: Mapped[str] = mapped_column(String, default="user")
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    topic = relationship("Topic", back_populates="resources")
    resource = relationship("Resource", back_populates="topic_links")


class ResourceTopicSuggestion(Base):
    __tablename__ = "resource_topic_suggestions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id"), index=True)
    topic_id: Mapped[str] = mapped_column(ForeignKey("topics.id"), index=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    resource = relationship("Resource", back_populates="suggestions")
    topic = relationship("Topic")
