import type { SupportedLanguage } from '../../types';
import type { CodeFile } from '../../store/useCodeStore';
import { runPython } from './PyodideRunner';
import { runJS } from './WebContainerRunner';

export const executeCode = async (
    lang: SupportedLanguage,
    files: CodeFile[],
    activeFileId: string,
    input: string,
    onOutput: (msg: string) => void
): Promise<{ output: string; time: number }> => {
    const supportedClient = ['python', 'javascript', 'typescript', 'nodejs'];

    if (supportedClient.includes(lang)) {
        if (lang === 'python') {
            return runPython(files, activeFileId, input, onOutput);
        }
        if (['javascript', 'nodejs', 'typescript'].includes(lang)) {
            return runJS(files, activeFileId, input, onOutput);
        }
    }

    // Fallback to server
    try {
        onOutput(`System: Deferring to server for ${lang} execution...\n`);
        const startTime = Date.now();

        const response = await fetch('http://localhost:3000/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lang, files, activeFileId, input })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error ${response.status}`);
        }

        const data = await response.json();
        onOutput(data.output + '\n');
        return { output: data.output, time: Date.now() - startTime };
    } catch (err: any) {
        onOutput(`ERROR: ${err.message}\n`);
        return { output: err.message, time: 0 };
    }
};
