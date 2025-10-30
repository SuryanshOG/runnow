import { useState } from 'react'
import { api } from '../utils/api'
import { useAppStore } from '../stores/appStore'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAppStore(s => s.setAuth)

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form)
      setAuth(res.user, res.token)
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{mode === 'login' ? 'Welcome back' : 'Create account'}</h3>
          <button className="btn btn-ghost" onClick={onClose}>×</button>
        </div>
        <div className="modal-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <input placeholder="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          )}
          <input placeholder="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input placeholder="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          {err && <div className="form-error">{err}</div>}
          <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <div className="modal-foot">
          <a href="/api/auth/github/callback" className="btn btn-ghost btn-block">Continue with GitHub</a>
          <p className="muted">JWT auth • MongoDB persistence • workspaces saved per user</p>
        </div>
      </div>
    </div>
  )
}
