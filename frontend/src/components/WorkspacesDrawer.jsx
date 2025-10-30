import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import { useAppStore } from '../stores/appStore'

export default function WorkspacesDrawer({ onClose }) {
  const workspaces = useAppStore(s => s.workspaces)
  const setWorkspaces = useAppStore(s => s.setWorkspaces)
  const loadWorkspace = useAppStore(s => s.loadWorkspace)
  const user = useAppStore(s => s.user)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listWorkspaces().then(setWorkspaces).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function openWs(ws) {
    try {
      const full = await api.getWorkspace(ws.id || ws._id)
      loadWorkspace(full)
      onClose()
    } catch (e) {
      alert(e.message)
    }
  }

  async function remove(id) {
    if (!confirm('Delete workspace?')) return
    await api.deleteWorkspace(id)
    setWorkspaces(workspaces.filter(w => (w.id || w._id) !== id))
  }

  async function fork(id) {
    const ws = await api.forkWorkspace(id)
    setWorkspaces([ws, ...workspaces])
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <h3>Workspaces</h3>
          <button className="btn btn-ghost" onClick={onClose}>×</button>
        </div>
        {!user && <div className="drawer-notice">Sign in to persist workspaces to MongoDB</div>}
        {loading ? <div className="muted" style={{ padding: 16 }}>loading...</div> : workspaces.length === 0 ? (
          <div className="muted" style={{ padding: 16 }}>No workspaces yet. Save one from the editor.</div>
        ) : (
          <div className="workspace-list">
            {workspaces.map(ws => (
              <div key={ws.id || ws._id} className="workspace-card" onClick={() => openWs(ws)}>
                <div className="ws-title">{ws.title}</div>
                <div className="ws-meta">{ws.language} • {ws.files?.length || 0} files • {new Date(ws.updated_at || ws.updatedAt).toLocaleDateString()}</div>
                <div className="ws-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-small" onClick={() => fork(ws.id || ws._id)}>Fork</button>
                  <button className="btn btn-small btn-danger" onClick={() => remove(ws.id || ws._id)}>Delete</button>
                  {ws.share_id && <span className="share-pill small">/{ws.share_id}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
