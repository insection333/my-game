// Food never heals past full health (session 160). A fighter eats below half health, and late food heals
// more than half of it: at Hitpoints 99 a sturgeon stew, raised by Hitpoints' perks, the hearthstone and
// the Smokehouse, healed a fighter of 4,220 health to over 6,000, and the arena showed "6,121 / 4,220" until
// the next swing; the extra soaked a foe's hit no health bar showed.
import { perksAt } from '../src/shared/skill.ts';
import { describe, expect, it } from 'vitest';
import { LADDERS } from '../src/shared/combat/data.ts';
import { FOES } from '../src/shared/combat/foes.ts';
import { fight, maxHealth, type Fighter, type Swing } from '../src/shared/combat/fight.ts';

const hpPerks = perksAt(LADDERS.hitpoints, 99);
hpPerks.foodHeal += 40; // the hearthstone and the Smokehouse, fully raised
const fighter: Fighter = {
  style: 'melee',
  styleLevel: 60,
  weaponTier: 5,
  armour: 0,
  hpLevel: 99,
  perks: perksAt(LADDERS.melee, 60),
  hpPerks,
  mastery: 0,
};

describe('a meal eaten in a fight', () => {
  it('heals up to full health and no further', () => {
    const most = maxHealth(fighter);
    const foe = [...FOES].sort((a, b) => b.maxHit - a.maxHit)[0];
    let r = 7;
    const rng = () => (r = (r * 16807) % 2147483647) / 2147483647;
    const swings: Swing[] = [];
    let ate = 0;
    for (let i = 0; i < 40; i++) {
      const f = fight(fighter, foe, rng, most, [{ item: 'sturgeon-stew', heals: 2290, count: 50 }], {}, (s) =>
        swings.push(s),
      );
      ate += f.eaten['sturgeon-stew'] ?? 0;
      expect(f.health).toBeLessThanOrEqual(most);
    }
    expect(ate).toBeGreaterThan(0);
    const over = swings.filter((s) => s.health > most + 1e-9);
    expect(over.map((s) => `${s.by} ${Math.round(s.health)} / ${most}`)).toEqual([]);
  });
});
