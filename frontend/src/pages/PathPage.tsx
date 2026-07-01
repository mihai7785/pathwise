import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { apiGet, apiPost } from '../lib/api'
import type { LearningPath, Topic } from '../types'

type Props = {
  onOpenTopic: (topicId: string) => void
}

export function PathPage({ onOpenTopic }: Props) {
  const [path, setPath] = useState<LearningPath | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [topicTitle, setTopicTitle] = useState('')
  const [topicDescription, setTopicDescription] = useState('')
  const [topicPriority, setTopicPriority] = useState('medium')

  const loadPath = useCallback(async () => {
    setError(null)

    const paths = await apiGet<LearningPath[]>('/paths')
    if (paths.length === 0) {
      throw new Error('No learning paths found')
    }

    const fullPath = await apiGet<LearningPath>(`/paths/${paths[0].id}`)
    setPath(fullPath)
  }, [])

  useEffect(() => {
    loadPath().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load path'))
  }, [loadPath])

  const nextOrderIndex = useMemo(() => {
    if (!path?.topics?.length) {
      return 1
    }

    return Math.max(...path.topics.map((topic) => topic.order_index)) + 1
  }, [path])

  const resetForm = () => {
    setTopicTitle('')
    setTopicDescription('')
    setTopicPriority('medium')
    setFormError(null)
  }

  const handleAddTopic = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!path) {
      return
    }

    const trimmedTitle = topicTitle.trim()
    if (!trimmedTitle) {
      setFormError('Topic title is required.')
      return
    }

    setIsSaving(true)
    setFormError(null)

    try {
      await apiPost<Topic>(`/paths/${path.id}/topics`, {
        title: trimmedTitle,
        description: topicDescription.trim() || null,
        priority: topicPriority,
        order_index: nextOrderIndex,
      })
      await loadPath()
      resetForm()
      setShowAddForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add topic')
    } finally {
      setIsSaving(false)
    }
  }

  if (error) {
    return <div className="page"><div className="card">Path error: {error}</div></div>
  }

  if (!path) {
    return <div className="page"><div className="card">Loading path…</div></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{path.title}</h1>
          <p className="muted">{path.description ?? 'Structured theory + practice path.'}</p>
        </div>
        <button className="primary" onClick={() => {
          setShowAddForm((current) => !current)
          setFormError(null)
        }}>
          {showAddForm ? 'Close' : 'Add topic'}
        </button>
      </div>

      {showAddForm && (
        <section className="card inline-form-card">
          <form className="inline-form" onSubmit={handleAddTopic}>
            <div className="inline-form-grid inline-form-grid-two">
              <label className="form-field inline-form-field-wide">
                <span>Title</span>
                <input
                  autoFocus
                  placeholder="e.g. Vector databases"
                  value={topicTitle}
                  onChange={(event) => setTopicTitle(event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Priority</span>
                <select value={topicPriority} onChange={(event) => setTopicPriority(event.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label className="form-field inline-form-field-wide">
                <span>Description</span>
                <textarea
                  rows={3}
                  placeholder="Optional context or study goal"
                  value={topicDescription}
                  onChange={(event) => setTopicDescription(event.target.value)}
                />
              </label>
            </div>

            {formError && <div className="auth-error">{formError}</div>}

            <div className="inline-actions">
              <button className="primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Adding…' : 'Create topic'}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  resetForm()
                  setShowAddForm(false)
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card">
        <h2>Topics</h2>
        <div className="topic-list">
          {path.topics?.map((topic) => (
            <div key={topic.id} className="topic-row">
              <div>
                <strong>{topic.title}</strong>
                {topic.description && <p className="muted">{topic.description}</p>}
              </div>
              <div className="topic-row-actions">
                <span className={`badge ${topic.status}`}>{topic.status.replace('_', ' ')}</span>
                <button className="secondary-button" onClick={() => onOpenTopic(topic.id)}>Open</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
