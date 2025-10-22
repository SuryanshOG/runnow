import { useAppStore } from '../stores/appStore'

export default function FileTabs() {
  const files = useAppStore(s => s.files)
  const activeFileId = useAppStore(s => s.activeFileId)
  const setActiveFile = useAppStore(s => s.setActiveFile)
  const addFile = useAppStore(s => s.addFile)
  const deleteFile = useAppStore(s => s.deleteFile)
  const renameFile = useAppStore(s => s.renameFile)

  return (
    <div className="file-tabs">
      {files.map(f => (
        <div key={f.id} className={`file-tab ${f.id === activeFileId ? 'active' : ''}`} onClick={() => setActiveFile(f.id)}>
          <input
            className="file-tab-input"
            value={f.name}
            onChange={e => renameFile(f.id, e.target.value)}
            onClick={e => e.stopPropagation()}
          />
          <span className="file-tab-lang">{f.language}</span>
          {files.length > 1 && (
            <button className="file-tab-close" onClick={e => { e.stopPropagation(); deleteFile(f.id) }}>×</button>
          )}
        </div>
      ))}
      <button className="file-tab-add" onClick={addFile}>+ New file</button>
      <div className="file-tabs-hint">cross-file imports work — files are sent together to Piston</div>
    </div>
  )
}
