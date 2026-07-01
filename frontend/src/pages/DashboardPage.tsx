import { useEffect, useState } from 'react'

import { StatCard } from '../components/StatCard'
import { apiGet } from '../lib/api'
import type { DashboardData } from '../types'

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<DashboardData>('/dashboard')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
  }, [])

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
      </div>

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
