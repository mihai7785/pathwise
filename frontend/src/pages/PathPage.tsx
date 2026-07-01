import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { apiGet, apiPost } from '../lib/api'
import type { LearningPath, Topic } from '../types'

type Props = {
  onOpenTopic: (topicId: string) => void
}

export function PathPage({ onOpenTopic }: Props) {
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [selectedPathId, setSelectedPathId] = useState<string>('')
  const [path, setPath] = useState<LearningPath | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAddTopicForm, setShowAddTopicForm] = useState(false)
  const [showCreatePathForm, setShowCreatePathForm] = useState(false)
  const [isSavingTopic, setIsSavingTopic] = useState(false)
  const [isCreatingPath, setIsCreatingPath] = useState(false)
  const [topicFormError, setTopicFormError] = useState<string | null>(null)
  const [pathFormError, setPathFormError] = useState<string | null>(null)
  const [topicTitle, setTopicTitle] = useState('')
  const [topicDescription, setTopicDescription] = useState('')
  const [topicPriority, setTopicPriority] = useState('medium')
  const [pathTitle, setPathTitle] = useState('')
  const [pathDescription, setPathDescription] = useState('')
  const [pathTargetRole, setPathTargetRole] = useState('')

  const loadPathData = useCallback(async (preferredPathId?: string) => {
    setError(null)

    const nextPaths = await apiGet<LearningPath[]>('/paths')
    setPaths(nextPaths)

    if (nextPaths.length === 0) {
      setSelectedPathId('')
      setPath(null)
      return
    }

    const resolvedPathId = preferredPathId && nextPaths.some((candidate) => candidate.id === preferredPathId)
      ? preferredPathId
      : selectedPathId && nextPaths.some((candidate) => candidate.id === selectedPathId)
        ? selectedPathId
        : nextPaths[0].id

    setSelectedPathId(resolvedPathId)

    const fullPath = await apiGet<LearningPath>(`/paths/${resolvedPathId}`)
    setPath(fullPath)
  }, [selectedPathId])

  useEffect(() => {
    loadPathData().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load paths'))
  }, [loadPathData])

  const nextOrderIndex = useMemo(() => {
    if (!path?.topics?.length) {
      return 1
    }

    return Math.max(...path.topics.map((topic) => topic.order_index)) + 1
  }, [path])

  const resetTopicForm = () => {
    setTopicTitle('')
    setTopicDescription('')
    setTopicPriority('medium')
    setTopicFormError(null)
  }

  const resetPathForm = () => {
    setPathTitle('')
    setPathDescription('')
    setPathTargetRole('')
    setPathFormError(null)
  }

  const handleCreatePath = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = pathTitle.trim()
    if (!trimmedTitle) {
      setPathFormError('Path title is required.')
      return
    }

    setIsCreatingPath(true)
    setPathFormError(null)

    try {
      const createdPath = await apiPost<LearningPath>('/paths', {
        title: trimmedTitle,
        description: pathDescription.trim() || null,
        target_role: pathTargetRole.trim() || null,
        status: 'active',
      })
      await loadPathData(createdPath.id)
      resetPathForm()
      setShowCreatePathForm(false)
      setShowAddTopicForm(false)
    } catch (err) {
      setPathFormError(err instanceof Error ? err.message : 'Failed to create path')
    } finally {
      setIsCreatingPath(false)
    }
  }

  const handleAddTopic = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!path) {
      return
    }

    const trimmedTitle = topicTitle.trim()
    if (!trimmedTitle) {
      setTopicFormError('Topic title is required.')
      return
    }

    setIsSavingTopic(true)
    setTopicFormError(null)

    try {
      await apiPost<Topic>(`/paths/${path.id}/topics`, {
        title: trimmedTitle,
        description: topicDescription.trim() || null,
        priority: topicPriority,
        order_index: nextOrderIndex,
      })
      await loadPathData(path.id)
      resetTopicForm()
      setShowAddTopicForm(false)
    } catch (err) {
      setTopicFormError(err instanceof Error ? err.message : 'Failed to add topic')
    } finally {
      setIsSavingTopic(false)
    }
  }

  if (error) {
    return <div className="page"><div className="card">Path error: {error}</div></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{path?.title ?? 'Learning paths'}</h1>
          <p className="muted">Create a path, switch between paths, and keep topics moving.</p>
        </div>
        <div className="header-actions">
          <button
            className="secondary-button"
            onClick={() => {
              setShowCreatePathForm((current) => !current)
              setPathFormError(null)
            }}
          >
            {showCreatePathForm ? 'Close path form' : 'Create path'}
          </button>
          <button
            className="primary"
            onClick={() => {
              setShowAddTopicForm((current) => !current)
              setTopicFormError(null)
            }}
            disabled={!path}
          >
            {showAddTopicForm ? 'Close topic form' : 'Add topic'}
          </button>
        </div>
      </div>

      <section className="card inline-form-card">
        <div className="inline-form-grid inline-form-grid-two compact-grid">
          <label className="form-field inline-form-field-wide">
            <span>Current learning path</span>
            <select
              value={selectedPathId}
              onChange={(event) => {
                const nextPathId = event.target.value
                setSelectedPathId(nextPathId)
                loadPathData(nextPathId).catch((err) => setError(err instanceof Error ? err.message : 'Failed to switch path'))
              }}
              disabled={paths.length === 0}
            >
              {paths.length === 0 ? (
                <option value="">No paths yet</option>
              ) : (
                paths.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>{candidate.title}</option>
                ))
              )}
            </select>
          </label>

          {path && (
            <div className="path-meta muted small">
              Status: {path.status} • {path.topics?.length ?? 0} topic{path.topics?.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
      </section>

      {showCreatePathForm && (
        <section className="card inline-form-card">
          <form className="inline-form" onSubmit={handleCreatePath}>
            <div className="inline-form-grid inline-form-grid-two">
              <label className="form-field inline-form-field-wide">
                <span>Path title</span>
                <input
                  autoFocus
                  placeholder="e.g. Applied AI engineer"
                  value={pathTitle}
                  onChange={(event) => setPathTitle(event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Target role</span>
                <input
                  placeholder="Optional"
                  value={pathTargetRole}
                  onChange={(event) => setPathTargetRole(event.target.value)}
                />
              </label>

              <label className="form-field inline-form-field-wide">
                <span>Description</span>
                <textarea
                  rows={3}
                  placeholder="What are you trying to learn?"
                  value={pathDescription}
                  onChange={(event) => setPathDescription(event.target.value)}
                />
              </label>
            </div>

            {pathFormError && <div className="auth-error">{pathFormError}</div>}

            <div className="inline-actions">
              <button className="primary" type="submit" disabled={isCreatingPath}>
                {isCreatingPath ? 'Creating…' : 'Create learning path'}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  resetPathForm()
                  setShowCreatePathForm(false)
                }}
                disabled={isCreatingPath}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {showAddTopicForm && (
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

            {topicFormError && <div className="auth-error">{topicFormError}</div>}

            <div className="inline-actions">
              <button className="primary" type="submit" disabled={isSavingTopic || !path}>
                {isSavingTopic ? 'Adding…' : 'Create topic'}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  resetTopicForm()
                  setShowAddTopicForm(false)
                }}
                disabled={isSavingTopic}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {!path ? (
        <section className="card">
          <h2>No learning path yet</h2>
          <p className="muted">Create your first path to start organizing topics and resources.</p>
        </section>
      ) : (
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
            {path.topics?.length === 0 && (
              <p className="muted">No topics yet. Add the first topic for this path.</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
