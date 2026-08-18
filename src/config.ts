/**
 * Public constants. The store links are placeholders until the app is
 * actually listed — replace both before the first share button ships, or the
 * growth loop points at nothing.
 */
export const APP_NAME = 'RINGER';
export const APP_VERSION = '0.1.0';

// TODO(launch): real store URLs. A single short link that redirects by
// platform is better than two — the share text is read by whoever is holding
// a phone, and you don't know which kind.
export const APP_LINK = 'https://ringergame.app';

export const SUPPORT_EMAIL = 'hello@ringergame.app';

/**
 * The one-time unlock. Must match the non-consumable product registered in
 * App Store Connect and the Play Console — the stores key off this exactly,
 * and a mismatch fails at runtime rather than at build time.
 */
export const UNLOCK_PRODUCT_ID = 'com.ringer.party.unlock_all';

/**
 * Fallback price shown before the store answers, or if it never does. The
 * store's own localised price always wins where available — this string is
 * only ever a placeholder, and it is wrong in every currency but one.
 */
export const UNLOCK_PRICE_FALLBACK = '$4.99';
