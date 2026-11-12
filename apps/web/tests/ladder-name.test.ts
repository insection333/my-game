// The ladder's name on a phone (session 82): below 720 px the ladders' tabs are thirteen bare icons, and
// the ladder shown was named only in a caption hidden from sight, so a player could not tell the axe's
// ladder from the pickaxe's. The caption is seen where the tabs are icons, and hidden where they are named.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tsx = readFileSync(new URL('../src/pages/Hiscores.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/pages/hiscores.module.css', import.meta.url), 'utf8');
/** The body of the container rule that holds `selector`, by the rule's own condition. */
const ruleIn = (condition: string, selector: string) => {
  const at = css.indexOf(`@container main (${condition})`);
  if (at < 0) return '';
  const body = css.slice(at, css.indexOf('\n}\n', at));
  const i = body.indexOf(`${selector} {`);
  return i < 0 ? '' : body.slice(i, body.indexOf('}', i));
};

describe("the ladder's name", () => {
  it('is a caption seen where the tabs are icons alone', () => {
    expect(tsx).toMatch(/<caption className=\{s\.caption\}>/);
    expect(ruleIn('min-width: 720px', '.caption')).toMatch(/clip-path: inset\(50%\)/);
    expect(css).toMatch(/\.caption \{[^}]*caption-side: top/);
  });
});
