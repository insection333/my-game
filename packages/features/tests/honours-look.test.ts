// A player's look (session 43): thirty pictures, twelve of them open from the first day so everyone has a
// choice at once; the rest, and every glow, badge, prestige frame and scene past the first, opened only
// by deeds of the middle and end of the game, so a profile that wears them says its owner is a veteran.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { HONOURS, shownHonours, unlocked } from '../src/deeds/honours.ts';
import { deedById } from '../src/deeds/list.ts';
import { choose } from '../src/deeds/rules.ts';
import { setDeeds } from '../src/deeds/state.ts';

const T0 = Date.UTC(2026, 10, 4, 9);
const withDeeds = (done: string[], chosen: Record<string, string | null> = {}): State => {
  const s = newState(43, T0);
  setDeeds(s, {
    done: Object.fromEntries(done.map((d) => [d, T0])),
    title: null,
    banner: null,
    frame: null,
    picture: null,
    glow: null,
    badge: null,
    scene: null,
    ...chosen,
  });
  return s;
};

describe("a player's look", () => {
  it('starts as the forester before the march by day, with no glow or badge', () => {
    expect(shownHonours(newState(1, T0))).toMatchObject({
      picture: 'forester',
      scene: 'march',
      glow: null,
      badge: null,
    });
  });

  it('offers thirty pictures, twelve of them from the first day', () => {
    const pictures = HONOURS.filter((h) => h.kind === 'picture');
    expect(pictures).toHaveLength(30);
    expect(new Set(pictures.map((h) => h.id)).size).toBe(30);
    expect(pictures.filter((h) => unlocked(h, {}, 0))).toHaveLength(12);
  });

  it("opens a foe's picture once a hundred have fallen, and not before", () => {
    expect(choose(withDeeds([]), 'picture', 'hill-troll').result).toEqual({ ok: false, reason: 'locked' });
    const after = choose(withDeeds(['foe-hill-troll-100']), 'picture', 'hill-troll');
    expect(after.result).toEqual({ ok: true });
    expect(shownHonours(after.state).picture).toBe('hill-troll');
  });

  it('keeps every glow, badge, prestige frame and later scene for the middle and end of the game', () => {
    const veteran = HONOURS.filter(
      (h) =>
        h.kind === 'glow' ||
        h.kind === 'badge' ||
        (h.kind === 'frame' && (h.id === 'royal' || h.id === 'obsidian')) ||
        (h.kind === 'scene' && h.id !== 'march'),
    );
    expect(veteran.length).toBeGreaterThanOrEqual(15);
    for (const h of veteran) {
      expect(h.unlock && 'deed' in h.unlock).toBe(true);
      const d = h.unlock && 'deed' in h.unlock ? deedById(h.unlock.deed) : undefined;
      // A real deed, and a hard one at least.
      expect(d, `${h.kind} ${h.id}`).toBeDefined();
      expect(['hard', 'elite', 'master']).toContain(d!.tier);
    }
  });

  it('shows a locked choice as the default, as a save that names one is read', () => {
    const s = withDeeds([], { picture: 'ember-wyrm', glow: 'aurora', scene: 'castle' });
    expect(shownHonours(s)).toMatchObject({ picture: 'forester', glow: null, scene: 'march' });
  });
});
