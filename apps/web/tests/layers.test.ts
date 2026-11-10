// The order things stack in (session 69): a moment is raised by what the player just did, often from an
// open sheet (a spy sent from a lord's sheet), so it stands above sheets; on a phone a sheet fills the foot
// of the screen and covered every toast. The tour stands above both.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
/** The z-index a rule sets, by its selector. */
function layerOf(text: string, selector: string): number {
  const at = text.indexOf(`${selector} {`);
  if (at < 0) throw new Error(`no ${selector}`);
  const rule = text.slice(at, text.indexOf('}', at));
  const z = /z-index:\s*(-?\d+)/.exec(rule);
  if (!z) throw new Error(`${selector} sets no z-index`);
  return Number(z[1]);
}

describe('the layers', () => {
  it('put moments above sheets, and the tour above moments', () => {
    const shell = css('../src/shell/shell.module.css');
    const sheet = layerOf(css('../../../packages/ui/src/components/Sheet.module.css'), '.layer');
    const moments = layerOf(shell, '.moments');
    expect(moments).toBeGreaterThan(sheet);
    expect(layerOf(css('../src/shell/tour.module.css'), '.ring')).toBeGreaterThan(moments);
  });
});
