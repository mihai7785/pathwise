import { useEffect, useState } from 'react'

import { apiGet } from '../lib/api'
import type { CopilotContext } from '../types'

export function CopilotPage() {
  const [context, setContext] = useState<CopilotContext | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<CopilotContext>('/copilot/conversation')
      .then(setContext)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load copilot context'))
  }, [])

  if (error) {
    return <div className="page"><div className="card">Copilot error: {error}</div></div>
  }

  if (!context) {
    return <div className="page"><div className="card">Loading copilot…</div></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{context.title}</h1>
          <p className="muted">Context-aware study help grounded in your paths, topics, and resources.</p>
        </div>
      </div>

      <section className="card copilot-card">
        {context.starter_prompts.map((prompt, index) => (
          <div key={prompt} className={`message ${index % 2 === 0 ? 'assistant' : 'user'}`}>{prompt}</div>
        ))}
        <div className="message assistant">{context.provider_strategy}</div>
        <div className="copilot-input-row">
          <input placeholder="Ask the copilot something..." />
          <button className="primary">Send</button>
        </div>
      </section>
    </div>
  )
}
