import { api } from './api'

const clientSide = new Set(['javascript', 'typescript'])

function runJS(code, stdin) {
  return new Promise((resolve) => {
    let out = ''
    let err = ''
    const origLog = console.log
    const origErr = console.error
    console.log = (...a) => { out += a.map(String).join(' ') + '\n' }
    console.error = (...a) => { err += a.map(String).join(' ') + '\n' }
    try {
      const fn = new Function('stdin', code)
      const result = fn(stdin)
      if (result instanceof Promise) {
        result.then(() => {
          console.log = origLog
          console.error = origErr
          resolve({ stdout: out, stderr: err, output: out + err, code: 0 })
        }).catch((e) => {
          console.log = origLog
          console.error = origErr
          resolve({ stdout: out, stderr: String(e), output: out + String(e), code: 1 })
        })
        return
      }
    } catch (e) {
      err += String(e)
    }
    console.log = origLog
    console.error = origErr
    resolve({ stdout: out, stderr: err, output: out + err, code: err ? 1 : 0 })
  })
}

export async function executeWorkspace({ language, version, files, stdin }) {
  if (clientSide.has(language)) {
    const entry = files[0]
    const combined = files.map(f => f.content).join('\n\n')
    const local = await runJS(combined, stdin)
    try {
      const remote = await api.execute({ language, version: version || '*', files: files.map(f => ({ name: f.name, content: f.content })), stdin })
      return remote
    } catch {
      return { language, version: version || '*', run: local }
    }
  }
  const result = await api.execute({ language, version: version || '*', files: files.map(f => ({ name: f.name, content: f.content })), stdin })
  return result
}
