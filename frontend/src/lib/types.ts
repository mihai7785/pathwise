export type TopicStatus = 'not_started' | 'in_progress' | 'blocked' | 'done'

export interface DashboardData {
  stats: {
    total_paths: number
    active_topics: number
    inbox_resources: number
    completed_topics: number
  }
  suggested_next_topics: string[]
  recent_resource_titles: string[]
}
