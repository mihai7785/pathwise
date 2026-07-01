import { authStore } from './auth'

const API_BASE = '/api'

type ApiRequestOptions = RequestInit & {
  auth?: boolean
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...init } = options
  const requestHeaders = new Headers(headers)

  if (auth) {
    const token = authStore.getSnapshot()?.token
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: requestHeaders,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export async function apiGet<T>(path: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'GET' })
}

export async function apiPost<T>(path: string, body: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
  const requestHeaders = new Headers(options?.headers)
  requestHeaders.set('Content-Type', 'application/json')

  return apiRequest<T>(path, {
    ...options,
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(body),
  })
}

export async function apiPatch<T>(path: string, body: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
  const requestHeaders = new Headers(options?.headers)
  requestHeaders.set('Content-Type', 'application/json')

  return apiRequest<T>(path, {
    ...options,
    method: 'PATCH',
    headers: requestHeaders,
    body: JSON.stringify(body),
  })
}

export async function apiDelete<T>(path: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'DELETE' })
}
