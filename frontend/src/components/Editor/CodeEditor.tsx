import Editor from '@monaco-editor/react';
import { useCodeStore } from '../../store/useCodeStore';


// Monaco uses slightly different language IDs for a few languages
const monacoLanguageMap: Record<string, string> = {
    python: 'python',
    javascript: 'javascript',
    typescript: 'typescript',
    nodejs: 'javascript',
    cpp: 'cpp',
    c: 'c',
    java: 'java',
    rust: 'rust',
    go: 'go',
    ruby: 'ruby',
    php: 'php',
    swift: 'swift',
    kotlin: 'kotlin',
    scala: 'scala',
    csharp: 'csharp',
    bash: 'shell',
    sql: 'sql'
};

export const CodeEditor = () => {
    const { activeFileId, files, updateFileContent, language } = useCodeStore();

    const activeFile = files.find(f => f.id === activeFileId);
    const code = activeFile ? activeFile.content : '';

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined && activeFileId) {
            updateFileContent(activeFileId, value);
        }
    };

    return (
        <div className="h-full w-full rounded-lg overflow-hidden border border-gray-800">
            <Editor
                height="100%"
                language={monacoLanguageMap[language] || 'plaintext'}
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    wordWrap: 'on',
                    formatOnPaste: true,
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                }}
                loading={
                    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-gray-400">
                        Loading Editor...
                    </div>
                }
            />
        </div>
    );
};
