export type DashboardData = {
  summary: {
    paths: number
    topics: number
    resources: number
    inbox_count: number
  }
  topic_status_counts: Array<{ status: string; count: number }>
  next_topics: Array<{ id: string; title: string; status: string; priority: string }>
  copilot_suggestions: string[]
}

export type LearningPath = {
  id: string
  user_id: string
  title: string
  description?: string | null
  target_role?: string | null
  status: string
  topics?: Topic[]
}

export type Topic = {
  id: string
  learning_path_id: string
  parent_topic_id?: string | null
  title: string
  description?: string | null
  status: string
  priority: string
  order_index: number
  confidence?: number | null
}

export type Resource = {
  id: string
  title?: string | null
  type: string
  status: string
  source_url?: string | null
  summary?: string | null
  suggestions: Array<{
    topic_id: string
    topic_title?: string | null
    confidence_score?: number | null
    reason?: string | null
    status: string
  }>
}

export type TopicDetail = {
  id: string
  learning_path_id: string
  title: string
  description?: string | null
  status: string
  priority: string
  confidence?: number | null
  estimated_hours?: number | null
  resources: Array<{
    id: string
    title?: string | null
    type: string
    summary?: string | null
    relevance_score?: number | null
  }>
  notes: string[]
  ai_actions: string[]
}

export type CopilotContext = {
  title: string
  starter_prompts: string[]
  provider_strategy: string
}
