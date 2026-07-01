import { FormEvent, useCallback, useEffect, useState } from 'react'

import { apiGet, apiPost } from '../lib/api'
import type { Resource } from '../types'

export function InboxPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [resourceType, setResourceType] = useState('link')
  const [title, setTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [rawText, setRawText] = useState('')

  const loadResources = useCallback(async () => {
    setError(null)
    const nextResources = await apiGet<Resource[]>('/resources')
    setResources(nextResources)
  }, [])

  useEffect(() => {
    loadResources().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load resources'))
  }, [loadResources])

  const resetForm = () => {
    setResourceType('link')
    setTitle('')
    setSourceUrl('')
    setRawText('')
    setFormError(null)
  }

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
        <div className="resource-list">
          {resources.map((resource) => (
            <div key={resource.id} className="resource-row">
              <div>
                <strong>{resource.title}</strong>
                <div className="muted small">{resource.type} • {resource.status}</div>
                <p>{resource.summary}</p>
                {resource.suggestions[0] && (
                  <div className="muted small">
                    Suggested topic: {resource.suggestions[0].topic_title} ({Math.round((resource.suggestions[0].confidence_score ?? 0) * 100)}%)
                  </div>
                )}
              </div>
              <button>Suggest topic</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
