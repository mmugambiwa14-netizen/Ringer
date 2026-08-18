import { describe, it } from 'node:test';
import { expect } from '../../engine/__tests__/expect';
import {
  buyUnlock,
  hasPurchaseTransport,
  restoreUnlock,
  setPurchaseTransport,
  storePriceLabel,
  type PurchaseTransport,
} from '../purchases';

const PRODUCT = 'com.example.unlock';

const transport = (over: Partial<PurchaseTransport>): PurchaseTransport => ({
  restore: async () => false,
  purchase: async () => false,
  ...over,
});

describe('the one-time unlock', () => {
  it('grants nothing at all until a transport is installed', async () => {
    // The single most important property here: with no way to reach the store,
    // every path must refuse rather than assume. A bug that fails open gives
    // the app away.
    setPurchaseTransport(null);
    expect(hasPurchaseTransport()).toBe(false);
    expect(await buyUnlock(PRODUCT)).toBe('unavailable');
    expect(await restoreUnlock()).toBe('unavailable');
    expect(await storePriceLabel(PRODUCT)).toBeNull();
  });

  it('grants the unlock only when the store confirms ownership', async () => {
    setPurchaseTransport(transport({ purchase: async () => true }));
    expect(await buyUnlock(PRODUCT)).toBe('owned');

    setPurchaseTransport(transport({ purchase: async () => false }));
    expect(await buyUnlock(PRODUCT)).toBe('declined');
  });

  it('treats a throwing store as a failure, never as a sale', async () => {
    setPurchaseTransport(
      transport({
        purchase: async () => {
          throw new Error('StoreKit exploded');
        },
        restore: async () => {
          throw new Error('network');
        },
      }),
    );
    expect(await buyUnlock(PRODUCT)).toBe('failed');
    expect(await restoreUnlock()).toBe('failed');
  });

  it('restores from what the store says is owned, not from anything local', async () => {
    setPurchaseTransport(transport({ restore: async () => true }));
    expect(await restoreUnlock()).toBe('owned');
    setPurchaseTransport(transport({ restore: async () => false }));
    expect(await restoreUnlock()).toBe('declined');
  });

  it('falls back to the bundled price when the store will not quote one', async () => {
    setPurchaseTransport(transport({}));
    expect(await storePriceLabel(PRODUCT)).toBeNull();

    setPurchaseTransport(transport({ priceLabel: async () => '£4.99' }));
    expect(await storePriceLabel(PRODUCT)).toBe('£4.99');

    setPurchaseTransport(
      transport({
        priceLabel: async () => {
          throw new Error('no listing');
        },
      }),
    );
    expect(await storePriceLabel(PRODUCT)).toBeNull();
    setPurchaseTransport(null);
  });
});
