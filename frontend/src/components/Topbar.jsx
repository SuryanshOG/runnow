import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { api } from '../utils/api'
import { allLanguages } from '../utils/languages'
import { executeWorkspace } from '../utils/runner'

export default function Topbar({ onShowAuth, onShowWorkspaces }) {
  const user = useAppStore(s => s.user)
  const logout = useAppStore(s => s.logout)
  const language = useAppStore(s => s.language)
  const setLanguage = useAppStore(s => s.setLanguage)
  const files = useAppStore(s => s.files)
  const stdin = useAppStore(s => s.stdin)
  const setOutput = useAppStore(s => s.setOutput)
  const setRunning = useAppStore(s => s.setRunning)
  const running = useAppStore(s => s.running)
  const currentWorkspaceId = useAppStore(s => s.currentWorkspaceId)
  const newWorkspace = useAppStore(s => s.newWorkspace)
  const setWorkspaces = useAppStore(s => s.setWorkspaces)
  const version = useAppStore(s => s.version)
  const theme = useAppStore(s => s.theme)
  const setTheme = useAppStore(s => s.setTheme)
  const shareId = useAppStore(s => s.shareId)
  const [saving, setSaving] = useState(false)
  const [runtimes, setRuntimes] = useState([])

  useEffect(() => {
    api.languages().then(setRuntimes).catch(() => {})
  }, [])

  async function handleRun() {
    setRunning(true)
    setOutput(null)
    try {
      const res = await executeWorkspace({ language, version, files, stdin })
      setOutput(res)
    } catch (e) {
      setOutput({ run: { stdout: '', stderr: String(e.message), output: String(e.message), code: 1 } })
    } finally {
      setRunning(false)
    }
  }

  async function handleSave() {
    if (!user) { onShowAuth(); return }
    setSaving(true)
    try {
      const payload = {
        title: `Workspace ${new Date().toLocaleString()}`,
        language,
        version,
        files,
        entry_file: files[0]?.id,
        is_public: false,
      }
      let ws
      if (currentWorkspaceId) {
        ws = await api.updateWorkspace(currentWorkspaceId, payload)
      } else {
        ws = await api.createWorkspace(payload)
        useAppStore.setState({ currentWorkspaceId: ws.id || ws._id, shareId: ws.share_id || ws.shareId })
      }
      const list = await api.listWorkspaces().catch(() => [])
      setWorkspaces(list)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleShare() {
    if (!currentWorkspaceId) {
      alert('Save workspace first')
      return
    }
    try {
      const res = await api.shareWorkspace(currentWorkspaceId, { is_public: true })
      const sid = res.share_id || res.shareId
      useAppStore.setState({ shareId: sid })
      const url = `${location.origin}/?share=${sid}`
      await navigator.clipboard.writeText(url)
      alert(`Share link copied: ${url}`)
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="brand" onClick={() => newWorkspace(language)}>
          <span className="brand-mark">▶</span>
          <span className="brand-name">RunNow</span>
          <span className="brand-tag">GO • DOCKER • PISTON</span>
        </div>
        <select className="lang-select" value={language} onChange={e => setLanguage(e.target.value)}>
          {allLanguages.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <span className="runtime-badge">{runtimes.find(r => r.language === language)?.version || '*'}</span>
      </div>
      <div className="topbar-center">
        <button className={`btn btn-run ${running ? 'running' : ''}`} onClick={handleRun} disabled={running}>
          {running ? '● Running...' : '▶ Run'}
        </button>
        <button className="btn btn-ghost" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        <button className="btn btn-ghost" onClick={handleShare}>Share</button>
        <button className="btn btn-ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀' : '☾'}</button>
      </div>
      <div className="topbar-right">
        <button className="btn btn-ghost" onClick={onShowWorkspaces}>Workspaces</button>
        {shareId && <span className="share-pill">/{shareId}</span>}
        {user ? (
          <div className="user-chip">
            <span>{user.username}</span>
            <button className="btn btn-small" onClick={logout}>Logout</button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={onShowAuth}>Sign in</button>
        )}
      </div>
    </div>
  )
}
