import { useSyncExternalStore } from 'react';
import { game, type GameView } from './store.ts';

export const useGame = (): GameView => useSyncExternalStore(game.subscribe, game.get);
