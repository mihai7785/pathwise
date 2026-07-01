import type { DashboardData } from './types'

export const dashboardData: DashboardData = {
  stats: {
    total_paths: 1,
    active_topics: 1,
    inbox_resources: 1,
    completed_topics: 1,
  },
  suggested_next_topics: ['Machine Learning Fundamentals', 'Embeddings', 'RAG', 'Agents'],
  recent_resource_titles: ['Practical RAG guide', 'Agent notes'],
}

export const pathTopics = [
  { id: 1, title: 'Python Foundations', status: 'done' },
  { id: 2, title: 'Machine Learning Fundamentals', status: 'in_progress' },
  { id: 3, title: 'Embeddings', status: 'not_started' },
  { id: 4, title: 'RAG', status: 'not_started' },
  { id: 5, title: 'Agents', status: 'not_started' },
]

export const inboxResources = [
  { id: 1, title: 'Practical RAG guide', type: 'link', state: 'inbox', summary: 'Walkthrough of chunking, retrieval, and grounding.' },
  { id: 2, title: 'Agent notes', type: 'text', state: 'processed', summary: 'Quick notes on tool use, memory, and eval loops.' },
]
