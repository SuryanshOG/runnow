import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
import { monacoLang } from '../utils/languages'
import { useAppStore } from '../stores/appStore'

export default function MonacoEditor() {
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const files = useAppStore(s => s.files)
  const activeFileId = useAppStore(s => s.activeFileId)
  const updateFileContent = useAppStore(s => s.updateFileContent)
  const theme = useAppStore(s => s.theme)

  const activeFile = files.find(f => f.id === activeFileId) || files[0]

  useEffect(() => {
    if (!containerRef.current) return
    const ed = monaco.editor.create(containerRef.current, {
      value: activeFile ? activeFile.content : '',
      language: monacoLang(activeFile ? activeFile.language : 'javascript'),
      theme: theme === 'dark' ? 'vs-dark' : 'vs',
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      padding: { top: 12 },
    })
    editorRef.current = ed
    const sub = ed.onDidChangeModelContent(() => {
      if (activeFile) updateFileContent(activeFile.id, ed.getValue())
    })
    const ro = new ResizeObserver(() => ed.layout())
    ro.observe(containerRef.current)
    return () => {
      sub.dispose()
      ro.disconnect()
      ed.dispose()
    }
  }, [])

  useEffect(() => {
    if (!editorRef.current) return
    const model = editorRef.current.getModel()
    if (activeFile && model && model.getValue() !== activeFile.content) {
      editorRef.current.setValue(activeFile.content)
    }
    if (activeFile) {
      monaco.editor.setModelLanguage(model, monacoLang(activeFile.language))
    }
  }, [activeFileId])

  useEffect(() => {
    monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs')
  }, [theme])

  useEffect(() => {
    if (!editorRef.current || !activeFile) return
    const val = editorRef.current.getValue()
    if (val !== activeFile.content) {
      const pos = editorRef.current.getPosition()
      editorRef.current.setValue(activeFile.content)
      if (pos) editorRef.current.setPosition(pos)
    }
  }, [activeFile?.content])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
