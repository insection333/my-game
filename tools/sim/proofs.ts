// Session 8's must-prove, on the real engine. For every foe, each style at the foe's intended level
// (one below it, Hitpoints at the level that opens it, the gear and food those levels allow):
// - the triangle holds: the style it favours earns the most XP and eats the least, the style it
//   punishes the least XP and the most food;
// - Your odds says what the fights themselves show (the same verdict from engine-run fights), and
//   with no food carried, both say Too strong.
import { STYLES, XP_TABLE, type Style } from '@idle-clash/content';
import { combatData, FEATURES, yourOdds } from '@idle-clash/features';
import { newState } from '@idle-clash/kernel';
import { equip, measured } from './combat.ts';
import { T0 } from './player.ts';

type Check = (ok: boolean, what: string) => void;

/** Your odds for a fighter at these levels, as the Combat page shows it. */
function oddsAt(style: Style, styleLevel: number, hpLevel: number, foe: string, food: boolean) {
  const skills = { [style]: { xp: XP_TABLE[styleLevel] }, [combatData.HITPOINTS]: { xp: XP_TABLE[hpLevel] } };
  const s = equip({ ...newState(7, T0), skills }, style);
  const items = food
    ? s.items
    : Object.fromEntries(Object.entries(s.items).filter(([i]) => !combatData.FOODS.some((f) => f.id === i)));
  return yourOdds({ ...s, items }, foe)!;
}

const NEAR: Record<number, string[]> = { 4: ['easy', 'fair'], 25: ['fair', 'costly'] };
const NAMES: Record<string, string> = { tooStrong: 'Too strong', easy: 'Easy', fair: 'Fair', costly: 'Costly' };

export function combatProofs(check: Check, lines: string[]) {
  if (!FEATURES.some((f) => f.id === 'combat' && f.flag.on)) return;
  lines.push("\n## The triangle and Your odds: engine-run fights at each foe's intended level");
  lines.push('| Foe | Style | Matchup | XP an hour | Food an hour | Your odds | The fights say |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const foe of combatData.FOES) {
    const level = Math.max(1, foe.level - 1);
    const rows = STYLES.map((style) => {
      const fought = measured(style, level, foe.hitpoints, foe.id, true);
      const odds = oddsAt(style, level, foe.hitpoints, foe.id, true);
      const mu = combatData.matchup(style, foe.style);
      lines.push(
        `| ${foe.id} | ${style} | ${mu} | ${Math.round(fought.xpPerHour)} | ${fought.foodPerHour.toFixed(1)} | ${NAMES[odds.verdict]} | ${NAMES[fought.verdict]} |`,
      );
      // Fights near a line between two verdicts may land either side of it: Your odds plays 1,000 of
      // them, the engine some thousands. A neighbouring verdict counts only within 10% of that line.
      const line = [4, 25].find((l) => Math.abs(fought.foodPerHour / l - 1) <= 0.1);
      const near = line !== undefined && [odds.verdict, fought.verdict].every((v) => NEAR[line].includes(v));
      check(
        odds.verdict === fought.verdict || near,
        `${foe.id}, ${style}: Your odds says ${NAMES[odds.verdict]}; the fights say ${NAMES[fought.verdict]}${odds.verdict === fought.verdict ? '' : ` (${fought.foodPerHour.toFixed(1)} food an hour${near ? `, on the line at ${line}` : ''})`}`,
      );
      return { mu, fought };
    });
    const by = (mu: string) => rows.find((r) => r.mu === mu)!.fought;
    const [adv, even, dis] = [by('advantage'), by('even'), by('disadvantage')];
    check(
      adv.xpPerHour > even.xpPerHour && even.xpPerHour > dis.xpPerHour,
      `${foe.id}: XP an hour follows the triangle (${Math.round(adv.xpPerHour)} > ${Math.round(even.xpPerHour)} > ${Math.round(dis.xpPerHour)})`,
    );
    check(
      adv.foodPerHour < even.foodPerHour && even.foodPerHour < dis.foodPerHour,
      `${foe.id}: food an hour follows the triangle (${adv.foodPerHour.toFixed(1)} < ${even.foodPerHour.toFixed(1)} < ${dis.foodPerHour.toFixed(1)})`,
    );
    // The punished style with no food at all: the page warns, and the fights end in retreats.
    const style = STYLES.find((s) => combatData.matchup(s, foe.style) === 'disadvantage')!;
    const bare = measured(style, level, foe.hitpoints, foe.id, false, 2);
    const warned = oddsAt(style, level, foe.hitpoints, foe.id, false);
    check(
      warned.verdict === 'tooStrong' && bare.verdict === 'tooStrong',
      `${foe.id}, ${style} with no food: Your odds says ${NAMES[warned.verdict]}; the fights say ${NAMES[bare.verdict]} (${Math.round(bare.retreatRate * 100)}% retreats)`,
    );
  }
}
