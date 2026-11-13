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
    const noon = new Date(2026, 10, 10, 12, 0).getTime();
    expect(fmt.when(new Date(2026, 10, 10, 9, 5).getTime(), noon)).toBe('09:05');
    expect(fmt.when(new Date(2026, 10, 9, 20, 22).getTime(), noon)).toBe('9 Nov, 20:22');
    expect(fmt.when(new Date(2025, 10, 9, 20, 22).getTime(), noon)).toBe('9 Nov 2025');
    // Session 84: every month in three letters, the same in every browser, where September read "Sept"
    // beside "Oct" (en-GB's short month in newer browsers, "Sep" in older ones).
    expect(Array.from({ length: 12 }, (_, m) => fmt.day(new Date(2026, m, 13, 9).getTime(), noon))).toEqual(
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => `13 ${m}`),
    );
    expect(fmt.when(new Date(2026, 8, 13, 20, 22).getTime(), noon)).toBe('13 Sep, 20:22');
    expect(fmt.day(new Date(2025, 8, 3, 9).getTime(), noon)).toBe('3 Sep 2025');
    expect(fmt.date(new Date(2026, 8, 3, 9).getTime())).toBe('3 Sep 2026');
    expect([0, 0.001, 0.004, 0.005, 0.37, 0.994, 0.995, 0.9999, 1].map(fmt.chance)).toEqual([
      '0%',
      '<1%',
      '<1%',
      '1%',
      '37%',
      '99%',
      '>99%',
      '>99%',
      '100%',
    ]);
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 103, 1011].map(fmt.ordinal)).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '11th',
      '12th',
      '13th',
      '21st',
      '22nd',
      '103rd',
      '1,011th',
    ]);
    expect([1, 4, 8, 9, 14, 39].map(fmt.roman)).toEqual(['I', 'IV', 'VIII', 'IX', 'XIV', 'XXXIX']);
  });
});

describe('t', () => {
  it('ends a note under a panel that is a sentence with a full stop, as every other note does', () => {
    // Session 85: Kindling's notes ("Change your Path whenever you like; it costs nothing") had none.
    const bare = allStringKeys()
      .filter((k) => /(\.note|Note|\.locked|\.noPath)$/.test(k))
      .filter((k) => {
        const text = templateOf(k) ?? '';
        return text.split(' ').length >= 4 && !/[.!?)]$/.test(text);
      });
    expect(bare).toEqual([]);
  });

  it('fills a template', () => {
    expect(t('skill.toNext', { xp: '1,200', level: '5' })).toBe('1,200 XP to level 5');
  });

  it('refuses a missing key, a missing parameter and an unknown one', () => {
    expect(() => t('no.such.key')).toThrow('Missing string "no.such.key"');
    expect(() => t('skill.level')).toThrow('needs {level}');
    expect(() => t('kindling.pathsNote', { level: '3' })).toThrow('has no {level}');
  });

  it('has a one-form beside every count before a plural, so the page never says "1 milestones"', () => {
    // Session 66: every counting placeholder, not only {count}: "+1 war marks", "1 marks so far" and
    // "Playing for 1 days" were all on screen. Counts that are never 1 are named here, each with why.
    const neverOne = [
      // The 500 completions a Rare find gives, and the log sizes milestones ask for.
      'item.panel.use',
      'moment.findUsed.body',
      'item.panel.useOn',
      'item.panel.useOnFoe',
      'item.panel.useOnRegion',
      'goal.milestone.log',
      // The Storehouse grows 6 spaces at a time, and the builder's cord 6 a rank.
      'store.enlarge',
      'relic.effect.slots',
      // Deed points come in fives (an easy deed is worth 5).
      'deeds.points',
      'deeds.worth',
      'deeds.nextTitle',
      'honour.unlock.points',
      'moment.deedPoints',
      // An hour's run is 6 stages; a relic's first rank costs 10 marks.
      'expedition.summary',
      'relic.next',
      // The admin's pairs are listed from 4 sieges.
      'admin.flows.facts',
      // The castle pays and asks war marks by the handful: a caught spy's 2 is the least a report says, a
      // stronghold pays 9 or more, a fortress 10 or more, and studies, relics and tempering cost 10 or more.
      'castle.report.marks',
      'castle.target.pays',
      'castle.target.paysMarks',
      'castle.incursion.rewards',
      'castle.study',
      'castle.relic.forge',
      'castle.temper.cost',
      // A lord's spoils are a range ("2–5 war marks").
      'castle.target.paysLord',
      'castle.target.paysLordUnscouted',
    ];
    const plural = /\{(count|skills|marks|days|points|slots|sieges|stages)\} (?:[A-Za-z]+ )?[a-z]+s\b/;
    const missing = allStringKeys().filter(
      (k) =>
        plural.test(templateOf(k)!) &&
        !neverOne.includes(k) &&
        !k.startsWith('deed.') &&
        !allStringKeys().includes(`${k}One`),
    );
    expect(missing).toEqual([]);
  });
});

describe('the terms of use', () => {
  // Session 96: they sent a reporter to "their sheet in the War room", a name no tab bears; reporting is
  // done from a player's card, by the button's own words.
  it('tell a reporter where the game itself puts Report', () => {
    const terms = templateOf('legal.terms.body')!;
    expect(terms).toContain(t('report.title'));
    expect(terms).not.toContain('War room');
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

// Session 79: a find found, a deed done, a day in the tray said "9 Nov 2026" all year.
describe('a day', () => {
  it('is said without its year when it is this one', () => {
    const noon = new Date(2026, 10, 10, 12).getTime();
    expect(fmt.day(new Date(2026, 10, 10, 9).getTime(), noon)).toBe('10 Nov');
    expect(fmt.day(new Date(2026, 0, 2, 9).getTime(), noon)).toBe('2 Jan');
    expect(fmt.day(new Date(2025, 10, 9, 20).getTime(), noon)).toBe('9 Nov 2025');
  });
});
