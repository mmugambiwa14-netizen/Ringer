import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { playablePacks } from '../data/packs';
import { usePrefs } from './prefsStore';
import { useEntitlement } from './entitlementStore';
import { initialState, reducer } from '../engine/reducer';
import type { Action, GameState } from '../engine/types';

/**
 * Thin shell over the pure reducer. All rules live in src/engine; this file
 * only owns persistence and the seed. Keeping it this thin is what lets the
 * whole rule set be tested without React.
 */

interface Store {
  game: GameState;
  /**
   * False until AsyncStorage has been read back. Rendering before that shows
   * an empty game for a frame and, worse, lets a screen redirect away from a
   * round that was about to be restored.
   */
  hydrated: boolean;
  dispatch: (action: Action) => void;
  reset: () => void;
  /** True when a round was in flight — offer to resume on cold start. */
  hasRoundInFlight: () => boolean;
}

function freshSeed(): number {
  // The seed is the one place a real random number enters the system.
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

export const useGame = create<Store>()(
  persist(
    (set, get) => ({
      game: initialState(freshSeed()),
      hydrated: false,
      // Only the packs this device may actually deal from — both gates, applied
      // where the words are chosen rather than where they are listed. A
      // selection made while a pack was available has to stop working the
      // moment it isn't, and the picker is not where that gets noticed: before
      // this, locking the 18+ pack again left 'spicy' in config.packs and the
      // deal kept serving it, with no way left to deselect it.
      dispatch: (action) =>
        set({
          game: reducer(
            get().game,
            action,
            playablePacks({
              adultUnlocked: usePrefs.getState().adultUnlocked,
              purchased: useEntitlement.getState().unlocked,
            }),
          ),
        }),
      reset: () => set({ game: initialState(freshSeed(), get().game.config) }),
      hasRoundInFlight: () => {
        const { phase, round } = get().game;
        return round !== null && phase !== 'setup' && phase !== 'gameOver';
      },
    }),
    {
      name: 'ringer.game.v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist on every transition. Party games get interrupted — someone
      // gets a call mid-round — and the app has to come back exactly where
      // it was or the round is dead.
      partialize: (s) => ({ game: s.game }),
      onRehydrateStorage: () => (state) => {
        useGame.setState({ hydrated: true });
        void state;
      },
    },
  ),
);

/** Convenience selectors so screens don't reach into the whole store. */
export const useGameState = () => useGame((s) => s.game);
export const useDispatch = () => useGame((s) => s.dispatch);
