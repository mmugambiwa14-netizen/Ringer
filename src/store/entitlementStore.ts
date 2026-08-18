import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { UNLOCK_PRODUCT_ID } from '../config';
import {
  buyUnlock,
  hasPurchaseTransport,
  restoreUnlock,
  type PurchaseResult,
} from '../lib/purchases';

/**
 * Owns whether this device has the one-time unlock.
 *
 * The persisted flag is a cache so the app works offline, not the security
 * boundary — see the note in src/lib/purchases.ts. `verify()` re-asks the
 * store on every cold start where a transport is installed, and a store that
 * answers "not owned" revokes the cache rather than being ignored. That is
 * what makes a refund or a family-sharing removal actually take effect.
 */
interface Entitlement {
  unlocked: boolean;
  /** Epoch ms of the last answer from the store itself, not from the cache. */
  verifiedAt: number | null;
  /** True while a purchase or restore is in flight, so the UI can't double-fire. */
  busy: boolean;
  verify: () => Promise<void>;
  purchase: () => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;
}

export const useEntitlement = create<Entitlement>()(
  persist(
    (set, get) => ({
      unlocked: false,
      verifiedAt: null,
      busy: false,

      /** Cold-start reconciliation. Silent: never blocks or interrupts a game. */
      verify: async () => {
        if (!hasPurchaseTransport() || get().busy) return;
        const result = await restoreUnlock();
        // 'unavailable' and 'failed' mean we did not hear from the store, so the
        // cache stands — being offline must not lock someone out of what they
        // bought. Only a clear answer moves the flag.
        if (result === 'owned') set({ unlocked: true, verifiedAt: Date.now() });
        else if (result === 'declined') set({ unlocked: false, verifiedAt: Date.now() });
      },

      purchase: async () => {
        if (get().busy) return 'failed';
        set({ busy: true });
        const result = await buyUnlock(UNLOCK_PRODUCT_ID);
        set({
          busy: false,
          ...(result === 'owned' ? { unlocked: true, verifiedAt: Date.now() } : {}),
        });
        return result;
      },

      restore: async () => {
        if (get().busy) return 'failed';
        set({ busy: true });
        const result = await restoreUnlock();
        set({
          busy: false,
          ...(result === 'owned' ? { unlocked: true, verifiedAt: Date.now() } : {}),
        });
        return result;
      },
    }),
    {
      name: 'ringer.entitlement.v1',
      storage: createJSONStorage(() => AsyncStorage),
      // `busy` is transient — persisting it would strand the UI after a crash
      // mid-purchase.
      partialize: (s) => ({ unlocked: s.unlocked, verifiedAt: s.verifiedAt }),
    },
  ),
);
