import { useSyncExternalStore } from 'react'

const AUTH_STORAGE_KEY = 'learning-copilot.auth'

export type AuthUser = {
  id?: string
  email: string
  name: string
}

export type AuthSession = {
  token: string
  user: AuthUser
}

type LoginResponse = {
  token?: string
  access_token?: string
  user?: Partial<AuthUser> & Record<string, unknown>
  id?: string
  email?: string
  name?: string
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function readStoredSession(): AuthSession | null {
  if (!isBrowser()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (!parsed.token || !parsed.user?.email || !parsed.user?.name) {
      return null
    }

    return {
      token: parsed.token,
      user: {
        id: parsed.user.id,
        email: parsed.user.email,
        name: parsed.user.name,
      },
    }
  } catch {
    return null
  }
}

let currentSession = readStoredSession()
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function persistSession(session: AuthSession | null) {
  currentSession = session

  if (isBrowser()) {
    if (session) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  emitChange()
}

export function createAuthSession(payload: LoginResponse): AuthSession {
  const token = payload.token ?? payload.access_token
  const rawUser = payload.user ?? payload
  const email = rawUser.email
  const name = rawUser.name ?? rawUser.email

  if (!token || !email || !name) {
    throw new Error('Login response is missing token or user details')
  }

  return {
    token,
    user: {
      id: typeof rawUser.id === 'string' ? rawUser.id : undefined,
      email,
      name,
    },
  }
}

export const authStore = {
  getSnapshot: () => currentSession,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  setSession(session: AuthSession) {
    persistSession(session)
  },
  clearSession() {
    persistSession(null)
  },
}

export function useAuth() {
  const session = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, () => null)

  return {
    session,
    isAuthenticated: Boolean(session?.token),
    setSession: authStore.setSession,
    clearSession: authStore.clearSession,
  }
}
