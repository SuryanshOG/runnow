export const languageConfig = {
  javascript: { monaco: 'javascript', ext: 'js', template: `console.log("hello from RunNow")\n\nfunction fib(n) {\n  if (n <= 1) return n\n  return fib(n-1) + fib(n-2)\n}\nconsole.log(fib(10))` },
  typescript: { monaco: 'typescript', ext: 'ts', template: `function greet(name: string): string {\n  return \`hello \${name} from RunNow\`\n}\nconsole.log(greet("world"))` },
  python: { monaco: 'python', ext: 'py', template: `print("hello from RunNow")\n\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n\nprint(fib(10))` },
  go: { monaco: 'go', ext: 'go', template: `package main\nimport "fmt"\nfunc main() {\n  fmt.Println("hello from RunNow")\n}` },
  rust: { monaco: 'rust', ext: 'rs', template: `fn main() {\n  println!("hello from RunNow");\n}` },
  java: { monaco: 'java', ext: 'java', template: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("hello from RunNow");\n  }\n}` },
  cpp: { monaco: 'cpp', ext: 'cpp', template: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  cout << "hello from RunNow" << endl;\n}` },
  c: { monaco: 'c', ext: 'c', template: `#include <stdio.h>\nint main(){\n  printf("hello from RunNow\\n");\n}` },
  csharp: { monaco: 'csharp', ext: 'cs', template: `using System;\nclass Program{\n  static void Main(){\n    Console.WriteLine("hello from RunNow");\n  }\n}` },
  php: { monaco: 'php', ext: 'php', template: `<?php\necho "hello from RunNow\\n";` },
  ruby: { monaco: 'ruby', ext: 'rb', template: `puts "hello from RunNow"` },
  swift: { monaco: 'swift', ext: 'swift', template: `print("hello from RunNow")` },
  kotlin: { monaco: 'kotlin', ext: 'kt', template: `fun main(){\n  println("hello from RunNow")\n}` },
  scala: { monaco: 'scala', ext: 'scala', template: `object Main extends App {\n  println("hello from RunNow")\n}` },
  haskell: { monaco: 'haskell', ext: 'hs', template: `main = putStrLn "hello from RunNow"` },
  elixir: { monaco: 'elixir', ext: 'exs', template: `IO.puts "hello from RunNow"` },
  erlang: { monaco: 'erlang', ext: 'erl', template: `-module(main).\n-export([main/0]).\nmain() -> io:fwrite("hello from RunNow\\n").` },
  dart: { monaco: 'dart', ext: 'dart', template: `void main(){\n  print("hello from RunNow");\n}` },
  r: { monaco: 'r', ext: 'r', template: `cat("hello from RunNow\\n")` },
  julia: { monaco: 'julia', ext: 'jl', template: `println("hello from RunNow")` },
  perl: { monaco: 'perl', ext: 'pl', template: `print "hello from RunNow\\n";` },
  lua: { monaco: 'lua', ext: 'lua', template: `print("hello from RunNow")` },
  bash: { monaco: 'shell', ext: 'sh', template: `echo "hello from RunNow"` },
  powershell: { monaco: 'powershell', ext: 'ps1', template: `Write-Host "hello from RunNow"` },
  zig: { monaco: 'zig', ext: 'zig', template: `const std = @import("std");\npub fn main() void {\n  std.debug.print("hello from RunNow\\n", .{});\n}` },
  nim: { monaco: 'nim', ext: 'nim', template: `echo "hello from RunNow"` },
  ocaml: { monaco: 'ocaml', ext: 'ml', template: `print_endline "hello from RunNow";;` },
  clojure: { monaco: 'clojure', ext: 'clj', template: `(println "hello from RunNow")` },
  fsharp: { monaco: 'fsharp', ext: 'fs', template: `printfn "hello from RunNow"` },
  fortran: { monaco: 'fortran', ext: 'f90', template: `program hello\n  print *, "hello from RunNow"\nend program` },
  assembly: { monaco: 'asm', ext: 'asm', template: `section .text\n  global _start\n_start:\n  mov rax,1\n  ret` },
  sql: { monaco: 'sql', ext: 'sql', template: `SELECT 'hello from RunNow';` },
  html: { monaco: 'html', ext: 'html', template: `<h1>hello from RunNow</h1>` },
}

export const allLanguages = Object.keys(languageConfig)

export function extFor(lang) {
  return languageConfig[lang]?.ext || 'txt'
}

export function monacoLang(lang) {
  return languageConfig[lang]?.monaco || 'plaintext'
}

export function templateFor(lang) {
  return languageConfig[lang]?.template || ''
}
