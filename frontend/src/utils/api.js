const BASE = ''

function authHeader() {
  const t = localStorage.getItem('runnow_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(opts.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `request failed ${res.status}`)
  return data
}

export const api = {
  register: (b) => req('/api/auth/register', { method: 'POST', body: JSON.stringify(b) }),
  login: (b) => req('/api/auth/login', { method: 'POST', body: JSON.stringify(b) }),
  me: () => req('/api/auth/me'),
  runtimes: () => req('/api/runtimes').catch(() => req('/api/languages')),
  languages: () => req('/api/languages'),
  execute: (b) => req('/api/execute', { method: 'POST', body: JSON.stringify(b) }),
  listWorkspaces: () => req('/api/workspaces'),
  getWorkspace: (id) => req(`/api/workspaces/${id}`),
  createWorkspace: (b) => req('/api/workspaces', { method: 'POST', body: JSON.stringify(b) }),
  updateWorkspace: (id, b) => req(`/api/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  deleteWorkspace: (id) => req(`/api/workspaces/${id}`, { method: 'DELETE' }),
  forkWorkspace: (id) => req(`/api/workspaces/${id}/fork`, { method: 'POST' }),
  shareWorkspace: (id, b) => req(`/api/workspaces/${id}/share`, { method: 'POST', body: JSON.stringify(b || {}) }),
  getShare: (sid) => req(`/api/shares/${sid}`),
}
