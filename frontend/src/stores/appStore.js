import { create } from 'zustand'
import { templateFor, extFor } from '../utils/languages'

function uid() {
  return Math.random().toString(36).slice(2, 8)
}

function makeFile(lang, name) {
  const ext = extFor(lang)
  return { id: uid(), name: name || `main.${ext}`, language: lang, content: templateFor(lang) }
}

export const useAppStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('runnow_user') || 'null'),
  token: localStorage.getItem('runnow_token') || null,
  language: 'javascript',
  version: '*',
  files: [makeFile('javascript')],
  activeFileId: null,
  stdin: '',
  output: null,
  running: false,
  workspaces: [],
  currentWorkspaceId: null,
  shareId: null,
  theme: localStorage.getItem('runnow_theme') || 'dark',

  initActive() {
    const s = get()
    if (!s.activeFileId && s.files.length) {
      set({ activeFileId: s.files[0].id })
    }
  },

  setTheme(t) {
    localStorage.setItem('runnow_theme', t)
    set({ theme: t })
  },

  setAuth(user, token) {
    if (token) localStorage.setItem('runnow_token', token)
    if (user) localStorage.setItem('runnow_user', JSON.stringify(user))
    set({ user, token })
  },

  logout() {
    localStorage.removeItem('runnow_token')
    localStorage.removeItem('runnow_user')
    set({ user: null, token: null })
  },

  setLanguage(lang) {
    const s = get()
    const active = s.files.find(f => f.id === s.activeFileId)
    if (active && !active.content.trim()) {
      const updated = s.files.map(f => f.id === active.id ? { ...f, language: lang, content: templateFor(lang), name: `main.${extFor(lang)}` } : f)
      set({ language: lang, files: updated })
    } else {
      set({ language: lang })
    }
  },

  setStdin(v) { set({ stdin: v }) },
  setOutput(v) { set({ output: v }) },
  setRunning(v) { set({ running: v }) },

  setFiles(files) {
    set({ files, activeFileId: files[0]?.id || null })
  },

  addFile() {
    const s = get()
    const ext = extFor(s.language)
    const f = { id: uid(), name: `file${s.files.length + 1}.${ext}`, language: s.language, content: '' }
    set({ files: [...s.files, f], activeFileId: f.id })
  },

  renameFile(id, name) {
    set({ files: get().files.map(f => f.id === id ? { ...f, name } : f) })
  },

  deleteFile(id) {
    const s = get()
    if (s.files.length <= 1) return
    const files = s.files.filter(f => f.id !== id)
    set({ files, activeFileId: files[0].id })
  },

  updateFileContent(id, content) {
    set({ files: get().files.map(f => f.id === id ? { ...f, content } : f) })
  },

  setActiveFile(id) { set({ activeFileId: id }) },

  loadWorkspace(ws) {
    const files = ws.files && ws.files.length ? ws.files : [makeFile(ws.language || 'javascript')]
    set({
      currentWorkspaceId: ws.id || ws._id,
      language: ws.language || 'javascript',
      version: ws.version || '*',
      files,
      activeFileId: ws.entry_file || files[0].id,
      shareId: ws.share_id || ws.shareId || null,
    })
  },

  newWorkspace(lang = 'javascript') {
    const f = makeFile(lang)
    set({ currentWorkspaceId: null, language: lang, files: [f], activeFileId: f.id, output: null, shareId: null })
  },

  setWorkspaces(ws) { set({ workspaces: ws }) },
}))
