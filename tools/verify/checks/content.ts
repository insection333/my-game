// The content check: schemas (checked as features load), references, every effect kind handled and
// formatted, no empty levels, every word in the strings file and none left unused, no avoided terms.
import {
  RARITIES,
  allStringKeys,
  avoidedTerms,
  EFFECT_KINDS,
  EFFECTS,
  emptyLevels,
  formatEffect,
  formatStop,
  placeholders,
  t,
  templateOf,
  trackStrings,
  type Effect,
} from '@idle-clash/content';
import { effectsIn, skill, type Feature, type SlotContext } from '@idle-clash/features';
import { KERNEL_STOP_CODES, LANE_IDS } from '@idle-clash/kernel';

export interface ContentInput {
  features: readonly Feature[];
  states: SlotContext[];
  /** String keys that appear literally in source code, so are used even if no check reached them. */
  literalKeys: Set<string>;
}

const sampleEffect = (kind: Effect['kind']): Effect => (kind === 'maxHealth' ? { kind, amount: 40 } : { kind, pct: 5 });

export function checkContent({ features, states, literalKeys }: ContentInput): { problems: string[]; strings: number } {
  const problems: string[] = [];
  const attempt = (what: string, fn: () => unknown) => {
    try {
      fn();
    } catch (err) {
      problems.push(`${what}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  const tracker = trackStrings();

  for (const kind of EFFECT_KINDS) {
    const def = EFFECTS[kind];
    if (typeof def?.apply !== 'function') problems.push(`Effect "${kind}" has no handler`);
    if (typeof def?.format !== 'function') problems.push(`Effect "${kind}" has no formatter`);
    else attempt(`Effect "${kind}" formatter`, () => formatEffect(sampleEffect(kind)));
  }
  for (const lane of LANE_IDS) attempt(`Lane "${lane}"`, () => t(`lane.${lane}`));

  const items = new Map<string, string>();
  for (const f of features) {
    const where = `Feature "${f.id}"`;
    for (const item of f.content.items ?? []) {
      if (items.has(item.id)) problems.push(`${where}: item "${item.id}" is also defined by "${items.get(item.id)}"`);
      items.set(item.id, f.id);
      attempt(`${where}: item "${item.id}"`, () => t(`item.${item.id}`));
    }
  }
  const stops = new Set<string>([...KERNEL_STOP_CODES, ...features.flatMap((f) => f.stops ?? [])]);
  for (const code of stops) {
    const detail = Object.fromEntries(
      placeholders(templateOf(`stop.${code}`) ?? '').map((p) => [p, p === 'item' ? [...items.keys()][0] : 1]),
    );
    attempt(`Stop "${code}"`, () => formatStop({ code, detail }));
    attempt(`Stop "${code}", short`, () => formatStop({ code, detail }, 'short'));
  }

  for (const f of features) {
    const where = `Feature "${f.id}"`;
    attempt(`${where} help`, () => [t(f.help.title), t(f.help.body)]);
    const actions = f.content.actions ?? [];
    for (const a of actions) {
      attempt(`${where}: action "${a.id}"`, () => t(`action.${f.id}.${a.id}`));
      for (const g of a.gives ?? []) {
        if (!items.has(g.item)) problems.push(`${where}: action "${a.id}" gives "${g.item}", which no feature defines`);
      }
      for (const g of a.takes ?? []) {
        if (!items.has(g.item)) problems.push(`${where}: action "${a.id}" takes "${g.item}", which no feature defines`);
      }
    }
    const used = new Set(effectsIn(f).map((e) => e.kind));
    for (const k of used)
      if (!f.effects.includes(k)) problems.push(`${where} uses effect "${k}" but does not declare it`);
    for (const k of f.effects) if (!used.has(k)) problems.push(`${where} declares effect "${k}" but never uses it`);
    const sk = f.content.skill;
    if (sk) {
      attempt(`${where}: skill name`, () => t(`skill.${sk.id}`));
      const finds = f.content.finds ?? [];
      // A skill with something to do (actions, or fights for a style) has six finds; Hitpoints has none.
      const findsSix = finds.length > 0 || actions.length > 0;
      for (const rarity of findsSix ? RARITIES : []) {
        const pair = finds.filter((x) => x.rarity === rarity);
        if (pair.length !== 2 || pair[0].greater || !pair[1].greater)
          problems.push(`${where}: needs a lesser then a greater ${rarity} find (it has ${pair.length})`);
        attempt(`Rarity "${rarity}"`, () => t(`rarity.${rarity}`));
      }
      for (const x of finds) {
        const item = (f.content.items ?? []).find((i) => i.id === x.item);
        if (item?.kind !== 'find') problems.push(`${where}: find "${x.item}" is not one of its items of kind "find"`);
      }
      const empty = emptyLevels(sk.ladder);
      if (empty.length) problems.push(`${where}: levels with nothing to unlock: ${empty.join(', ')}`);
      sk.ladder.forEach((unlocks, i) => {
        for (const u of unlocks) {
          if (u.type === 'action') {
            const a = actions.find((x) => x.id === u.action);
            if (!a) problems.push(`${where}: level ${i + 1} unlocks "${u.action}", which is not one of its actions`);
            else if (a.level !== i + 1)
              problems.push(`${where}: "${u.action}" opens at ${a.level} but the ladder says ${i + 1}`);
          }
          attempt(`${where}: level ${i + 1}`, () => skill.unlockText(f.id, sk.ladder, u));
        }
      });
      for (const a of actions) {
        if (!sk.ladder[a.level - 1]?.some((u) => u.type === 'action' && u.action === a.id)) {
          problems.push(`${where}: action "${a.id}" is missing from the ladder at level ${a.level}`);
        }
      }
    }
    for (const [slot, fill] of Object.entries(f.slots))
      for (const ctx of states) attempt(`${where}: slot "${slot}"`, () => fill(ctx));
  }

  const used = tracker.stop();
  const keys = allStringKeys();
  const unused = keys.filter((k) => !used.has(k) && !literalKeys.has(k));
  if (unused.length) problems.push(`Strings nothing uses (remove them, or use them): ${unused.join(', ')}`);
  for (const k of keys) {
    const found = avoidedTerms(templateOf(k) ?? '');
    if (found.length) problems.push(`String "${k}" uses ${found.join(', ')}: see GLOSSARY.md for the word to use`);
  }
  return { problems: [...new Set(problems)], strings: keys.length };
}
