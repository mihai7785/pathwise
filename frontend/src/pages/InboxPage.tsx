import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { apiDelete, apiGet, apiPost } from '../lib/api'
import type { LearningPath, Resource, TopicLinkResponse } from '../types'

type TopicOption = {
  id: string
  title: string
  pathTitle: string
}

export function InboxPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [topics, setTopics] = useState<TopicOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [resourceType, setResourceType] = useState('link')
  const [title, setTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [rawText, setRawText] = useState('')
  const [selectedTopicByResource, setSelectedTopicByResource] = useState<Record<string, string>>({})
  const [linkingResourceId, setLinkingResourceId] = useState<string | null>(null)
  const [linkErrorByResource, setLinkErrorByResource] = useState<Record<string, string>>({})
  const [resourceActionError, setResourceActionError] = useState<string | null>(null)

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
        <h2>Resources</h2>
        {resourceActionError && <div className="auth-error bottom-spacing">{resourceActionError}</div>}
        <div className="resource-list">
          {resources.map((resource) => {
            const selectedTopicId = selectedTopicByResource[resource.id] ?? suggestedTopicByResource[resource.id] ?? ''

            return (
              <div key={resource.id} className="resource-row">
                <div className="resource-content">
                  <div className="resource-heading">
                    <strong>{resource.title || 'Untitled resource'}</strong>
                    <button
                      className="danger-button"
                      onClick={() => handleDeleteResource(resource)}
                      disabled={deletingResourceId === resource.id}
                    >
                      {deletingResourceId === resource.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                  <div className="muted small">{resource.type} • {resource.status}</div>
                  <p>{resource.summary}</p>
                  {resource.suggestions[0] && (
                    <div className="muted small">
                      Suggested topic: {resource.suggestions[0].topic_title} ({Math.round((resource.suggestions[0].confidence_score ?? 0) * 100)}%)
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
                      disabled={topics.length === 0 || linkingResourceId === resource.id || deletingResourceId === resource.id}
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
                    disabled={topics.length === 0 || linkingResourceId === resource.id || deletingResourceId === resource.id || !selectedTopicId}
                  >
                    {linkingResourceId === resource.id ? 'Linking…' : 'Link topic'}
                  </button>
                  {linkErrorByResource[resource.id] && <div className="auth-error">{linkErrorByResource[resource.id]}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
