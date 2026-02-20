import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Trash2, Code2, Terminal, AlignLeft, Clock, FileCode, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CodeEditor } from '../components/Editor/CodeEditor';
import { executeCode } from '../components/Execution/HybridExecutor';
import { useCodeStore } from '../store/useCodeStore';
import type { SupportedLanguage } from '../types';
import { Button } from '../components/ui/button';

const EXT: Partial<Record<SupportedLanguage, string>> = {
  python: 'py', javascript: 'js', typescript: 'ts', nodejs: 'js',
  cpp: 'cpp', c: 'c', java: 'java', rust: 'rs', go: 'go',
  ruby: 'rb', php: 'php', swift: 'swift', kotlin: 'kt', scala: 'scala',
  csharp: 'cs', bash: 'sh', sql: 'sql',
};

export default function IDEPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    files, setFiles, activeFileId, setActiveFileId, addFile, deleteFile,
    language, setLanguage,
    output, clearOutput,
    isRunning, setIsRunning, appendOutput,
    history, addHistory, setHistory
  } = useCodeStore();
  const [activeTab, setActiveTab] = useState<'output' | 'console' | 'history'>('output');
  const [runtainerTitle, setRuntainerTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [stdin, setStdin] = useState('');
  const [stdinOpen, setStdinOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const languages: { id: SupportedLanguage; label: string; group: string }[] = [
    { id: 'python', label: 'Python 3', group: 'Native (Client)' },
    { id: 'javascript', label: 'JavaScript', group: 'Native (Client)' },
    { id: 'typescript', label: 'TypeScript', group: 'Native (Client)' },
    { id: 'nodejs', label: 'Node.js', group: 'Native (Client)' },
    { id: 'cpp', label: 'C++', group: 'Server' },
    { id: 'c', label: 'C', group: 'Server' },
    { id: 'java', label: 'Java', group: 'Server' },
    { id: 'rust', label: 'Rust', group: 'Server' },
    { id: 'go', label: 'Go', group: 'Server' },
    { id: 'ruby', label: 'Ruby', group: 'Server' },
    { id: 'php', label: 'PHP', group: 'Server' },
    { id: 'swift', label: 'Swift', group: 'Server' },
    { id: 'kotlin', label: 'Kotlin', group: 'Server' },
    { id: 'scala', label: 'Scala', group: 'Server' },
    { id: 'csharp', label: 'C#', group: 'Server' },
    { id: 'bash', label: 'Bash', group: 'Server' },
    { id: 'sql', label: 'SQL', group: 'Server' },
  ];

  // Console log intercept
  useEffect(() => {
    const origLog = console.log.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    console.log = (...args) => { setConsoleLogs(l => [...l, '[log] ' + args.join(' ')]); origLog(...args); };
    console.warn = (...args) => { setConsoleLogs(l => [...l, '[warn] ' + args.join(' ')]); origWarn(...args); };
    console.error = (...args) => { setConsoleLogs(l => [...l, '[error] ' + args.join(' ')]); origError(...args); };
    return () => { console.log = origLog; console.warn = origWarn; console.error = origError; };
  }, []);

  // Keyboard shortcut Ctrl+Enter to run, Ctrl+S to save
  const handleRun = useCallback(async () => {
    setIsRunning(true);
    clearOutput();
    setActiveTab('output');
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile || !activeFileId) { setIsRunning(false); return; }

    const result = await executeCode(language, files, activeFileId, stdin, appendOutput);

    try {
      const userStr = localStorage.getItem('runnow_user');
      const authorId = userStr ? JSON.parse(userStr).id : 'anonymous_user';
      const histRes = await fetch('http://localhost:3000/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId, language, code: activeFile.content, output: result.output, timeTaken: result.time }),
      });
      if (histRes.ok) {
        const hData = await histRes.json();
        addHistory({ id: hData.id, timestamp: Date.now(), language, code: activeFile.content, output: result.output, timeTaken: result.time });
      }
    } catch { /* silent */ }
    setIsRunning(false);
  }, [files, activeFileId, language, stdin, appendOutput, clearOutput, setIsRunning, addHistory]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (!isRunning) handleRun(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveRuntainer(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') { e.preventDefault(); clearOutput(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isRunning, handleRun, clearOutput]);

  // Load history
  useEffect(() => {
    const userStr = localStorage.getItem('runnow_user');
    const authorId = userStr ? JSON.parse(userStr).id : 'anonymous_user';
    fetch(`http://localhost:3000/history/${authorId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data.map(d => ({ id: d.id, timestamp: new Date(d.createdAt).getTime(), language: d.language, code: d.code, output: d.output, timeTaken: d.timeTaken })));
        }
      }).catch(() => { });
  }, [setHistory]);

  // Load runtainer
  useEffect(() => {
    if (!id || id === 'demo' || id === 'new' || id === 'guest') return;
    fetch(`http://localhost:3000/runtainers/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error && data.language) {
          setLanguage(data.language as SupportedLanguage);
          setRuntainerTitle(data.title || '');
          document.title = `${data.title || 'Runtainer'} — RunNow`;
          if (data.files?.length > 0) {
            const loaded = data.files.map((f: any) => ({ id: f._id || Math.random().toString(36).slice(2, 9), name: f.name, content: f.content }));
            setFiles(loaded);
            setActiveFileId(loaded[0].id);
          }
        }
      }).catch(() => { });
  }, [id, setLanguage, setFiles, setActiveFileId]);

  // Default document title for non-runtainer
  useEffect(() => {
    if (!id || id === 'guest' || id === 'demo' || id === 'new') {
      document.title = 'Editor — RunNow';
    }
  }, [id]);

  const handleSaveRuntainer = async () => {
    if (!id || id === 'demo' || id === 'new' || id === 'guest') return;
    try {
      const res = await fetch(`http://localhost:3000/runtainers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: runtainerTitle, language, files: files.map(f => ({ name: f.name, content: f.content })) }),
      });
      if (res.ok) toast.success('Runtainer saved');
      else toast.error('Failed to save');
    } catch { toast.error('Failed to save'); }
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    if (!newName.trim()) return;
    const { updateFileName } = useCodeStore.getState() as any;
    if (typeof updateFileName === 'function') {
      updateFileName(fileId, newName.trim());
    } else {
      // fallback: patch through setFiles
      setFiles(files.map(f => f.id === fileId ? { ...f, name: newName.trim() } : f));
    }
    setRenamingFileId(null);
  };

  const handleAddFile = () => {
    const ext = EXT[language] ?? 'txt';
    addFile(`new_file_${files.length + 1}.${ext}`);
  };

  return (
    <div
      className="flex flex-col h-screen bg-black text-white font-sans selection:bg-white selection:text-black"
      tabIndex={-1}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-900 bg-black shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-sm cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Code2 size={18} className="text-black" />
          </div>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="bg-transparent border-b border-zinc-600 text-white text-base font-bold tracking-tight outline-none w-52"
              value={runtainerTitle}
              onChange={e => setRuntainerTitle(e.target.value)}
              onBlur={() => { setEditingTitle(false); handleSaveRuntainer(); }}
              onKeyDown={e => { if (e.key === 'Enter') { setEditingTitle(false); handleSaveRuntainer(); } if (e.key === 'Escape') setEditingTitle(false); }}
              autoFocus
            />
          ) : (
            <div
              className="cursor-text"
              onDoubleClick={() => { if (id && id !== 'guest' && id !== 'demo' && id !== 'new') setEditingTitle(true); }}
              title="Double-click to rename"
            >
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                {runtainerTitle || 'RunNow.'}
              </h1>
              {id && id !== 'guest' && id !== 'demo' && (
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mt-0.5">
                  {id === 'new' ? 'New workspace' : 'Runtainer · double-click to rename'}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {id !== 'demo' && id !== 'new' && id !== 'guest' && (
            <Button className="bg-white text-black hover:bg-zinc-200 h-8 px-4 text-xs font-bold" size="sm" onClick={handleSaveRuntainer}>
              Save
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate('/dashboard')}>
            Exit
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden p-3 gap-3 bg-[#0a0a0a]">
        {/* Left: File Tree */}
        <div className="w-44 flex flex-col bg-black rounded-lg border border-zinc-900 overflow-hidden shrink-0">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-900">
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Files</span>
            <button onClick={handleAddFile} className="text-zinc-500 hover:text-white text-base leading-none transition-colors">+</button>
          </div>
          <div className="flex-1 overflow-auto p-1.5 flex flex-col gap-0.5">
            {files.map(file => (
              <div key={file.id} className="group relative">
                {renamingFileId === file.id ? (
                  <input
                    className="w-full px-2 py-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded text-white outline-none"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameFile(file.id, renameValue)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameFile(file.id, renameValue);
                      if (e.key === 'Escape') setRenamingFileId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => setActiveFileId(file.id)}
                    onDoubleClick={() => { setRenamingFileId(file.id); setRenameValue(file.name); }}
                    className={`flex items-center justify-between gap-1.5 px-2 py-1.5 text-xs rounded cursor-pointer transition-colors ${activeFileId === file.id ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-300'}`}
                  >
                    <div className="flex items-center gap-1.5 truncate min-w-0">
                      <FileCode size={12} className={activeFileId === file.id ? 'text-white shrink-0' : 'text-zinc-500 shrink-0'} />
                      <span className="truncate" title={file.name}>{file.name}</span>
                    </div>
                    {files.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteFile(file.id); }}
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity shrink-0"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-black rounded-lg border border-zinc-900 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-black px-3 py-2 border-b border-zinc-900 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as SupportedLanguage)}
                  className="appearance-none bg-zinc-900 border border-zinc-800 text-xs rounded px-3 py-1.5 pr-7 text-white focus:outline-none focus:ring-1 focus:ring-white font-medium cursor-pointer"
                >
                  {['Native (Client)', 'Server'].map(group => (
                    <optgroup key={group} label={group}>
                      {languages.filter(l => l.group === group).map(lang => (
                        <option key={lang.id} value={lang.id}>{lang.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 hidden sm:block">Ctrl+Enter to run</span>
              <Button
                onClick={handleRun}
                disabled={isRunning}
                className="h-7 px-4 text-xs font-bold bg-white text-black hover:bg-zinc-200 disabled:opacity-60"
                size="sm"
              >
                {isRunning ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    Running…
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5"><Play size={11} />Run</span>
                )}
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 relative overflow-hidden bg-[#0d0d0d]">
            <CodeEditor />
          </div>

          {/* Stdin Panel */}
          <div className="border-t border-zinc-900 shrink-0">
            <button
              onClick={() => setStdinOpen(v => !v)}
              className="flex items-center gap-2 w-full px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {stdinOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              Standard Input (stdin)
            </button>
            {stdinOpen && (
              <textarea
                className="w-full bg-[#0a0a0a] text-xs text-zinc-300 font-mono px-3 pb-3 h-20 resize-none focus:outline-none border-t border-zinc-900 placeholder:text-zinc-700"
                placeholder="Type program input here, one line per entry…"
                value={stdin}
                onChange={e => setStdin(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Right: Output / Console / History */}
        <div className="w-[34%] flex flex-col bg-black rounded-lg border border-zinc-900 overflow-hidden shrink-0 min-w-[280px]">
          {/* Tabs */}
          <div className="flex border-b border-zinc-900 bg-black shrink-0">
            {(['output', 'console', 'history'] as const).map(tab => {
              const icons = { output: <Terminal size={12} />, console: <AlignLeft size={12} />, history: <Clock size={12} /> };
              const labels = { output: 'Output', console: 'Console', history: 'History' };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === tab ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {icons[tab]}{labels[tab]}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'output' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-900/50 shrink-0">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-600">Execution Output</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-700 hidden sm:block">Ctrl+L clear</span>
                    <button onClick={clearOutput} className="text-zinc-600 hover:text-white transition-colors p-1" title="Clear">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-3 overflow-auto font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {output || <span className="text-zinc-700 italic">No output yet. Press Ctrl+Enter to run.</span>}
                </div>
              </div>
            )}

            {activeTab === 'console' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-900/50 shrink-0">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-600">Browser Console</span>
                  <button onClick={() => setConsoleLogs([])} className="text-zinc-600 hover:text-white transition-colors p-1" title="Clear">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="flex-1 p-3 overflow-auto font-mono text-xs leading-relaxed">
                  {consoleLogs.length === 0
                    ? <span className="text-zinc-700 italic">Browser console logs appear here.</span>
                    : consoleLogs.map((log, i) => (
                      <div key={i} className={`mb-0.5 ${log.startsWith('[error]') ? 'text-red-400' : log.startsWith('[warn]') ? 'text-yellow-400' : 'text-zinc-300'}`}>
                        {log}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="flex-1 p-2 overflow-auto">
                {history.length === 0 ? (
                  <div className="text-zinc-600 text-xs italic text-center mt-10">No execution history yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {history.map((h, i) => (
                      <div key={h.id || i} className="bg-[#111] p-2.5 rounded border border-zinc-800">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold text-white tracking-wider">{h.language}</span>
                          <span className="text-[9px] text-zinc-500">{new Date(h.timestamp).toLocaleTimeString()} · {h.timeTaken}ms</span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 line-clamp-2 bg-black p-1.5 border border-zinc-900 rounded">{h.code}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
