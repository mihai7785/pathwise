import { useCallback, useEffect, useState } from 'react'

import { apiGet, apiPatch } from '../lib/api'
import type { TopicDetail, TopicStatus } from '../types'

type Props = {
  topicId: string | null
}

const TOPIC_STATUSES: TopicStatus[] = ['not_started', 'in_progress', 'blocked', 'done']

export function TopicPage({ topicId }: Props) {
  const [topic, setTopic] = useState<TopicDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusValue, setStatusValue] = useState<TopicStatus>('not_started')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  const loadTopic = useCallback(async () => {
    if (!topicId) {
      setTopic(null)
      setError(null)
      return
    }

    const result = await apiGet<TopicDetail>(`/topics/${topicId}`)
    setTopic(result)
    setStatusValue(result.status as TopicStatus)
    setError(null)
  }, [topicId])

  useEffect(() => {
    loadTopic().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load topic'))
  }, [loadTopic])

  const handleStatusChange = async () => {
    if (!topicId || !topic || statusValue === topic.status) {
      return
    }

    setIsUpdatingStatus(true)
    setStatusError(null)

    try {
      await apiPatch(`/topics/${topicId}`, { status: statusValue })
      await loadTopic()
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to update topic status')
      setStatusValue(topic.status as TopicStatus)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  if (!topicId) {
    return <div className="page"><div className="card">Open a topic from the Learning Path page.</div></div>
  }

  if (error) {
    return <div className="page"><div className="card">Topic error: {error}</div></div>
  }

  if (!topic) {
    return <div className="page"><div className="card">Loading topic…</div></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{topic.title}</h1>
          <p className="muted">{topic.description ?? 'Retrieval-augmented generation fundamentals and implementation.'}</p>
        </div>
      </div>

      <div className="two-col">
        <section className="card">
          <h2>Topic overview</h2>
          <p>
            Learn chunking, embedding retrieval, grounding, evaluation, and when RAG is better than fine-tuning.
          </p>

          <div className="status-editor">
            <label className="form-field status-editor-field">
              <span>Status</span>
              <select
                value={statusValue}
                onChange={(event) => setStatusValue(event.target.value as TopicStatus)}
                disabled={isUpdatingStatus}
              >
                {TOPIC_STATUSES.map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </label>
            <button
              className="primary"
              onClick={handleStatusChange}
              disabled={isUpdatingStatus || statusValue === topic.status}
            >
              {isUpdatingStatus ? 'Saving…' : 'Update status'}
            </button>
          </div>

          {statusError && <div className="auth-error">{statusError}</div>}

          <div className="actions">
            {topic.ai_actions.map((action, index) => (
              <button key={action} className={index === 0 ? 'primary' : ''}>{action}</button>
            ))}
          </div>
        </section>
        <section className="card">
          <h2>Linked resources</h2>
          <ul>
            {topic.resources.map((resource) => (
              <li key={resource.id}>{resource.title}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
