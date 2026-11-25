// The console's keys (session 234): Ctrl K (⌘ K) or / opens Go to (session 233), ? the list of keys, and G
// then a section's letter goes straight to it (G then P: Players), as a mail or code reviewing tool does.
// None is heard while words are typed in a box.
import type { SectionId } from './Console.tsx';
import { opensGoTo } from './GoTo.tsx';

/** Each section's letter after G. */
export const SECTION_KEYS: Record<SectionId, string> = {
  overview: 'o',
  live: 'l',
  players: 'p',
  moderation: 'm',
  mail: 'i',
  test: 't',
  audit: 'a',
  system: 's',
};
/** How long after G its letter is listened for. */
export const G_MS = 1_500;

type Key = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target'>;

const typing = (el: EventTarget | null) => {
  const e = el as HTMLElement | null;
  return !!e && (e.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName));
};

/** What a key press does, given whether G was pressed a moment before. */
export function keyOf(
  e: Key,
  afterG: boolean,
): { goTo: true } | { keys: true } | { g: true } | { section: SectionId } | null {
  if (opensGoTo(e)) return { goTo: true };
  if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return null;
  if (e.key === '?') return { keys: true };
  const key = e.key.toLowerCase();
  if (afterG) {
    const id = (Object.keys(SECTION_KEYS) as SectionId[]).find((x) => SECTION_KEYS[x] === key);
    if (id) return { section: id };
  }
  return key === 'g' ? { g: true } : null;
}
