import { FormEvent, useState } from 'react'

import { apiPost } from '../lib/api'
import { createAuthSession, type AuthSession } from '../lib/auth'

type Props = {
  onLogin: (session: AuthSession) => void
}

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload = await apiPost<Record<string, unknown>>(
        '/auth/dev-login',
        { email: email.trim(), name: name.trim() },
        { auth: false },
      )

      onLogin(createAuthSession(payload))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div>
          <div className="auth-eyebrow">Pathwise</div>
          <h1>Sign in</h1>
          <p className="muted">Use the dev login endpoint to start a local authenticated session.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Name</span>
            <input
              required
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="ada@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
