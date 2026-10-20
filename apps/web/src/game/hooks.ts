import { useSyncExternalStore } from 'react';
import { game, type GameView } from './store.ts';

/** The game while playing; pages inside the shell only render then. */
export const useGame = (): GameView => useSyncExternalStore(game.subscribe, game.get);
