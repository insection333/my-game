// What the live channel brings that only the server makes, said as moments (session 261): Castle Clash's battles
// (a siege, a caught spy), and the server's own news, a climb on the ladders, the realm's boss fallen, a stage of
// the realm's work, a friend's cheer or gift, which reached the tray alone. The rest of what the channel says the
// page has already played itself.
import { castleEngine } from '@idle-clash/features';
import type { GameEvent } from '@idle-clash/kernel';

const NEWS: ReadonlySet<GameEvent['type']> = new Set(['rankUp', 'realmFell', 'realmWorkStage', 'cheered', 'giftCame']);

export const toldOf = (events: readonly GameEvent[]): GameEvent[] =>
  events.filter((e) => castleEngine.isCastleEvent(e) || NEWS.has(e.type));
