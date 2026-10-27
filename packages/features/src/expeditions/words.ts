// A twist's or a road's words, made from its numbers: "Hits land 80% as often; finds twice as likely".
import { fmt, t } from '@idle-clash/content';
import type { Twist } from '../shared/expeditions/data.ts';

const KEYS = ['hit', 'heal', 'foeHit', 'stages', 'finds', 'drops', 'caches', 'marks', 'bossHp', 'camp', 'xp'] as const;

/** A multiplier as a change: ×1.5 is "50% more", ×0.75 "25% less", ×2 "twice". */
function change(x: number): { kind: 'more' | 'less' | 'twice'; pct: string } {
  if (x === 2) return { kind: 'twice', pct: '' };
  const pct = fmt.pct(Math.round(Math.abs(x - 1) * 100));
  return { kind: x > 1 ? 'more' : 'less', pct };
}

export function twistText(tw: Twist): string {
  const parts = KEYS.flatMap((k) => {
    const x = tw[k];
    if (x === undefined || x === 1) return [];
    const c = change(x);
    return [c.kind === 'twice' ? t(`twistPart.${k}.twice`) : t(`twistPart.${k}.${c.kind}`, { pct: c.pct })];
  });
  const text = parts.join('; ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
