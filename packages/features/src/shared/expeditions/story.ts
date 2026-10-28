// A run's story as the moment, the away recap and the notices tray tell it, from its event: where it
// went and how it ended, then the road taken, the boss, the finds (each once; the first three named)
// and the marks it brought.
// "Home from the Sunken Fen: the Drowned Warden beaten" — "Took the high pass, beat the Drowned
// Warden, found a sunken locket. 18 marks."
import { fmt, midSentence, t } from '@idle-clash/content';
import type { EventOf } from '@idle-clash/kernel';

const TOLD = 3;
const list = new Intl.ListFormat('en-GB', { style: 'long', type: 'conjunction' });

/** "found a sunken locket", "found a pearl, an eel-skin and a lure, and 4 more finds". */
function found(finds: readonly string[]): string[] {
  if (!finds.length) return [];
  const named = finds.slice(0, TOLD).map((item) => midSentence(t(`item.${item}`)));
  const more = finds.length - named.length;
  const rest =
    more === 0 ? [] : [more === 1 ? t('story.foundMoreOne') : t('story.foundMore', { count: fmt.int(more) })];
  return [t('story.found', { items: list.format(named) }), ...rest];
}

export function storyOf(e: EventOf<'expeditionDone'>): { title: string; body: string } {
  const region = midSentence(t(`combat.region.${e.region}`));
  const boss = midSentence(t(`boss.${e.boss}`));
  const title =
    e.outcome === 'won'
      ? t('story.won', { region, boss })
      : e.outcome === 'lost'
        ? t('story.lost', { region, boss })
        : t('story.retreated', { region, stage: fmt.int(e.cleared + 1), stages: fmt.int(e.stages) });
  const parts = [
    t('story.road', { road: midSentence(t(`twist.${e.road}`)) }),
    ...(e.outcome === 'won' ? [t('story.beat', { boss })] : []),
    ...found(e.finds),
  ];
  const marks = e.marks === 1 ? t('story.markOne') : t('story.marks', { marks: fmt.int(e.marks) });
  const told = parts.join(', ');
  return { title, body: `${told.charAt(0).toUpperCase()}${told.slice(1)}. ${marks}` };
}
