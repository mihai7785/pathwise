from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import LearningPath, Resource, ResourceStatus, Topic, TopicStatus, User
from app.schemas.dashboard import DashboardResponse, DashboardStats
from app.schemas.path import LearningPathCreate, LearningPathRead, TopicCreate, TopicRead
from app.schemas.resource import ResourceCreate, ResourceRead

router = APIRouter()


@router.get('/dashboard', response_model=DashboardResponse)
def get_dashboard(user_id: int = 1, db: Session = Depends(get_db)):
    seed_demo_data(db)
    total_paths = db.scalar(select(func.count(LearningPath.id)).where(LearningPath.user_id == user_id)) or 0
    active_topics = db.scalar(select(func.count(Topic.id)).join(LearningPath).where(LearningPath.user_id == user_id, Topic.status == TopicStatus.in_progress)) or 0
    inbox_resources = db.scalar(select(func.count(Resource.id)).where(Resource.user_id == user_id, Resource.status == ResourceStatus.inbox)) or 0
    completed_topics = db.scalar(select(func.count(Topic.id)).join(LearningPath).where(LearningPath.user_id == user_id, Topic.status == TopicStatus.done)) or 0

    next_topics = db.scalars(
        select(Topic.title)
        .join(LearningPath)
        .where(LearningPath.user_id == user_id, Topic.status.in_([TopicStatus.not_started, TopicStatus.in_progress]))
        .order_by(Topic.order_index.asc())
        .limit(5)
    ).all()
    recent_resources = db.scalars(select(Resource.title).where(Resource.user_id == user_id).order_by(Resource.created_at.desc()).limit(5)).all()
    return DashboardResponse(
        stats=DashboardStats(
            total_paths=total_paths,
            active_topics=active_topics,
            inbox_resources=inbox_resources,
            completed_topics=completed_topics,
        ),
        suggested_next_topics=list(next_topics),
        recent_resource_titles=[title for title in recent_resources if title],
    )


@router.get('/paths', response_model=list[LearningPathRead])
def list_paths(user_id: int = 1, db: Session = Depends(get_db)):
    seed_demo_data(db)
    return db.scalars(select(LearningPath).where(LearningPath.user_id == user_id).order_by(LearningPath.created_at.asc())).all()


@router.post('/paths', response_model=LearningPathRead)
def create_path(payload: LearningPathCreate, db: Session = Depends(get_db)):
    path = LearningPath(**payload.model_dump())
    db.add(path)
    db.commit()
    db.refresh(path)
    return path


@router.get('/topics', response_model=list[TopicRead])
def list_topics(path_id: int, db: Session = Depends(get_db)):
    return db.scalars(select(Topic).where(Topic.learning_path_id == path_id).order_by(Topic.order_index.asc(), Topic.created_at.asc())).all()


@router.post('/topics', response_model=TopicRead)
def create_topic(payload: TopicCreate, db: Session = Depends(get_db)):
    topic = Topic(**payload.model_dump())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.get('/resources', response_model=list[ResourceRead])
def list_resources(user_id: int = 1, db: Session = Depends(get_db)):
    seed_demo_data(db)
    return db.scalars(select(Resource).where(Resource.user_id == user_id).order_by(Resource.created_at.desc())).all()


@router.post('/resources', response_model=ResourceRead)
def create_resource(payload: ResourceCreate, db: Session = Depends(get_db)):
    resource = Resource(**payload.model_dump())
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.get('/topics/{topic_id}', response_model=TopicRead)
def get_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail='Topic not found')
    return topic


def seed_demo_data(db: Session) -> None:
    existing_user = db.scalar(select(User).where(User.email == 'demo@learningcopilot.app'))
    if existing_user:
        return

    user = User(email='demo@learningcopilot.app', name='Demo User')
    db.add(user)
    db.flush()

    path = LearningPath(user_id=user.id, title='AI Engineer', description='Structured path for theory + practice', target_role='AI Engineer')
    db.add(path)
    db.flush()

    topics = [
        Topic(learning_path_id=path.id, title='Python Foundations', status=TopicStatus.done, order_index=1),
        Topic(learning_path_id=path.id, title='Machine Learning Fundamentals', status=TopicStatus.in_progress, order_index=2),
        Topic(learning_path_id=path.id, title='Embeddings', status=TopicStatus.not_started, order_index=3),
        Topic(learning_path_id=path.id, title='RAG', status=TopicStatus.not_started, order_index=4),
        Topic(learning_path_id=path.id, title='Agents', status=TopicStatus.not_started, order_index=5),
    ]
    db.add_all(topics)

    resources = [
        Resource(user_id=user.id, type='link', title='Practical RAG guide', source_url='https://example.com/rag', summary='Walkthrough of chunking, retrieval, and grounding.', status=ResourceStatus.inbox),
        Resource(user_id=user.id, type='text', title='Agent notes', raw_text='Need to study tool use, memory, and eval loops.', summary='Quick notes on agent building.', status=ResourceStatus.processed),
    ]
    db.add_all(resources)
    db.commit()
