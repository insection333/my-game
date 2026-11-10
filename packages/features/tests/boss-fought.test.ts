// A boss fought in the lane (session 72): a day's win paid gold, the boss's trophy and marks and said
// nothing at all (no moment, no notice, no line on coming back); only "Beaten 24 times" changed. The fight
// now ends in a `bossFought` event, worded once for the moment, the tray and the recap.
import { fmt } from '@idle-clash/content';
import { HOUR, seeded, type GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { bossFoughtWords, recap } from '../src/index.ts';
import { BOSSES } from '../src/shared/expeditions/data.ts';
import { expeditionsOf } from '../src/shared/expeditions/state.ts';
import { engine, fighterAt, T0 } from './helpers/expedition.ts';

const troll = BOSSES.find((b) => b.id === 'troll-chief')!;
const start = { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: 'troll-chief' } } as const;

describe('a boss fought in the lane', () => {
  it('says how it ended, and what a win paid', () => {
    const s = engine.command(fighterAt('march', 7), T0, start, seeded(7)).state;
    const out = engine.advance({ ...s, lastSeen: T0 + HOUR }, T0 + HOUR, seeded(7));
    const fought = out.events.filter((e) => e.type === 'bossFought');
    expect(fought).toHaveLength(1);
    expect(fought[0]).toMatchObject({
      boss: 'troll-chief',
      won: true,
      gold: troll.gold,
      drop: troll.drop,
      marks: expeditionsOf(out.state).marks,
      first: true,
    });
  });

  it('is worded for the moment, the tray and the recap alike', () => {
    const won: GameEvent = {
      type: 'bossFought',
      at: 1,
      boss: 'troll-chief',
      won: true,
      gold: 1200,
      drop: troll.drop,
      marks: 12,
      first: false,
    };
    const w = bossFoughtWords(won);
    expect(w.title).toBe('The Troll-chief of the hill beaten');
    expect(w.body).toBe(`+${fmt.short(1200)} gold, ${w.body!.split(', ')[1]}, +12 marks`);
    expect(w.size).toBe('banner');
    expect(bossFoughtWords({ ...won, first: true }).title).toBe(
      'The Troll-chief of the hill beaten for the first time',
    );
    expect(bossFoughtWords({ ...won, first: true }).size).toBe('centre');
    expect(bossFoughtWords({ ...won, won: false, gold: 0, drop: null, marks: 0 })).toMatchObject({
      title: 'The Troll-chief of the hill held: you retreated',
      body: null,
      size: 'toast',
    });
    expect(recap.noticeLine(won)).toMatchObject({
      kind: 'expedition',
      text: `${w.title}. ${w.body}`,
      icon: 'troll-chief',
      href: '/combat/expeditions',
    });
    const away = { from: 0, to: 10, xp: {}, items: {}, uncommon: 0, events: [won] } as never;
    expect(recap.recapLines(away).map((l) => l.text)).toContain(`${w.title}. ${w.body}`);
  });
});
