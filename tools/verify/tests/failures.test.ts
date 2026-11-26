// Session 262: a failed test run showed its first sixty lines, every one a passing file, and the failure lay in
// the lines cut off; verify now shows the failures.
import { describe, expect, it } from 'vitest';
import { failuresOf } from '../failures.ts';

describe('a failed test run', () => {
  it('is shown from its failures', () => {
    const passing = Array.from({ length: 200 }, (_, i) => ` ✓ tests/file-${String(i)}.test.ts (3 tests) 20ms`);
    const out = [
      ...passing,
      '⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯',
      ' FAIL  tests/x.test.ts > it breaks',
      'AssertionError: no',
    ].join('\n');
    expect(failuresOf(out).split('\n')[0]).toBe('⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯');
    expect(failuresOf('a\nb').split('\n')).toEqual(['a', 'b']);
  });
});
