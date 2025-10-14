import { useEffect, useState } from 'react'
import Topbar from './components/Topbar'
import FileTabs from './components/FileTabs'
import MonacoEditor from './components/MonacoEditor'
import OutputPanel from './components/OutputPanel'
import AuthModal from './components/AuthModal'
import WorkspacesDrawer from './components/WorkspacesDrawer'
import { useAppStore } from './stores/appStore'
import { api } from './utils/api'

export default function App() {
  const theme = useAppStore(s => s.theme)
  const initActive = useAppStore(s => s.initActive)
  const loadWorkspace = useAppStore(s => s.loadWorkspace)
  const [showAuth, setShowAuth] = useState(false)
  const [showWorkspaces, setShowWorkspaces] = useState(false)

  useEffect(() => {
    initActive()
    const params = new URLSearchParams(location.search)
    const share = params.get('share')
    if (share) {
      api.getShare(share).then(ws => loadWorkspace(ws)).catch(() => {})
    }
    const token = localStorage.getItem('runnow_token')
    if (token) {
      api.me().then(u => useAppStore.setState({ user: u })).catch(() => {})
    }
  }, [])

  return (
    <div className="app" data-theme={theme}>
      <Topbar onShowAuth={() => setShowAuth(true)} onShowWorkspaces={() => setShowWorkspaces(true)} />
      <FileTabs />
      <div className="main">
        <div className="editor-pane">
          <div className="editor-wrap">
            <MonacoEditor />
          </div>
        </div>
        <div className="side-pane">
          <OutputPanel />
        </div>
      </div>
      <div className="footer-bar">
        <span>70+ languages via Piston Docker</span>
        <span>•</span>
        <span>Multi-file • cross imports</span>
        <span>•</span>
        <span>JWT + MongoDB persistence</span>
        <span>•</span>
        <span>Share via link</span>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showWorkspaces && <WorkspacesDrawer onClose={() => setShowWorkspaces(false)} />}
    </div>
  )
}
