import { describe, expect, it } from 'vitest';
import {
  applyEffects,
  avoidedTerms,
  buildLadder,
  EFFECT_KINDS,
  emptyLevels,
  fillPerks,
  fmt,
  formatEffect,
  formatStop,
  placeholders,
  levelFor,
  levelProgress,
  masteryStep,
  MAX_LEVEL,
  t,
  templateOf,
  allStringKeys,
  CONTACT_ADDRESS,
  XP_TABLE,
} from '../src/index.ts';

describe('fmt', () => {
  it('formats numbers one way everywhere', () => {
    expect(fmt.int(1234567.4)).toBe('1,234,567');
    expect([12_345, 123_456, 2_500_000].map(fmt.short)).toEqual(['12,345', '123.5K', '2.5M']);
    expect(fmt.pct(2.5)).toBe('2.5%');
    expect(fmt.seconds(7.5)).toBe('7.5 s');
    expect(fmt.seconds(37.74)).toBe('37.7 s');
    expect([45_000, 12 * 60_000, 200 * 60_000, 52 * 3600_000].map(fmt.duration)).toEqual([
      '45 s',
      '12 min',
      '3 h 20 min',
      '2 d 4 h',
    ]);
    expect([1, 4, 8, 9, 14, 39].map(fmt.roman)).toEqual(['I', 'IV', 'VIII', 'IX', 'XIV', 'XXXIX']);
  });
});

describe('t', () => {
  it('fills a template', () => {
    expect(t('skill.toNext', { xp: '1,200', level: '5' })).toBe('1,200 XP to level 5');
  });

  it('refuses a missing key, a missing parameter and an unknown one', () => {
    expect(() => t('no.such.key')).toThrow('Missing string "no.such.key"');
    expect(() => t('skill.level')).toThrow('needs {level}');
    expect(() => t('skill.top', { level: '3' })).toThrow('has no {level}');
  });

  it('has a one-form beside every count before a plural, so the page never says "1 milestones"', () => {
    // Counts that are never 1: the 500 completions a Rare find gives, the log sizes milestones ask for.
    const neverOne = ['item.panel.use', 'goal.milestone.log'];
    const plural = /\{(count|skills)\} (?:[A-Za-z]+ )?[a-z]+s\b/;
    const missing = allStringKeys().filter(
      (k) => plural.test(templateOf(k)!) && !neverOne.includes(k) && !allStringKeys().includes(`${k}One`),
    );
    expect(missing).toEqual([]);
  });
});

describe('the contact address', () => {
  it('is given wherever a player is told to write to us', () => {
    for (const k of ['legal.privacy.body', 'legal.terms.body']) expect(templateOf(k), k).toContain(CONTACT_ADDRESS);
    expect(t('welcome.forgot', { address: CONTACT_ADDRESS })).toContain(CONTACT_ADDRESS);
    expect(allStringKeys().filter((k) => templateOf(k)!.includes('contact address shown'))).toEqual([]);
  });
});

describe('stop reasons', () => {
  it("have a short form a phone's lane chip can show, beside the full one and needing no more", () => {
    const shorts = allStringKeys().filter((k) => k.startsWith('stopShort.'));
    expect(shorts.length).toBeGreaterThan(0);
    for (const k of shorts) {
      const full = `stop.${k.slice('stopShort.'.length)}`;
      expect(allStringKeys(), k).toContain(full);
      const need = placeholders(templateOf(k)!);
      expect(placeholders(templateOf(full)!), k).toEqual(expect.arrayContaining(need));
      expect(templateOf(k)!.replace(/\{level\}/g, '99').length, k).toBeLessThanOrEqual(14);
    }
    expect(formatStop({ code: 'retreated', detail: { foe: 'x' } }, 'short')).toBe('Out of food');
    // A reason short already has no second form; the chip shows it whole.
    expect(formatStop({ code: 'storehouseFull' }, 'short')).toBe('Storehouse full');
  });
});

