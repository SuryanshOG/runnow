import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { Code2, LogOut, Plus, Trash2, FileCode, Clock, ChevronRight, Layers, ChevronDown, Search, ArrowUpDown } from 'lucide-react';

interface RuntainerSummary {
    id: string;
    title: string;
    language: string;
    fileCount: number;
    updatedAt: string;
}

const LANGUAGES: [string, string][] = [
    ['python', 'Python'],
    ['javascript', 'JavaScript'],
    ['typescript', 'TypeScript'],
    ['nodejs', 'Node.js'],
    ['go', 'Go'],
    ['rust', 'Rust'],
    ['java', 'Java'],
    ['cpp', 'C++'],
    ['c', 'C'],
    ['ruby', 'Ruby'],
    ['php', 'PHP'],
];

const LANGUAGE_COLORS: Record<string, string> = {
    python: 'bg-blue-950 text-blue-300 border-blue-900',
    javascript: 'bg-yellow-950 text-yellow-300 border-yellow-900',
    typescript: 'bg-sky-950 text-sky-300 border-sky-900',
    nodejs: 'bg-green-950 text-green-300 border-green-900',
    rust: 'bg-orange-950 text-orange-300 border-orange-900',
    go: 'bg-cyan-950 text-cyan-300 border-cyan-900',
    java: 'bg-red-950 text-red-300 border-red-900',
    cpp: 'bg-purple-950 text-purple-300 border-purple-900',
    default: 'bg-zinc-900 text-zinc-400 border-zinc-800',
};

