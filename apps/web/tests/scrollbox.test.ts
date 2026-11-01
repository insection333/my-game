// A scroll box's edges: faded only where rows lie beyond them.
import { describe, expect, it } from 'vitest';
import { edges } from '../src/scrollbox.ts';

describe('a scroll box', () => {
  it('fades its foot at the top of a long list, both edges midway, its head at the end', () => {
    expect(edges(0, 300, 900)).toEqual({ above: false, below: true });
    expect(edges(300, 300, 900)).toEqual({ above: true, below: true });
    expect(edges(600, 300, 900)).toEqual({ above: true, below: false });
  });

  it('fades nothing when everything fits, and allows a pixel for rounding', () => {
    expect(edges(0, 300, 300)).toEqual({ above: false, below: false });
    expect(edges(0.5, 300, 300.8)).toEqual({ above: false, below: false });
    expect(edges(599.4, 300, 900)).toEqual({ above: true, below: false });
  });
});
