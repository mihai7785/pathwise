import { useEffect, useState } from 'react'

import { apiGet } from '../lib/api'
import type { LearningPath } from '../types'

export function PathPage() {
  const [path, setPath] = useState<LearningPath | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<LearningPath[]>('/paths')
      .then((paths) => {
        if (paths.length === 0) {
          throw new Error('No learning paths found')
        }
        return apiGet<LearningPath>(`/paths/${paths[0].id}`)
      })
      .then(setPath)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load path'))
  }, [])

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
        <button className="primary">Add topic</button>
      </div>

      <section className="card">
        <h2>Topics</h2>
        <div className="topic-list">
          {path.topics?.map((topic) => (
            <div key={topic.id} className="topic-row">
              <div>
                <strong>{topic.title}</strong>
              </div>
              <span className={`badge ${topic.status}`}>{topic.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
