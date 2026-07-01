import { FormEvent, useCallback, useEffect, useState } from 'react'

import { StatCard } from '../components/StatCard'
import { apiGet, apiPost } from '../lib/api'
import type { DashboardData } from '../types'

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreatePath, setShowCreatePath] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetRole, setTargetRole] = useState('')

  const loadDashboard = useCallback(async () => {
    setError(null)
    const dashboard = await apiGet<DashboardData>('/dashboard')
    setData(dashboard)
  }, [])

  useEffect(() => {
    loadDashboard().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
  }, [loadDashboard])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setTargetRole('')
    setFormError(null)
  }

  const handleCreatePath = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setFormError('Path title is required.')
      return
    }

    setIsSaving(true)
    setFormError(null)
    try {
      await apiPost('/paths', {
        title: trimmedTitle,
        description: description.trim() || null,
        target_role: targetRole.trim() || null,
      })
      await loadDashboard()
      resetForm()
      setShowCreatePath(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create path')
    } finally {
      setIsSaving(false)
    }
  }

  if (error) {
    return <div className="page"><div className="card">Dashboard error: {error}</div></div>
  }

  if (!data) {
    return <div className="page"><div className="card">Loading dashboard…</div></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Track learning paths, inbox items, and next study steps.</p>
        </div>
        <button className="primary" onClick={() => setShowCreatePath((current) => !current)}>
          {showCreatePath ? 'Close' : 'Create path'}
        </button>
      </div>

      {showCreatePath && (
        <section className="card inline-form-card">
          <form className="inline-form" onSubmit={handleCreatePath}>
            <div className="inline-form-grid inline-form-grid-two">
              <label className="form-field inline-form-field-wide">
                <span>Path title</span>
                <input
                  autoFocus
                  placeholder="e.g. AI Engineer"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Target role</span>
                <input
                  placeholder="Optional"
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                />
              </label>
              <label className="form-field inline-form-field-wide">
                <span>Description</span>
                <textarea
                  rows={3}
                  placeholder="Optional description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            <div className="inline-actions">
              <button className="primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Creating…' : 'Create path'}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  resetForm()
                  setShowCreatePath(false)
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="stats-grid">
        <StatCard label="Learning paths" value={data.summary.paths} />
        <StatCard label="Topics" value={data.summary.topics} />
        <StatCard label="Inbox resources" value={data.summary.inbox_count} />
        <StatCard label="Resources" value={data.summary.resources} />
      </div>

      <div className="two-col">
        <section className="card">
          <h2>Suggested next topics</h2>
          <ul>
            {data.next_topics.map((topic) => (
              <li key={topic.id}>{topic.title}</li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2>Copilot suggestions</h2>
          <ul>
            {data.copilot_suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
