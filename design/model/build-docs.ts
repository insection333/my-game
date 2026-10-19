// Builds GAME_DESIGN.md from design/GAME_DESIGN.template.md, the model's tables and its latest report.
// Run after checks: node design/model/checks2.ts && node design/model/build-docs.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { TABLES } from './tables.ts';

const root = new URL('../../', import.meta.url);
let doc = readFileSync(new URL('design/GAME_DESIGN.template.md', root), 'utf8');
const report = '```text\n' + readFileSync(new URL('design/model/report.md', root), 'utf8').replace(/^## /gm, '') + '```';
for (const [k, v] of Object.entries({ ...TABLES, REPORT: report })) doc = doc.replaceAll(`{{${k}}}`, v.trim());
const missing = doc.match(/\{\{[A-Z_]+\}\}/g);
if (missing) throw new Error(`Unfilled placeholders: ${missing.join(', ')}`);
writeFileSync(new URL('GAME_DESIGN.md', root), `<!-- Generated from design/GAME_DESIGN.template.md by design/model/build-docs.ts. Edit the template. -->\n\n${doc}`);
console.log('GAME_DESIGN.md written');
