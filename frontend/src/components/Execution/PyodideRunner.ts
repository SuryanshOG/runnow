import { loadPyodide, type PyodideInterface } from 'pyodide';
import type { CodeFile } from '../../store/useCodeStore';

let pyodideInstance: PyodideInterface | null = null;
let isLoading = false;

export const runPython = async (files: CodeFile[], activeFileId: string, stdin: string = '', onOutput: (msg: string) => void): Promise<{ output: string, time: number }> => {
    const startTime = Date.now();
    try {
        if (!pyodideInstance) {
            if (isLoading) {
                // Wait for it to finish loading
                while (isLoading) {
                    await new Promise(r => setTimeout(r, 100));
                }
            } else {
                isLoading = true;
                onOutput("System: Downloading Python 3.12 (first time only - 8-12 MB)...\n");
                pyodideInstance = await loadPyodide({
                    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/",
                });

                // Optional: Pre-load common packages (can also be removed for speed)
                // await pyodideInstance.loadPackage(['numpy']);
                isLoading = false;
                onOutput("System: Python ready!\n\n");
            }
        }

        if (!pyodideInstance) {
            throw new Error("Failed to initialize Pyodide");
        }

        let output = '';
        pyodideInstance.setStdout({
            batched: (msg: string) => {
                output += msg + '\n';
                onOutput(msg + '\n');
            }
        });

        pyodideInstance.setStderr({
            batched: (msg: string) => {
                output += 'ERROR: ' + msg + '\n';
                onOutput('ERROR: ' + msg + '\n');
            }
        });

        // Write all non-main files to the virtual file system
        const mainFile = files.find(f => f.id === activeFileId);
        if (!mainFile) throw new Error("Main file not found");

        for (const file of files) {
            if (file.id !== activeFileId) {
                // write to Pyodide FS
                pyodideInstance.FS.writeFile(file.name, file.content);
            }
        }

        // Set stdin if needed
        if (stdin) pyodideInstance.globals.set("input_data", stdin);

        const result = await pyodideInstance.runPythonAsync(mainFile.content);

        // Pyodide may return the result of the last expression
        if (result !== undefined && !output) {
            output = result.toString() + '\\n';
            onOutput(output);
        }

        return { output, time: Date.now() - startTime };
    } catch (err: any) {
        isLoading = false;
        const errorMsg = err.message || err.toString();
        onOutput('\\nERROR: ' + errorMsg + '\\n');
        return { output: 'ERROR: ' + errorMsg, time: Date.now() - startTime };
    }
};
