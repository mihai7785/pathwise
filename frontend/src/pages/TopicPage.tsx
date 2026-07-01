import { useCallback, useEffect, useState } from 'react'

import { apiDelete, apiGet, apiPatch } from '../lib/api'
import type { TopicDetail, TopicStatus } from '../types'

type Props = {
  topicId: string | null
  onTopicDeleted: () => void
}

const TOPIC_STATUSES: TopicStatus[] = ['not_started', 'in_progress', 'blocked', 'done']

export function TopicPage({ topicId, onTopicDeleted }: Props) {
  const [topic, setTopic] = useState<TopicDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusValue, setStatusValue] = useState<TopicStatus>('not_started')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeletingTopic, setIsDeletingTopic] = useState(false)
  const [resourceActionId, setResourceActionId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [resourceError, setResourceError] = useState<string | null>(null)

  const loadTopic = useCallback(async () => {
    if (!topicId) {
      setTopic(null)
      setError(null)
      return
    }

    const result = await apiGet<TopicDetail>(`/topics/${topicId}`)
    setTopic(result)
    setStatusValue(result.status)
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
      setStatusValue(topic.status)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDeleteTopic = async () => {
    if (!topicId || !topic) {
      return
    }

    const confirmed = window.confirm(`Delete topic "${topic.title}"?`)
    if (!confirmed) {
      return
    }

    setIsDeletingTopic(true)
    setStatusError(null)

    try {
      await apiDelete(`/topics/${topicId}`)
      onTopicDeleted()
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to delete topic')
      setIsDeletingTopic(false)
    }
  }

  const handleUnlinkResource = async (resourceId: string) => {
    if (!topicId) {
      return
    }

    const confirmed = window.confirm('Unlink this resource from the current topic?')
    if (!confirmed) {
      return
    }

    setResourceActionId(resourceId)
    setResourceError(null)

    try {
      await apiDelete(`/resources/${resourceId}/topics/${topicId}`)
      await loadTopic()
    } catch (err) {
      setResourceError(err instanceof Error ? err.message : 'Failed to unlink resource')
    } finally {
      setResourceActionId(null)
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
          <p className="muted">{topic.description ?? 'Add context for this topic from the Learning Path page.'}</p>
        </div>
      </div>

      <div className="two-col">
        <section className="card">
          <h2>Topic overview</h2>
          <p>
            Status, next steps, and AI actions for this topic live here. Use the linked resources panel to keep the topic clean.
          </p>

          <div className="status-editor">
            <label className="form-field status-editor-field">
              <span>Status</span>
              <select
                value={statusValue}
                onChange={(event) => setStatusValue(event.target.value as TopicStatus)}
                disabled={isUpdatingStatus || isDeletingTopic}
              >
                {TOPIC_STATUSES.map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </label>
            <button
              className="primary"
              onClick={handleStatusChange}
              disabled={isUpdatingStatus || isDeletingTopic || statusValue === topic.status}
            >
              {isUpdatingStatus ? 'Saving…' : 'Update status'}
            </button>
            <button
              className="danger-button"
              onClick={handleDeleteTopic}
              disabled={isDeletingTopic || isUpdatingStatus}
            >
              {isDeletingTopic ? 'Deleting…' : 'Delete topic'}
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
          {resourceError && <div className="auth-error bottom-spacing">{resourceError}</div>}
          <ul className="linked-resource-list">
            {topic.resources.map((resource) => (
              <li key={resource.id} className="linked-resource-item">
                <div className="resource-content">
                  <strong>{resource.title || 'Untitled resource'}</strong>
                  <div className="muted small">{resource.type}</div>
                  {resource.summary && <p>{resource.summary}</p>}
                </div>
                <button
                  className="secondary-button"
                  onClick={() => handleUnlinkResource(resource.id)}
                  disabled={resourceActionId === resource.id}
                >
                  {resourceActionId === resource.id ? 'Unlinking…' : 'Unlink'}
                </button>
              </li>
            ))}
          </ul>
          {topic.resources.length === 0 && <p className="muted">No resources linked to this topic yet.</p>}
        </section>
      </div>
    </div>
  )
}
