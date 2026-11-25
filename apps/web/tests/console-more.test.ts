// The console's closer look (session 234): a file a spreadsheet opens as written and never runs as a formula;
// the Activity tab's calendar of twelve weeks; the keys (? for the list, G then a letter for a section); and
// the players an admin opened lately, kept for that admin.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { keepFor } from '../src/kept.ts';
import { cellOf, csvOf } from '../src/console/csv.ts';
import { keyOf } from '../src/console/keys.ts';
import { forget, opened, recentPlayers, RECENT } from '../src/console/recent.ts';
import { calendarOf } from '../src/console/RecordActivity.tsx';

const key = (k: string, tagName = 'BODY', more: Partial<KeyboardEvent> = {}) =>
  ({
    key: k,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    target: { tagName, isContentEditable: false },
    ...more,
  }) as Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target'>;

describe('a CSV file', () => {
  it('quotes what must be quoted and writes a would-be formula as text', () => {
    expect(cellOf('Rowan')).toBe('Rowan');
    expect(cellOf('Oak, the elder')).toBe('"Oak, the elder"');
    expect(cellOf('Said "hello"')).toBe('"Said ""hello"""');
    expect(cellOf('Two\nlines')).toBe('"Two\nlines"');
    expect(cellOf('=HYPERLINK("http://x","y")')).toBe('"\'=HYPERLINK(""http://x"",""y"")"');
    expect(cellOf('+1')).toBe("'+1");
    expect(cellOf('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(cellOf(-5)).toBe('-5');
    expect(cellOf(null)).toBe('');
    expect(csvOf(['Name', 'Level'], [['Rowan', 12]])).toBe('﻿Name,Level\r\nRowan,12\r\n');
  });
});

describe('the calendar of days played', () => {
  it('holds twelve weeks, Monday first, this week on the right and nothing after today', () => {
    // Wednesday 25 November 2026.
    const days = calendarOf(Date.UTC(2026, 10, 25, 15));
    expect(days).toHaveLength(84);
    expect(days[0]).toBe('2026-09-07');
    expect(new Date(`${days[0]}T00:00:00Z`).getUTCDay()).toBe(1);
    expect(days[77]).toBe('2026-11-23');
    expect(days[79]).toBe('2026-11-25');
    expect(days.slice(80)).toEqual([null, null, null, null]);
  });
});

describe("the console's keys", () => {
  it('lists the keys on ?, and goes to a section on G then its letter', () => {
    expect(keyOf(key('?'), false)).toEqual({ keys: true });
    expect(keyOf(key('g'), false)).toEqual({ g: true });
    expect(keyOf(key('p'), true)).toEqual({ section: 'players' });
    expect(keyOf(key('A'), true)).toEqual({ section: 'audit' });
    expect(keyOf(key('p'), false)).toBeNull();
    expect(keyOf(key('k', 'BODY', { ctrlKey: true }), false)).toEqual({ goTo: true });
    // Never while typing in a box.
    expect(keyOf(key('?', 'INPUT'), false)).toBeNull();
    expect(keyOf(key('p', 'TEXTAREA'), true)).toBeNull();
  });
});

describe('players opened lately', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
  });
  it('are kept for each admin, newest first, once each, the last few', () => {
    keepFor('admin-1');
    for (let i = 0; i < RECENT + 2; i++) opened({ id: `p${i}`, name: `Player${i}` });
    opened({ id: 'p3', name: 'Player3' });
    expect(recentPlayers().map((p) => p.id)).toEqual(['p3', 'p7', 'p6', 'p5', 'p4', 'p2']);
    forget('p7');
    expect(recentPlayers().map((p) => p.id)).not.toContain('p7');
    keepFor('admin-2');
    expect(recentPlayers()).toEqual([]);
    store.set('console.recent:admin-2', 'not a list');
    expect(recentPlayers()).toEqual([]);
  });
});