describe('effects', () => {
  it('formats every kind from its numbers', () => {
    expect(formatEffect({ kind: 'speed', pct: 2.5 })).toBe('2.5% faster');
    expect(formatEffect({ kind: 'maxHealth', amount: 40 })).toBe('+40 health');
    expect(formatEffect({ kind: 'retreatAt', pct: 12 })).toBe('retreat at 12% health instead of 20%');
    expect(EFFECT_KINDS).toHaveLength(13);
  });

  it('adds effects into modifiers; the lowest retreat point wins', () => {
    const m = applyEffects([
      { kind: 'speed', pct: 2.5 },
      { kind: 'speed', pct: 3 },
      { kind: 'retreatAt', pct: 12 },
      { kind: 'retreatAt', pct: 15 },
    ]);
    expect(m.speed).toBe(5.5);
    expect(m.retreatAt).toBe(12);
    expect(m.damage).toBe(0);
  });
});

describe('progression', () => {
  it('reads levels from the XP table', () => {
    expect(XP_TABLE).toHaveLength(MAX_LEVEL + 1);
    expect([0, 49, 50, 6790, 8_100_000, XP_TABLE[99] - 1, XP_TABLE[99], 1e12].map(levelFor)).toEqual([
      1, 1, 2, 10, 40, 98, 99, 99,
    ]);
    // Past 40 a level never costs less XP than the one before it.
    for (let l = 3; l <= MAX_LEVEL; l++)
      expect(XP_TABLE[l] - XP_TABLE[l - 1], `level ${l}`).toBeGreaterThanOrEqual(XP_TABLE[l - 1] - XP_TABLE[l - 2]);
    expect(levelProgress(100)).toEqual({ level: 2, into: 50, span: 100, toNext: 50 });
    expect(levelProgress(9e9).toNext).toBe(0);
  });

  it('counts mastery steps, faster with the masteryGain perk', () => {
    expect([0, 29, 30, 28_800].map((c) => masteryStep(c))).toEqual([0, 0, 1, 10]);
    expect(masteryStep(28, 10)).toBe(1);
  });
});

describe('ladders', () => {
  it('builds a ladder and finds its empty levels', () => {
    const ladder = buildLadder(
      [{ id: 'a', level: 1 }],
      [{ perk: 'p', effect: { kind: 'speed', pct: 1 }, levels: [2, 4] }],
    );
    expect(ladder[3]).toEqual([{ type: 'perk', perk: 'p', rank: 2, effect: { kind: 'speed', pct: 1 } }]);
    expect(emptyLevels(ladder)).toEqual([3, ...Array.from({ length: MAX_LEVEL - 4 }, (_, i) => i + 5)]);
  });

  it('fills every free level with perk lines in turn, at half strength past 40, around the capstones', () => {
    const ladder = fillPerks(
      buildLadder(
        [
          { id: 'a', level: 1 },
          { id: 'b', level: 3 },
        ],
        [],
      ),
      [
        { perk: 'p', effect: { kind: 'speed', pct: 2 } },
        { perk: 'q', effect: { kind: 'maxHealth', amount: 40 } },
      ],
      { 40: { perk: 'm', effect: { kind: 'damage', pct: 8 } }, 99: { perk: 'g', effect: { kind: 'damage', pct: 10 } } },
    );
    expect(emptyLevels(ladder)).toEqual([]);
    expect(ladder[1]).toEqual([{ type: 'perk', perk: 'p', rank: 1, effect: { kind: 'speed', pct: 2 } }]);
    expect(ladder[2]).toEqual([{ type: 'action', action: 'b' }]);
    expect(ladder[3]).toEqual([{ type: 'perk', perk: 'q', rank: 1, effect: { kind: 'maxHealth', amount: 40 } }]);
    expect(ladder[39]).toEqual([{ type: 'perk', perk: 'm', rank: 1, effect: { kind: 'damage', pct: 8 } }]);
    // Past 40, each line's rank gives half.
    expect([ladder[40][0], ladder[41][0]].map((u) => (u.type === 'perk' ? u.effect : null))).toEqual(
      expect.arrayContaining([
        { kind: 'speed', pct: 1 },
        { kind: 'maxHealth', amount: 20 },
      ]),
    );
    expect(ladder[98]).toEqual([{ type: 'perk', perk: 'g', rank: 1, effect: { kind: 'damage', pct: 10 } }]);
  });
});

describe('the glossary', () => {
  it('finds terms to avoid, but allows the game its name', () => {
    expect(avoidedTerms('Your bank is full; go AFK')).toEqual(['bank', 'AFK']);
    expect(avoidedTerms('Welcome to Idle Clash')).toEqual([]);
    expect(avoidedTerms('Skills')).toEqual([]);
  });
});
