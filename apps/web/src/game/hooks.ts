import { useSyncExternalStore } from 'react';
import { game, type GameView, type Session } from './store.ts';

/** The game while playing; pages inside the shell only render then. */
export const useGame = (): GameView => useSyncExternalStore(game.subscribe, game.get);
export const useSession = (): Session => useSyncExternalStore(game.subscribe, game.session);
