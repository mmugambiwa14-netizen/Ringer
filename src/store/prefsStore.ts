import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { setHapticsEnabled } from '../lib/haptics';
import { setSoundEnabled } from '../lib/sound';
import { setAnalyticsEnabled } from '../lib/analytics';

export type RevealStyle = 'colour' | 'plain';

interface Prefs {
  haptics: boolean;
  sound: boolean;
  /**
   * 'colour' floods the reveal card with the role colour — the best-looking
   * screen in the app, but a glance across the table gives the role away.
   * 'plain' uses a neutral card and states the role in words only.
   */
  revealStyle: RevealStyle;
  /**
   * The 18+ pack. Off by default and hidden entirely until switched on —
   * shipping it visible changes the age rating we have to declare, and a
   * party word game is obviously appealing to children whatever we declare.
   */
  adultUnlocked: boolean;
  /** Anonymous usage stats. Opt-in, off by default — see src/lib/analytics.ts. */
  analytics: boolean;
  /** Set once the first launch has happened, so app_open can report it. */
  launched: boolean;
  set: (patch: Partial<Omit<Prefs, 'set'>>) => void;
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      haptics: true,
      sound: true,
      revealStyle: 'colour',
      adultUnlocked: false,
      analytics: false,
      launched: false,
      set: (patch) => {
        if (patch.haptics !== undefined) setHapticsEnabled(patch.haptics);
        if (patch.sound !== undefined) setSoundEnabled(patch.sound);
        if (patch.analytics !== undefined) setAnalyticsEnabled(patch.analytics);
        set(patch);
      },
    }),
    {
      name: 'ringer.prefs.v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        setHapticsEnabled(state.haptics);
        setSoundEnabled(state.sound);
        setAnalyticsEnabled(state.analytics);
      },
    },
  ),
);
