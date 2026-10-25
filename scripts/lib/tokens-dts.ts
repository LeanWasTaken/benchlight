import { join } from 'node:path'
import ts from 'typescript'

// dist/tokens.d.ts: the declarations of tokens/tokens.ts, which exports exactly what
// tokens/index.ts re-exports. One self-contained file, so `benchlight/tokens` types resolve
// under any consumer moduleResolution (NodeNext rejects the source's extensionless import).
export function tokensDeclaration(root: string): string {
  const file = join(root, 'tokens/tokens.ts')
  const program = ts.createProgram([file], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    declaration: true,
    emitDeclarationOnly: true,
    skipLibCheck: true,
    types: []
  })
  const diagnostics = ts.getPreEmitDiagnostics(program)
  if (diagnostics.length) {
    throw new Error(ts.formatDiagnostics(diagnostics, ts.createCompilerHost({})))
  }
  let out = ''
  program.emit(program.getSourceFile(file), (_name, text) => {
    out = text
  })
  return out
}
