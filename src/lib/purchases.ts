/**
 * The one-time unlock.
 *
 * RINGER has no server, no accounts and no running cost per player, so the
 * content is sold once rather than rented. `Pack.isFree` marks what ships in
 * the free tier; everything else needs this entitlement.
 *
 * The store transport is injected rather than imported, for the same reason
 * the analytics sink is: this module stays pure TypeScript that `npm test` can
 * exercise without a device, a store account or a network. Wire the real one
 * at launch — see `setPurchaseTransport`.
 *
 * ON SECURITY, honestly. The cached flag below is a convenience so the app
 * works on a plane; it is not the security boundary and anyone with a rooted
 * device can flip it. The boundary is the transport: `restore()` must ask the
 * platform what this account actually owns and validate the receipt, and the
 * app re-asks on every cold start where the transport is available. For a £4
 * offline party game that is the right amount of effort — the realistic loss
 * to a determined tamperer is one sale, and chasing it would cost the
 * serverless architecture that makes the app what it is.
 */

export interface PurchaseTransport {
  /**
   * Ask the platform what this account owns, validating the receipt.
   * Must reflect the store, never a local cache.
   */
  restore(): Promise<boolean>;
  /** Run the purchase flow. Resolves true once the store confirms ownership. */
  purchase(productId: string): Promise<boolean>;
  /** Localised display price from the store listing, e.g. "£4.99". */
  priceLabel?(productId: string): Promise<string | null>;
}

let transport: PurchaseTransport | null = null;

/**
 * Install the real store transport at launch. Until this is called every
 * purchase attempt fails closed — it can never accidentally grant the unlock.
 */
export function setPurchaseTransport(next: PurchaseTransport | null) {
  transport = next;
}

export function hasPurchaseTransport(): boolean {
  return transport !== null;
}

export type PurchaseResult = 'owned' | 'declined' | 'unavailable' | 'failed';

export async function buyUnlock(productId: string): Promise<PurchaseResult> {
  if (!transport) return 'unavailable';
  try {
    return (await transport.purchase(productId)) ? 'owned' : 'declined';
  } catch {
    return 'failed';
  }
}

export async function restoreUnlock(): Promise<PurchaseResult> {
  if (!transport) return 'unavailable';
  try {
    return (await transport.restore()) ? 'owned' : 'declined';
  } catch {
    return 'failed';
  }
}

export async function storePriceLabel(productId: string): Promise<string | null> {
  if (!transport?.priceLabel) return null;
  try {
    return await transport.priceLabel(productId);
  } catch {
    return null;
  }
}
