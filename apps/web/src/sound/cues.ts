// Which sound, if any, goes with what happened (the owner: sound never intrusive, nothing wearing
// for what repeats). Moments get a soft cue scaled to how rare they are; ordinary Uncommon finds,
// which come by the dozen, and refusals get none. Each action's own small sound plays only for
// players who chose "Also each action".
import { isQuietStop } from '@idle-clash/content';
import type { GameEvent } from '@idle-clash/kernel';

export type SoundChoice = 'off' | 'moments' | 'all';
export type Cue = 'legendary' | 'level' | 'rare' | 'newFind' | 'mastery' | 'goal' | 'stopped';
export type WorkCue = 'chop' | 'strike' | 'hit' | 'splash' | 'sizzle';

/** A moment's cue: the rarest thing wins when several land together. */
export function cueFor(e: GameEvent): Cue | null {
  switch (e.type) {
    case 'levelUp':
      return 'level';
    case 'kindled':
      // As rare as a Legendary find, and as gladly heard.
      return 'legendary';
    case 'find':
      return e.rarity === 'legendary' ? 'legendary' : e.rarity === 'rare' ? 'rare' : e.first ? 'newFind' : null;
    case 'masteryStep':
      return 'mastery';
    case 'goalDone':
      // A lucky cache rings like a Rare find; any other goal, its own small chime.
      return e.cache?.grade === 'lucky' ? 'rare' : 'goal';
    case 'expeditionDone':
      // A boss beaten at a run's end rings like a Rare find; any other homecoming, the goal's chime.
      return e.outcome === 'won' ? 'rare' : 'goal';
    // A boss fought alone (session 72): its first fall rings like a Rare find, a day's win the goal's chime.
    // A work raised by the player's press (session 76): the goal's chime.
    case 'workRaised':
      return 'goal';
    case 'bossFought':
      return !e.won ? null : e.first ? 'rare' : 'goal';
    case 'deedDone':
      // An elite or master deed rings like a Rare find; the rest, the goal's small chime.
      return e.tier === 'elite' || e.tier === 'master' ? 'rare' : 'goal';
    case 'rankUp':
      // First on a ladder rings like a Rare find; any other climb, the goal's small chime.
      return e.band === 1 ? 'rare' : 'goal';
    // The castle (session 64: its battles were silent). A win the goal's chime, a rout or a fortress's
    // hoard like a Rare find; a defence held the chime, one broken the stopped lane's low note.
    case 'castleSiege':
      return e.outcome === 'repelled' ? null : e.rout ? 'rare' : 'goal';
    case 'castleIncursion':
      return !e.won ? null : e.spoils ? 'rare' : 'goal';
    case 'castleBesieged':
      return e.outcome === 'repelled' ? 'goal' : 'stopped';
    case 'castleSpyCaught':
      return 'goal';
    // Your own spy (session 69): done unseen the chime; caught, silent, as a siege repelled.
    case 'castleSpied':
      return e.success ? 'goal' : null;
    case 'castleTempered':
      return e.masterstroke ? 'rare' : 'goal';
    case 'castleOrders':
      return e.all ? 'rare' : 'goal';
    case 'laneStopped':
      return isQuietStop(e.reason.code) ? null : 'stopped';
    default:
      return null;
  }
}

const ORDER: Cue[] = ['legendary', 'level', 'rare', 'newFind', 'mastery', 'goal', 'stopped'];

/** One cue for a batch of events: the best of them. */
export function bestCue(events: readonly GameEvent[]): Cue | null {
  const cues = events.map(cueFor).filter((c): c is Cue => c !== null);
  return cues.length ? cues.reduce((a, b) => (ORDER.indexOf(a) <= ORDER.indexOf(b) ? a : b)) : null;
}

/** The small sound of a lane's work, by the skill that earned the XP. */
export function workCue(skill: string): WorkCue {
  if (skill === 'woodcutting' || skill === 'fletching') return 'chop';
  if (skill === 'mining' || skill === 'smithing' || skill === 'runecraft') return 'strike';
  if (skill === 'fishing') return 'splash';
  if (skill === 'cooking') return 'sizzle';
  return 'hit';
}

export function readSound(): SoundChoice {
  try {
    const v = localStorage.getItem('sound');
    return v === 'moments' || v === 'all' ? v : 'off';
  } catch {
    return 'off';
  }
}
