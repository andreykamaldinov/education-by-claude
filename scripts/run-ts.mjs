// Bundles a TypeScript script with esbuild (already installed by Angular CLI) and runs it in Node.
// Usage: node scripts/run-ts.mjs scripts/verify-content.ts
import { build } from 'esbuild';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const entry = process.argv[2];
if (!entry) {
  console.error('Укажите TypeScript-файл: node scripts/run-ts.mjs <file.ts>');
  process.exit(1);
}

// Inside node_modules so the bundle resolves external packages from the project.
const cacheDir = resolve('node_modules/.cache');
mkdirSync(cacheDir, { recursive: true });
const outDir = mkdtempSync(join(cacheDir, 'devshelf-'));
const outfile = join(outDir, 'script.mjs');

await build({
  entryPoints: [resolve(entry)],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  packages: 'external',
  logLevel: 'warning',
});

try {
  await import(pathToFileURL(outfile).href);
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
