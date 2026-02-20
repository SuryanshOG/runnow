import { create } from 'zustand';
import type { SupportedLanguage, HistoryItem } from '../types';

export interface CodeFile {
    id: string;
    name: string;
    content: string;
}

interface CodeState {
    files: CodeFile[];
    activeFileId: string | null;
    language: SupportedLanguage;
    output: string;
    isRunning: boolean;
    history: HistoryItem[];

    setFiles: (files: CodeFile[]) => void;
    addFile: (name: string, content?: string) => void;
    updateFileContent: (id: string, content: string) => void;
    renameFile: (id: string, name: string) => void;
    deleteFile: (id: string) => void;
    setActiveFileId: (id: string) => void;

    setLanguage: (lang: SupportedLanguage) => void;
    setOutput: (output: string) => void;
    setIsRunning: (isRunning: boolean) => void;
    appendOutput: (chunk: string) => void;
    addHistory: (item: HistoryItem) => void;
    setHistory: (items: HistoryItem[]) => void;
    clearOutput: () => void;
}

const defaultCode: Record<SupportedLanguage, string> = {
    python: 'print("Hello, RunNow!")\n',
    javascript: 'console.log("Hello, RunNow!");\n',
    typescript: 'const msg: string = "Hello, RunNow!";\nconsole.log(msg);\n',
    nodejs: 'console.log("Hello, Node!");\n',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, RunNow!" << std::endl;\n    return 0;\n}\n',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, RunNow!\\n");\n    return 0;\n}\n',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, RunNow!");\n    }\n}\n',
    rust: 'fn main() {\n    println!("Hello, RunNow!");\n}\n',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, RunNow!")\n}\n',
    ruby: 'puts "Hello, RunNow!"\n',
    php: '<?php\n\necho "Hello, RunNow!";\n',
    swift: 'print("Hello, RunNow!")\n',
    kotlin: 'fun main() {\n    println("Hello, RunNow!")\n}\n',
    scala: 'object Main extends App {\n    println("Hello, RunNow!")\n}\n',
    csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, RunNow!");\n    }\n}\n',
    bash: 'echo "Hello, RunNow!"\n',
    sql: 'SELECT "Hello, RunNow!";\n'
};

const getExtension = (lang: SupportedLanguage) => {
    const map: Record<string, string> = {
        python: '.py', javascript: '.js', typescript: '.ts', nodejs: '.js',
        cpp: '.cpp', c: '.c', java: '.java', rust: '.rs', go: '.go',
        ruby: '.rb', php: '.php', swift: '.swift', kotlin: '.kt',
        scala: '.scala', csharp: '.cs', bash: '.sh', sql: '.sql'
    };
    return map[lang] || '.txt';
};

export const useCodeStore = create<CodeState>((set, get) => ({
    files: [{ id: '1', name: 'main.py', content: defaultCode.python }],
    activeFileId: '1',
    language: 'python',
    output: '',
    isRunning: false,
    history: [],

    setFiles: (files) => set({ files }),
    addFile: (name, content = '') => set((state) => {
        const newFile = { id: Math.random().toString(36).substr(2, 9), name, content };
        return { files: [...state.files, newFile], activeFileId: newFile.id };
    }),
    updateFileContent: (id, content) => set((state) => ({
        files: state.files.map(f => f.id === id ? { ...f, content } : f)
    })),
    renameFile: (id, name) => set((state) => ({
        files: state.files.map(f => f.id === id ? { ...f, name } : f)
    })),
    deleteFile: (id) => set((state) => {
        const newFiles = state.files.filter(f => f.id !== id);
        return {
            files: newFiles,
            activeFileId: state.activeFileId === id ? (newFiles[0]?.id || null) : state.activeFileId
        };
    }),
    setActiveFileId: (id) => set({ activeFileId: id }),

    setLanguage: (language) => set((state) => {
        // If we only had one default file, change it to match the new language
        let newFiles = [...state.files];
        if (newFiles.length === 1 && newFiles[0].content === defaultCode[state.language]) {
            newFiles[0] = {
                ...newFiles[0],
                name: `main${getExtension(language)}`,
                content: defaultCode[language] || ''
            };
        }
        return { language, files: newFiles };
    }),
    setOutput: (output) => set({ output }),
    setIsRunning: (isRunning) => set({ isRunning }),
    appendOutput: (chunk) => set((state) => ({ output: state.output + chunk })),
    addHistory: (item) => set((state) => ({ history: [item, ...state.history].slice(0, 50) })),
    setHistory: (history) => set({ history }),
    clearOutput: () => set({ output: '' })
}));
