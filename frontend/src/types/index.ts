export interface RunResult {
    output: string;
    time: number;
}

export type SupportedLanguage =
    | 'python'
    | 'javascript'
    | 'typescript'
    | 'nodejs'
    | 'cpp'
    | 'c'
    | 'java'
    | 'rust'
    | 'go'
    | 'ruby'
    | 'php'
    | 'swift'
    | 'kotlin'
    | 'scala'
    | 'csharp'
    | 'bash'
    | 'sql';

export interface Snippet {
    id?: string;
    code: string;
    language: SupportedLanguage;
    createdAt?: string;
}

export interface HistoryItem {
    id: string;
    timestamp: number;
    language: string;
    code: string;
    output: string;
    timeTaken: number;
}
