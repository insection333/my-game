// Builds GAME_DESIGN.md from design/GAME_DESIGN.template.md, the model's tables and its latest report.
// Run after checks: node design/model/checks2.ts && node design/model/build-docs.ts
// With --check, writes nothing and exits 1 if GAME_DESIGN.md is out of date (used by pnpm verify).
import { readFileSync, writeFileSync } from 'node:fs';
import { TABLES } from './tables.ts';

const root = new URL('../../', import.meta.url);
const target = new URL('GAME_DESIGN.md', root);
let doc = readFileSync(new URL('design/GAME_DESIGN.template.md', root), 'utf8');
const report =
  '```text\n' + readFileSync(new URL('design/model/report.md', root), 'utf8').replace(/^## /gm, '') + '```';
for (const [k, v] of Object.entries({ ...TABLES, REPORT: report })) doc = doc.replaceAll(`{{${k}}}`, v.trim());
const missing = doc.match(/\{\{[A-Z_]+\}\}/g);
if (missing) throw new Error(`Unfilled placeholders: ${missing.join(', ')}`);
const built = `<!-- Generated from design/GAME_DESIGN.template.md by design/model/build-docs.ts. Edit the template. -->\n\n${doc}`;

if (process.argv.includes('--check')) {
  const current = readFileSync(target, 'utf8');
  if (current !== built) {
    console.log('GAME_DESIGN.md is out of date with its template or the model: run pnpm design:build');
    process.exit(1);
  }
  console.log('GAME_DESIGN.md matches its template and the model');
} else {
  writeFileSync(target, built);
  console.log('GAME_DESIGN.md written');
}
