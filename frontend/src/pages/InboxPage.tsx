import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { apiDelete, apiGet, apiPost } from '../lib/api'
import type { LearningPath, Resource, TopicLinkResponse } from '../types'

type TopicOption = {
  id: string
  title: string
  pathTitle: string
}

type ProcessingState = {
  phase: 'starting' | 'success' | 'error'
  message: string
}

export function InboxPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [topics, setTopics] = useState<TopicOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null)
  const [processingResourceId, setProcessingResourceId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [resourceType, setResourceType] = useState('link')
  const [title, setTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [rawText, setRawText] = useState('')
  const [selectedTopicByResource, setSelectedTopicByResource] = useState<Record<string, string>>({})
  const [linkingResourceId, setLinkingResourceId] = useState<string | null>(null)
  const [linkErrorByResource, setLinkErrorByResource] = useState<Record<string, string>>({})
  const [resourceActionError, setResourceActionError] = useState<string | null>(null)
  const [processingStateByResource, setProcessingStateByResource] = useState<Record<string, ProcessingState>>({})

  const loadResources = useCallback(async () => {
    const nextResources = await apiGet<Resource[]>('/resources')
    setResources(nextResources)
  }, [])

  const loadTopics = useCallback(async () => {
    const paths = await apiGet<LearningPath[]>('/paths')
    const pathDetails = await Promise.all(paths.map((path) => apiGet<LearningPath>(`/paths/${path.id}`)))
    const nextTopics = pathDetails.flatMap((path) =>
      (path.topics ?? []).map((topic) => ({
        id: topic.id,
        title: topic.title,
        pathTitle: path.title,
      })),
    )
    setTopics(nextTopics)
  }, [])

  const loadInbox = useCallback(async () => {
    setError(null)
    await Promise.all([loadResources(), loadTopics()])
  }, [loadResources, loadTopics])

  useEffect(() => {
    loadInbox().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load inbox'))
  }, [loadInbox])

  const resetForm = () => {
    setResourceType('link')
    setTitle('')
    setSourceUrl('')
    setRawText('')
    setFormError(null)
  }

  const suggestedTopicByResource = useMemo(() => {
    return Object.fromEntries(
      resources.map((resource) => [resource.id, resource.suggestions[0]?.topic_id ?? '']),
    )
  }, [resources])

  const handleAddResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedSourceUrl = sourceUrl.trim()
    const trimmedRawText = rawText.trim()

    if (resourceType === 'link' && !trimmedSourceUrl) {
      setFormError('Source URL is required for link resources.')
      return
    }

    if (resourceType === 'text' && !trimmedRawText) {
      setFormError('Paste some text for text resources.')
      return
    }

    setIsSaving(true)
    setFormError(null)

    try {
      await apiPost<Resource>('/resources', {
        type: resourceType,
        title: trimmedTitle || null,
        source_url: trimmedSourceUrl || null,
        raw_text: trimmedRawText || null,
      })
      await loadResources()
      resetForm()
      setShowAddForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add resource')
    } finally {
      setIsSaving(false)
    }
  }

  const handleProcessResource = async (resource: Resource) => {
    setProcessingResourceId(resource.id)
    setResourceActionError(null)
    setProcessingStateByResource((current) => ({
      ...current,
      [resource.id]: { phase: 'starting', message: 'Processing resource…' },
    }))

    try {
      await apiPost<Resource>(`/resources/${resource.id}/process`, {})
      await loadResources()
      setProcessingStateByResource((current) => ({
        ...current,
        [resource.id]: { phase: 'success', message: 'Summary and suggestions refreshed.' },
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process resource'
      setProcessingStateByResource((current) => ({
        ...current,
        [resource.id]: { phase: 'error', message },
      }))
      setResourceActionError(message)
    } finally {
      setProcessingResourceId(null)
    }
  }

  const handleLinkTopic = async (resourceId: string) => {
    const topicId = selectedTopicByResource[resourceId] || suggestedTopicByResource[resourceId]
    if (!topicId) {
      setLinkErrorByResource((current) => ({ ...current, [resourceId]: 'Choose a topic first.' }))
      return
    }

    setLinkingResourceId(resourceId)
    setLinkErrorByResource((current) => ({ ...current, [resourceId]: '' }))

    try {
      await apiPost<TopicLinkResponse>(`/resources/${resourceId}/link-topic`, { topic_id: topicId })
      await loadResources()
    } catch (err) {
      setLinkErrorByResource((current) => ({
        ...current,
        [resourceId]: err instanceof Error ? err.message : 'Failed to link resource to topic',
      }))
    } finally {
      setLinkingResourceId(null)
    }
  }

  const handleDeleteResource = async (resource: Resource) => {
    const confirmed = window.confirm(`Delete resource "${resource.title || 'Untitled resource'}"?`)
    if (!confirmed) {
      return
    }

    setDeletingResourceId(resource.id)
    setResourceActionError(null)

    try {
      await apiDelete(`/resources/${resource.id}`)
      await loadResources()
    } catch (err) {
      setResourceActionError(err instanceof Error ? err.message : 'Failed to delete resource')
    } finally {
      setDeletingResourceId(null)
    }
  }

  if (error) {
    return <div className="page"><div className="card">Inbox error: {error}</div></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Inbox</h1>
          <p className="muted">Process captured links, notes, and screenshots.</p>
        </div>
        <button className="primary" onClick={() => {
          setShowAddForm((current) => !current)
          setFormError(null)
        }}>
          {showAddForm ? 'Close' : 'Add resource'}
        </button>
      </div>

      {showAddForm && (
        <section className="card inline-form-card">
          <form className="inline-form" onSubmit={handleAddResource}>
            <div className="inline-form-grid inline-form-grid-two">
              <label className="form-field">
                <span>Type</span>
                <select value={resourceType} onChange={(event) => setResourceType(event.target.value)}>
                  <option value="link">Link</option>
                  <option value="text">Text note</option>
                  <option value="image">Image</option>
                </select>
              </label>

              <label className="form-field inline-form-field-wide">
                <span>Title</span>
                <input
                  autoFocus
                  placeholder="Optional label"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <label className="form-field inline-form-field-wide">
                <span>Source URL</span>
                <input
                  placeholder={resourceType === 'link' ? 'https://example.com/article' : 'Optional URL'}
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                />
              </label>

              <label className="form-field inline-form-field-wide">
                <span>{resourceType === 'text' ? 'Text' : 'Notes'}</span>
                <textarea
                  rows={4}
                  placeholder={resourceType === 'text' ? 'Paste text, notes, or a summary' : 'Optional notes'}
                  value={rawText}
                  onChange={(event) => setRawText(event.target.value)}
                />
              </label>
            </div>

            {formError && <div className="auth-error">{formError}</div>}

            <div className="inline-actions">
              <button className="primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Adding…' : 'Create resource'}
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
        <div className="resource-section-header">
          <div>
            <h2>Resources</h2>
            <p className="muted">Run processing to extract a summary and generate topic suggestions for each item.</p>
          </div>
          <span className="badge not_started">{resources.length} total</span>
        </div>

        {resourceActionError && <div className="auth-error bottom-spacing">{resourceActionError}</div>}

        <div className="resource-list resource-processing-list">
          {resources.map((resource) => {
            const selectedTopicId = selectedTopicByResource[resource.id] ?? suggestedTopicByResource[resource.id] ?? ''
            const processingState = processingStateByResource[resource.id]
            const linkedTopics = resource.linked_topics ?? []
            const isProcessing = processingState?.phase === 'starting'

            return (
              <article key={resource.id} className="resource-processing-card">
                <div className="resource-card-main">
                  <div className="resource-heading">
                    <div>
                      <strong>{resource.title || 'Untitled resource'}</strong>
                      <div className="muted small">
                        {resource.type} • {resource.status}
                        {resource.source_url ? ` • ${resource.source_url}` : ''}
                      </div>
                    </div>
                    <div className="resource-inline-actions">
                      <button
                        className={processingState?.phase === 'success' ? 'primary' : 'secondary-button'}
                        onClick={() => handleProcessResource(resource)}
                        disabled={isProcessing || deletingResourceId === resource.id}
                      >
                        {isProcessing ? 'Processing…' : 'Process'}
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => handleDeleteResource(resource)}
                        disabled={deletingResourceId === resource.id || isProcessing}
                      >
                        {deletingResourceId === resource.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  <p>{resource.summary ?? 'No summary yet. Process this resource to generate one.'}</p>

                  {resource.extracted_text && (
                    <div className="resource-meta-block">
                      <span className="muted small">Extracted text</span>
                      <p className="muted small">
                        {resource.extracted_text.length > 220 ? `${resource.extracted_text.slice(0, 220)}…` : resource.extracted_text}
                      </p>
                    </div>
                  )}

                  {linkedTopics.length > 0 && (
                    <div className="resource-meta-block">
                      <span className="muted small">Linked topics</span>
                      <div className="linked-topic-list">
                        {linkedTopics.map((topic) => (
                          <span key={`${resource.id}-${topic.topic_id}`} className="linked-topic-pill">
                            {topic.topic_title ?? 'Untitled topic'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {resource.suggestions.length > 0 && (
                    <div className="resource-meta-block">
                      <span className="muted small">Suggested topics</span>
                      <div className="resource-suggestion-list">
                        {resource.suggestions.map((suggestion) => (
                          <div key={`${resource.id}-${suggestion.topic_id}`} className="resource-suggestion-item">
                            <strong>{suggestion.topic_title ?? 'Untitled topic'}</strong>
                            <div className="muted small">
                              {typeof suggestion.confidence_score === 'number' ? `${Math.round((suggestion.confidence_score > 1 ? suggestion.confidence_score : suggestion.confidence_score * 100))}% confidence` : 'Suggested'}
                              {suggestion.reason ? ` · ${suggestion.reason}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resource.latest_job && (
                    <div className="muted small">Last run: {resource.latest_job.provider ?? 'local'} · {resource.latest_job.status}</div>
                  )}

                  {processingState && (
                    <div className={`resource-process-state ${processingState.phase === 'error' ? 'error' : processingState.phase === 'success' ? 'success' : ''}`}>
                      {processingState.message}
                    </div>
                  )}
                </div>

                <div className="resource-linker">
                  <label className="form-field">
                    <span>Link to topic</span>
                    <select
                      value={selectedTopicId}
                      onChange={(event) => {
                        const value = event.target.value
                        setSelectedTopicByResource((current) => ({ ...current, [resource.id]: value }))
                      }}
                      disabled={topics.length === 0 || linkingResourceId === resource.id || deletingResourceId === resource.id || isProcessing}
                    >
                      <option value="">Select a topic</option>
                      {topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>{topic.title} · {topic.pathTitle}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="secondary-button"
                    onClick={() => handleLinkTopic(resource.id)}
                    disabled={topics.length === 0 || linkingResourceId === resource.id || deletingResourceId === resource.id || isProcessing || !selectedTopicId}
                  >
                    {linkingResourceId === resource.id ? 'Linking…' : 'Link topic'}
                  </button>
                  {linkErrorByResource[resource.id] && <div className="auth-error">{linkErrorByResource[resource.id]}</div>}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
