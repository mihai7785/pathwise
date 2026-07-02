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

export type LearningPathStatus = 'active' | 'paused' | 'completed' | 'archived'
export type TopicStatus = 'not_started' | 'in_progress' | 'blocked' | 'done'

export type LearningPath = {
  id: string
  user_id: string
  title: string
  description?: string | null
  target_role?: string | null
  status: LearningPathStatus
  topics?: Topic[]
}

export type Topic = {
  id: string
  learning_path_id: string
  parent_topic_id?: string | null
  title: string
  description?: string | null
  status: TopicStatus
  priority: string
  order_index: number
  confidence?: number | null
}

export type ResourceSuggestion = {
  topic_id: string
  topic_title?: string | null
  confidence_score?: number | null
  reason?: string | null
  status: string
}

export type Resource = {
  id: string
  title?: string | null
  type: string
  status: string
  source_url?: string | null
  extracted_text?: string | null
  summary?: string | null
  linked_topics: Array<{
    topic_id: string
    topic_title?: string | null
  }>
  latest_job?: {
    id: string
    type: string
    status: string
    provider?: string | null
    model?: string | null
    error_message?: string | null
  } | null
  suggestions: ResourceSuggestion[]
}

export type TopicDetailResource = {
  id: string
  title?: string | null
  type: string
  summary?: string | null
  relevance_score?: number | null
}

export type TopicDetail = {
  id: string
  learning_path_id: string
  title: string
  description?: string | null
  status: TopicStatus
  priority: string
  confidence?: number | null
  estimated_hours?: number | null
  resources: TopicDetailResource[]
  notes: string[]
  ai_actions: string[]
}

export type CopilotContext = {
  title: string
  starter_prompts: string[]
  provider_strategy: string
}

export type TopicLinkResponse = {
  ok: boolean
  already_linked: boolean
  topic_id: string
  topic_title?: string
  resource_id: string
}
