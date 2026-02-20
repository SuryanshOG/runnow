import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Code2, ArrowRight, Zap, Globe, Layers } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";

type AuthMode = 'login' | 'register';

export default function LandingPage() {
    const navigate = useNavigate();
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [authOpen, setAuthOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Set document title
    useEffect(() => { document.title = 'RunNow — The Hybrid Code Runner'; }, []);

    const openAuth = (mode: AuthMode) => {
        setAuthMode(mode);
        setEmail('');
        setPassword('');
        setName('');
        setError('');
        setAuthOpen(true);
    };

    const switchMode = (mode: AuthMode) => {
        setAuthMode(mode);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const endpoint = authMode === 'login' ? 'login' : 'register';
            const body = authMode === 'login'
                ? { email, password }
                : { email, password, name };

            const res = await fetch(`http://localhost:3000/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            localStorage.setItem('runnow_token', data.token);
            localStorage.setItem('runnow_user', JSON.stringify(data.user));
            toast.success(authMode === 'login' ? 'Welcome back!' : 'Account created!');
            setAuthOpen(false);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const features = [
        {
            icon: <Zap size={22} className="text-white" />,
            title: 'Runs in your browser',
            desc: 'Python and Node.js execute instantly client-side via Pyodide and WebContainers — zero cold starts, zero cost.',
        },
        {
            icon: <Globe size={22} className="text-white" />,
            title: '70+ languages',
            desc: 'C++, Rust, Go, Java, PHP, Ruby and more fall back to a Dockerised Piston server for full compilation support.',
        },
        {
            icon: <Layers size={22} className="text-white" />,
            title: 'Multi-file Runtainers',
            desc: 'Organise code into named workspaces with multiple files. Import across files exactly like a real project.',
        },
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col">
            {/* Navbar */}
            <nav className="flex items-center justify-between p-6 border-b border-zinc-900">
                <div className="flex items-center gap-3">
                    <Code2 size={24} className="text-white" />
                    <span className="text-xl font-bold tracking-tighter">RunNow.</span>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => openAuth('login')}>Log in</Button>
                    <Button onClick={() => openAuth('register')}>Sign up</Button>
                </div>
            </nav>

            {/* Hero */}
            <main className="flex flex-col items-center justify-center pt-28 pb-20 px-4 text-center flex-1">
                <div className="inline-block border border-zinc-800 rounded-full px-4 py-1 text-xs mb-8 text-zinc-400 tracking-widest uppercase">
                    Introducing Runtainers &nbsp;·&nbsp; Multi-file workspaces
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-4xl leading-[1.05]">
                    The hybrid code runner<br className="hidden md:block" /> built for speed.
                </h1>

                <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-10">
                    Execute Python and Node.js instantly in your browser. Seamlessly fall back to server-side compilation for 70+ languages. Create multi-file Runtainers in seconds.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-28">
                    <Button size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-zinc-200 font-bold" onClick={() => navigate('/runtainer/guest')}>
                        Try Editor as Guest <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-black border-zinc-700 hover:bg-zinc-900" onClick={() => openAuth('register')}>
                        Create an Account
                    </Button>
                </div>

                {/* Features Grid */}
                <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-px border border-zinc-900 rounded-2xl overflow-hidden">
                    {features.map((f, i) => (
                        <div key={i} className="bg-zinc-950 p-8 text-left hover:bg-zinc-900 transition-colors">
                            <div className="mb-4 inline-flex p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                                {f.icon}
                            </div>
                            <h3 className="font-bold text-lg tracking-tight mb-2">{f.title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-900 py-6 px-8 flex items-center justify-between text-xs text-zinc-600">
                <span>© {new Date().getFullYear()} RunNow. All rights reserved.</span>
                <div className="flex gap-6">
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
                    <button onClick={() => openAuth('register')} className="hover:text-white transition-colors">Get started</button>
                </div>
            </footer>

            {/* Unified Auth Dialog */}
            <Dialog open={authOpen} onOpenChange={(o: boolean) => { if (!o) setAuthOpen(false); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-3xl font-bold tracking-tighter">
                            {authMode === 'login' ? 'Welcome back' : 'Create an account'}
                        </DialogTitle>
                        <DialogDescription className="text-base text-zinc-400 mt-1">
                            {authMode === 'login'
                                ? 'Enter your credentials to access your Runtainers.'
                                : 'Start building and saving multi-file Runtainers today.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {error && (
                            <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
                                {error}
                            </div>
                        )}

                        {authMode === 'register' && (
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">Name</label>
                                <Input
                                    className="h-12 px-4 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white rounded-md"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">Email</label>
                            <Input
                                type="email"
                                className="h-12 px-4 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white rounded-md"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus={authMode === 'login'}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">Password</label>
                            <Input
                                type="password"
                                className="h-12 px-4 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white rounded-md"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={authMode === 'register' ? 6 : undefined}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="mt-2 h-12 w-full font-bold text-base bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="inline-block h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                                    {authMode === 'login' ? 'Signing in…' : 'Creating account…'}
                                </span>
                            ) : authMode === 'login' ? 'Sign in' : 'Sign up'}
                        </Button>

                        <p className="text-center text-sm text-zinc-500">
                            {authMode === 'login' ? (
                                <>No account? <button type="button" onClick={() => switchMode('register')} className="text-white underline underline-offset-2">Sign up</button></>
                            ) : (
                                <>Already have an account? <button type="button" onClick={() => switchMode('login')} className="text-white underline underline-offset-2">Log in</button></>
                            )}
                        </p>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
