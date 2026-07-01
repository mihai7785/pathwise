import { useEffect, useState } from 'react'

import { apiGet } from '../lib/api'
import type { Resource } from '../types'

export function InboxPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<Resource[]>('/resources')
      .then(setResources)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load resources'))
  }, [])

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
        <button className="primary">Add resource</button>
      </div>

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
