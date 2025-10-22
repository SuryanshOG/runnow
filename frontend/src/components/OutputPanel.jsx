import { useAppStore } from '../stores/appStore'

export default function OutputPanel() {
  const output = useAppStore(s => s.output)
  const stdin = useAppStore(s => s.stdin)
  const setStdin = useAppStore(s => s.setStdin)
  const running = useAppStore(s => s.running)

  if (!output && !running) {
    return (
      <div className="output-panel">
        <div className="output-header">
          <span>Output</span>
          <span className="output-hint">stdin / args supported • real-time via Piston + Docker</span>
        </div>
        <div className="output-empty">Press Run to execute. 70+ languages via Piston. JS/TS also runs locally for instant feedback.</div>
        <div className="stdin-row">
          <label>stdin</label>
          <textarea value={stdin} onChange={e => setStdin(e.target.value)} placeholder="input fed to program stdin" rows={2} />
        </div>
      </div>
    )
  }

  const run = output?.run || output
  const compile = output?.compile

  return (
    <div className="output-panel">
      <div className="output-header">
        <span>Output {run?.code === 0 ? '✓' : run?.code ? `✗ exit ${run.code}` : ''}</span>
        <span className="output-meta">{output?.language || ''} {output?.version || ''}</span>
      </div>
      {compile && (compile.stdout || compile.stderr) && (
        <pre className="output-block compile">{compile.stdout || ''}{compile.stderr || ''}</pre>
      )}
      <pre className={`output-block ${run?.code !== 0 ? 'error' : ''}`}>{run?.output || run?.stdout || ''}{run?.stderr ? `\n${run.stderr}` : ''}</pre>
      {!run?.output && !run?.stdout && !run?.stderr && running && <div className="output-loading">executing...</div>}
      <div className="stdin-row">
        <label>stdin</label>
        <textarea value={stdin} onChange={e => setStdin(e.target.value)} placeholder="input fed to program stdin" rows={2} />
      </div>
    </div>
  )
}
