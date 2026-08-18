/**
 * Analytics.
 *
 * A pass-and-play game has no server, so without client instrumentation there
 * is literally no information about why people stop playing. The single number
 * that matters is rounds-per-session: if groups play one round and stop, the
 * words are wrong, and no amount of marketing fixes that.
 *
 * Three hard constraints, and they are compliance decisions rather than
 * preferences. A party word game is obviously appealing to children whatever
 * age rating we declare, and under COPPA "directed to children" is judged on
 * the app's character, not the questionnaire:
 *
 *   1. No device identifiers, no ad SDKs, no cross-app anything.
 *   2. Opt-in, off by default, and the app is fully functional with it off.
 *   3. Nothing free-text. Never a player name, never a word they saw.
 *
 * The transport is deliberately pluggable and defaults to a no-op. Wire
 * Aptabase or TelemetryDeck in `setAnalyticsSink` at launch — never Firebase,
 * which collects exactly the identifiers this file exists to avoid.
 */

export type AnalyticsEvent =
  | { name: 'app_open'; is_first_open: boolean }
  | { name: 'setup_started' }
  | {
      name: 'round_started';
      player_count: number;
      mode: string;
      pack_count: number;
      laps: number;
      vote_style: string;
      turn_timer: number;
    }
  | {
      name: 'round_completed';
      duration_s: number;
      outcome: string;
      imposter_caught: boolean;
      guess_used: boolean;
      guess_correct: boolean;
      player_count: number;
    }
  | { name: 'round_abandoned'; phase: string; player_count: number }
  | { name: 'session_completed'; rounds_played: number; player_count: number }
  | { name: 'pack_viewed'; pack_id: string }
  | { name: 'settings_changed'; key: string; value: string }
  | { name: 'share_opened'; rounds_played: number }
  | { name: 'share_completed'; rounds_played: number };

export type AnalyticsSink = (name: string, props: Record<string, string | number | boolean>) => void;

let sink: AnalyticsSink | null = null;
let enabled = false;

/** Called once at launch with the real transport. No-op until then. */
export function setAnalyticsSink(next: AnalyticsSink | null) {
  sink = next;
}

export function setAnalyticsEnabled(value: boolean) {
  enabled = value;
}

export function track(event: AnalyticsEvent) {
  if (!enabled || !sink) return;
  const { name, ...props } = event;
  try {
    sink(name, props as Record<string, string | number | boolean>);
  } catch {
    /* telemetry must never be able to break a game */
  }
}

/**
 * Rounds-per-session is the product-market-fit number, and it can only be
 * measured at the moment a session ends — so the app has to notice that
 * moment rather than waiting for the user to press something.
 */
export function trackSessionEnd(roundsPlayed: number, playerCount: number) {
  if (roundsPlayed <= 0) return;
  track({ name: 'session_completed', rounds_played: roundsPlayed, player_count: playerCount });
}