function langBadge(lang: string) {
    const cls = LANGUAGE_COLORS[lang] ?? LANGUAGE_COLORS.default;
    const label = LANGUAGES.find(([v]) => v === lang)?.[1] ?? lang;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${cls}`}>
            {label}
        </span>
    );
}

function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [runtainers, setRuntainers] = useState<RuntainerSummary[]>([]);
    const [loading, setLoading] = useState(true);

    // Create dialog
    const [createOpen, setCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newLang, setNewLang] = useState('python');
    const [titleError, setTitleError] = useState('');

    // Delete confirmation dialog
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
    const [langFilter, setLangFilter] = useState<string>('all');

    useEffect(() => {
        const storedUser = localStorage.getItem('runnow_user');
        if (!storedUser) { navigate('/'); return; }
        const u = JSON.parse(storedUser);
        setUser(u);
        document.title = 'Dashboard — RunNow';

        fetch(`http://localhost:3000/runtainers/user/${u.id}`)
            .then(r => r.json())
            .then(data => Array.isArray(data) ? setRuntainers(data) : [])
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('runnow_token');
        localStorage.removeItem('runnow_user');
        navigate('/');
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) { setTitleError('Give your Runtainer a name.'); return; }
        setTitleError('');
        const token = localStorage.getItem('runnow_token');
        const ext = newLang === 'python' ? 'py' : newLang === 'typescript' ? 'ts' : newLang === 'cpp' ? 'cpp' : newLang === 'c' ? 'c' : 'js';
        const res = await fetch('http://localhost:3000/runtainers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                title: newTitle.trim(),
                authorId: user.id,
                language: newLang,
                files: [{ name: `main.${ext}`, content: '' }],
            }),
        });
        const data = await res.json();
        if (data.id) { toast.success('Runtainer created!'); navigate(`/runtainer/${data.id}`); }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await fetch(`http://localhost:3000/runtainers/${deleteTarget.id}`, { method: 'DELETE' });
        toast.success(`"${deleteTarget.title}" deleted`);
        setRuntainers(prev => prev.filter(r => r.id !== deleteTarget.id));
        setDeleteTarget(null);
    };

    const selectedLangLabel = LANGUAGES.find(([v]) => v === newLang)?.[1] ?? newLang;

    const usedLangs = useMemo(() => [...new Set(runtainers.map(r => r.language))], [runtainers]);

    const filteredRuntainers = useMemo(() => {
        let list = [...runtainers];
        if (search.trim()) list = list.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
        if (langFilter !== 'all') list = list.filter(r => r.language === langFilter);
        if (sortBy === 'newest') list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        else if (sortBy === 'oldest') list.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        else list.sort((a, b) => a.title.localeCompare(b.title));
        return list;
    }, [runtainers, search, langFilter, sortBy]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-900">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="bg-white p-1.5 rounded-sm">
                        <Code2 size={18} className="text-black" />
                    </div>
                    <span className="text-lg font-bold tracking-tighter">RunNow.</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-500">{user.email}</span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded px-3 py-1.5"
                    >
                        <LogOut size={13} />
                        Sign out
                    </button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-8 py-16">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter">Your Runtainers</h1>
                        <p className="text-zinc-500 mt-2 text-sm">Multi-file workspaces. Execute anything.</p>
                    </div>
                    <Button
                        onClick={() => { setNewTitle(''); setNewLang('python'); setTitleError(''); setCreateOpen(true); }}
                        className="h-10 px-5 gap-2 bg-white text-black hover:bg-zinc-200 font-bold shrink-0"
                    >
                        <Plus size={15} />
                        New Runtainer
                    </Button>
                </div>

                {/* Search + Sort + Filter row */}
                {!loading && runtainers.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-6 items-center">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                            <input
                                className="w-full h-9 pl-8 pr-4 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                                placeholder="Search Runtainers…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <ArrowUpDown size={12} className="text-zinc-500" />
                            {(['newest', 'oldest', 'name'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSortBy(s)}
                                    className={`h-9 px-3 rounded text-xs font-medium transition-colors capitalize ${sortBy === s ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        {usedLangs.length > 1 && (
                            <div className="flex items-center gap-1 flex-wrap">
                                <button
                                    onClick={() => setLangFilter('all')}
                                    className={`h-7 px-2.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors ${langFilter === 'all' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'
                                        }`}
                                >
                                    All
                                </button>
                                {usedLangs.map(lang => {
                                    const label = LANGUAGES.find(([v]) => v === lang)?.[1] ?? lang;
                                    return (
                                        <button
                                            key={lang}
                                            onClick={() => setLangFilter(l => l === lang ? 'all' : lang)}
                                            className={`h-7 px-2.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors ${langFilter === lang ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Runtainer Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-36 rounded-xl border border-zinc-900 bg-zinc-950 animate-pulse" />
                        ))}
                    </div>
                ) : filteredRuntainers.length === 0 && runtainers.length > 0 ? (
                    <div className="text-center py-20 text-zinc-600">
                        <p className="text-sm">No Runtainers match your filters.</p>
                        <button onClick={() => { setSearch(''); setLangFilter('all'); }} className="mt-2 text-xs text-zinc-500 hover:text-white underline">Clear filters</button>
                    </div>
                ) : runtainers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="mb-6 p-5 rounded-2xl border border-zinc-800 bg-zinc-950">
                            <Layers size={36} className="text-zinc-600" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight mb-2">No Runtainers yet</h2>
                        <p className="text-zinc-500 text-sm mb-8 max-w-xs">
                            Create your first multi-file workspace to start building and executing code.
                        </p>
                        <Button
                            onClick={() => { setNewTitle(''); setNewLang('python'); setTitleError(''); setCreateOpen(true); }}
                            className="h-11 px-8 gap-2 bg-white text-black hover:bg-zinc-200 font-bold"
                        >
                            <Plus size={15} />
                            Create a Runtainer
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRuntainers.map(r => (
                            <div
                                key={r.id}
                                onClick={() => navigate(`/runtainer/${r.id}`)}
                                className="group relative flex flex-col justify-between p-5 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-zinc-600 hover:bg-zinc-900 transition-all cursor-pointer"
                            >
                                <button
                                    onClick={e => { e.stopPropagation(); setDeleteTarget({ id: r.id, title: r.title }); }}
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <div>
                                    <div className="mb-3">{langBadge(r.language)}</div>
                                    <h3 className="font-semibold text-base text-white tracking-tight mb-1 pr-6 group-hover:underline decoration-zinc-600 underline-offset-2">
                                        {r.title}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/60">
                                    <div className="flex items-center gap-3 text-zinc-600 text-xs">
                                        <span className="flex items-center gap-1"><FileCode size={11} />{r.fileCount} {r.fileCount === 1 ? 'file' : 'files'}</span>
                                        <span className="flex items-center gap-1"><Clock size={11} />{relativeTime(r.updatedAt)}</span>
                                    </div>
                                    <ChevronRight size={14} className="text-zinc-700 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* ── Create Runtainer Dialog ── */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-2xl font-bold tracking-tighter">New Runtainer</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Name your workspace and pick a language.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-5 mt-2">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">Title</label>
                            <Input
                                className={`h-11 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white ${titleError ? 'border-red-700' : ''}`}
                                placeholder="e.g. HTTP Server in Go"
                                value={newTitle}
                                onChange={e => { setNewTitle(e.target.value); setTitleError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                autoFocus
                            />
                            {titleError && <p className="text-xs text-red-500">{titleError}</p>}
                        </div>

                        {/* Language — Radix DropdownMenu */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">Language</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex w-full items-center justify-between h-11 px-4 rounded-md border border-zinc-800 bg-zinc-950 text-sm text-white hover:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-white transition-colors">
                                        {selectedLangLabel}
                                        <ChevronDown size={14} className="text-zinc-500" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="start">
                                    <DropdownMenuLabel>Select language</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup value={newLang} onValueChange={setNewLang}>
                                        {LANGUAGES.map(([val, label]) => (
                                            <DropdownMenuRadioItem key={val} value={val}>{label}</DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <Button
                            onClick={handleCreate}
                            className="h-11 w-full bg-white text-black hover:bg-zinc-200 font-bold text-base"
                        >
                            Create Runtainer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Dialog ── */}
            <Dialog open={!!deleteTarget} onOpenChange={(open: boolean) => { if (!open) setDeleteTarget(null); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">Delete Runtainer?</DialogTitle>
                        <DialogDescription className="text-zinc-400 mt-1">
                            <span className="text-white font-semibold">"{deleteTarget?.title}"</span> will be permanently deleted. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 mt-4">
                        <Button
                            variant="outline"
                            className="flex-1 h-10"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Cancel
                        </Button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 h-10 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
