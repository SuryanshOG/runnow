import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import type { CodeFile } from '../../store/useCodeStore';

let webcontainerInstance: WebContainer | null = null;
let isBooting = false;

export const runJS = async (files: CodeFile[], activeFileId: string, stdin: string = '', onOutput: (msg: string) => void): Promise<{ output: string, time: number }> => {
    const startTime = Date.now();
    try {
        if (!webcontainerInstance) {
            if (isBooting) {
                while (isBooting) {
                    await new Promise(r => setTimeout(r, 100));
                }
            } else {
                isBooting = true;
                onOutput("System: Booting WebContainer (Node.js environment)...\n");
                webcontainerInstance = await WebContainer.boot();
                isBooting = false;
                onOutput("System: WebContainer ready!\n\n");
            }
        }

        if (!webcontainerInstance) {
            throw new Error("Failed to initialize WebContainer");
        }

        const mainFile = files.find(f => f.id === activeFileId);
        if (!mainFile) throw new Error("Main file not found");

        // Build the mount object from the files array
        const mountObj: FileSystemTree = {};
        for (const file of files) {
            mountObj[file.name] = {
                file: {
                    contents: file.content
                }
            };
        }

        // Detect whether any file uses CommonJS patterns
        const allCode = files.map(f => f.content).join('\n');
        const usesCJS = /(?:^|[^.\w])require\s*\(/.test(allCode) || /module\.exports/.test(allCode);

        // Add package.json if it doesn't exist
        if (!files.some(f => f.name === 'package.json')) {
            const pkg: Record<string, unknown> = {
                name: 'runnow-snippet',
                scripts: { start: `node ${mainFile.name}` },
            };
            // Only declare ESM if no CJS patterns are detected
            if (!usesCJS) pkg.type = 'module';
            mountObj['package.json'] = {
                file: {
                    contents: JSON.stringify(pkg)
                }
            };
        }

        // Mount the files tree
        await webcontainerInstance.mount(mountObj);

        // We only need to npm install if there are dependencies, but we'll skip it for simple scripts
        // For a robust implementation, we would parse package.json or allow users to provide one

        // Run the node process pointing to the active file
        const process = await webcontainerInstance.spawn('node', [mainFile.name]);
        let output = '';

        // If stdin is provided, write it to the process
        if (stdin) {
            const writer = process.input.getWriter();
            await writer.write(stdin);
            writer.releaseLock();
        }

        // Capture output
        process.output.pipeTo(new WritableStream({
            write(data) {
                output += data;
                onOutput(data);
            }
        }));

        // Wait for the process to exit
        const exitCode = await process.exit;

        if (exitCode !== 0) {
            onOutput(`\\nProcess exited with code ${exitCode}\\n`);
        }

        return { output, time: Date.now() - startTime };
    } catch (err: any) {
        isBooting = false;
        const errorMsg = err.message || err.toString();
        onOutput('\\nERROR: ' + errorMsg + '\\n');
        return { output: 'ERROR: ' + errorMsg, time: Date.now() - startTime };
    }
};
