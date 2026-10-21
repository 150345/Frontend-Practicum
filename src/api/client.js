/**
 * Thin wrapper around the Juniper API.
 *
 * Every request sends the session cookie (`credentials: 'include'`) so the
 * server can recognise a signed-in visitor.
 *
 * `VITE_API_URL` is the absolute URL of the deployed API. When it is not set
 * we fall back to a relative `/api` path, which the Vite dev server proxies to
 * the local API — that keeps the session cookie same-origin in development.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new ApiError(payload?.error ?? 'Something went wrong. Please try again.', response.status)
  }

  return payload
}

export const api = {
  getMenu: () => request('/api/menu'),
  getMenuItem: (slug) => request(`/api/menu/${encodeURIComponent(slug)}`),
  signup: ({ name, email, password }) =>
    request('/api/auth/signup', { method: 'POST', body: { name, email, password } }),
  login: ({ email, password }) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),
  listSelections: () => request('/api/selections'),
  saveSelection: (name, items) => request('/api/selections', { method: 'POST', body: { name, items } }),
  deleteSelection: (id) => request(`/api/selections/${id}`, { method: 'DELETE' }),
}

export { API_BASE_URL }
