from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_paths: int
    active_topics: int
    inbox_resources: int
    completed_topics: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    suggested_next_topics: list[str]
    recent_resource_titles: list[str]
