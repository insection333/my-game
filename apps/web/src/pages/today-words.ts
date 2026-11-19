// What the Hearth's Today says on a day with nothing in it yet: a newcomer's welcome, pointing to a first
// step; for a player who has played, only that the day's moments will show there (session 156: a player
// three weeks in, back after midnight, read "Start with a first step").
import { t } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';

export function quietDay(state: State): { title: string; body: string } {
  const played = Object.values(state.skills).some((x) => x.xp > 0);
  return played
    ? { title: t('hearth.quiet.title'), body: t('hearth.quiet.body') }
    : { title: t('hearth.welcome.title'), body: t('hearth.welcome.body') };
}
