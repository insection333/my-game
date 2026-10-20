import { describe, expect, it } from 'vitest';
import { annotation, runSteps, type Step, type StepResult } from '../run.ts';

const step = (n: number, result: StepResult | Error): Step => ({
  n,
  name: `Step ${n}`,
  run: () => (result instanceof Error ? Promise.reject(result) : Promise.resolve(result)),
});

async function run(steps: Step[], only?: number[]) {
  const lines: string[] = [];
  const code = await runSteps(steps, { only, print: (l) => lines.push(l), now: () => 0 });
  return { code, lines };
}

describe('annotation', () => {
  it('turns a failure into one GitHub annotation line', () => {
    const line = annotation(
      { n: 3, name: 'Content', run: () => ({ status: 'pass', summary: '' }) },
      { status: 'fail', summary: '50% done', detail: 'a\nb' },
    );
    expect(line).toBe('::error title=verify step 3 (Content)::50%25 done%0Aa%0Ab');
  });
});

describe('runSteps', () => {
  it('is green when every step passes or is not built yet', async () => {
    const { code, lines } = await run([
      step(1, { status: 'pass', summary: 'ok' }),
      step(2, { status: 'skip', summary: 'later' }),
    ]);
    expect(code).toBe(0);
    expect(lines.at(-1)).toBe('verify: green (1 passed, 1 not built yet)');
  });

  it('is red when any step fails, and shows why below its line', async () => {
    const { code, lines } = await run([
      step(1, { status: 'fail', summary: 'lint found problems', detail: 'x.ts: unused' }),
      step(2, { status: 'pass', summary: 'ok' }),
    ]);
    expect(code).toBe(1);
    expect(lines[0]).toContain('FAIL  lint found problems');
    expect(lines[1]).toBe('      x.ts: unused');
    expect(lines.at(-1)).toBe('verify: RED (1 failed, 1 passed)');
  });

  it('counts a crashing step as a failure, not a pass', async () => {
    const { code, lines } = await run([step(1, new Error('boom'))]);
    expect(code).toBe(1);
    expect(lines[0]).toContain('the step itself crashed');
  });

  it('prints one line per step, in order, and runs only the chosen steps', async () => {
    const steps = [1, 2, 3].map((n) => step(n, { status: 'pass', summary: `s${n}` }));
    const { lines } = await run(steps, [3, 1]);
    expect(lines.map((l) => l.trim().split(/\s+/)[0])).toEqual(['1', '3', 'verify:']);
  });
});
