// The four combat skills as features: their ladders and finds come from shared/combat/data.ts, and
// they are trained by fighting (combat's foes), so they have no actions of their own.
import type { EffectKind, Item } from '@idle-clash/content';
import type { Feature } from '../../define.ts';
import { skillSlots } from '../skill-slots.ts';
import { FIND_VALUES, HITPOINTS, LADDERS, STYLE_FINDS } from './data.ts';

export function combatSkill(id: 'melee' | 'archery' | 'magic' | typeof HITPOINTS): Feature {
  const finds = id === HITPOINTS ? [] : STYLE_FINDS[id];
  const items: Item[] = finds.map((f, i) => ({ id: f.item, kind: 'find', value: FIND_VALUES[i] }));
  const effects: EffectKind[] =
    id === HITPOINTS ? ['maxHealth', 'regen', 'foodHeal', 'retreatAt'] : ['damage', 'accuracy', 'guard', 'spoils'];
  return {
    id,
    flag: { on: true, note: 'Playable since session 8, trained on the Combat page' },
    content: { items, actions: [], skill: { id, ladder: LADDERS[id] }, finds },
    effects,
    stops: [],
    rules: {},
    routes: {},
    slots: skillSlots({ feature: id, skill: id, ladder: LADDERS[id], finds, actions: [] }),
    help: { title: `help.${id}.title`, body: `help.${id}.body` },
  };
}
