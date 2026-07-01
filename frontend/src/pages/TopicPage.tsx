import { useEffect, useState } from 'react'

import { apiGet } from '../lib/api'
import type { TopicDetail } from '../types'

type Props = {
  topicId: string | null
}

export function TopicPage({ topicId }: Props) {
  const [topic, setTopic] = useState<TopicDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!topicId) {
      setTopic(null)
      setError(null)
      return
    }
    apiGet<TopicDetail>(`/topics/${topicId}`)
      .then((result) => {
        setTopic(result)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load topic'))
  }, [topicId])

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
          <p className="muted">{topic.description ?? 'Retrieval-augmented generation fundamentals and implementation.'}</p>
        </div>
      </div>

      <div className="two-col">
        <section className="card">
          <h2>Topic overview</h2>
          <p>
            Learn chunking, embedding retrieval, grounding, evaluation, and when RAG is better than fine-tuning.
          </p>
          <div className="actions">
            {topic.ai_actions.map((action, index) => (
              <button key={action} className={index === 0 ? 'primary' : ''}>{action}</button>
            ))}
          </div>
        </section>
        <section className="card">
          <h2>Linked resources</h2>
          <ul>
            {topic.resources.map((resource) => (
              <li key={resource.id}>{resource.title}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
