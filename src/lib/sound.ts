import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * Sound effects. Synthesised rather than licensed — see tools/make-sfx.py —
 * so there is no attribution to track and the palette is re-tunable by
 * editing numbers.
 *
 * Players are created once and rewound on replay. Creating one per play leaks
 * native resources fast in a game where the turn tick fires every few seconds.
 */

export type Sfx = 'tap' | 'turn' | 'deal' | 'reveal' | 'stamp' | 'win' | 'lose' | 'tick';

// require() rather than import so Metro bundles the asset.
const SOURCES: Record<Sfx, number> = {
  tap: require('../../assets/sfx/tap.wav'),
  turn: require('../../assets/sfx/turn.wav'),
  deal: require('../../assets/sfx/deal.wav'),
  reveal: require('../../assets/sfx/reveal.wav'),
  stamp: require('../../assets/sfx/stamp.wav'),
  win: require('../../assets/sfx/win.wav'),
  lose: require('../../assets/sfx/lose.wav'),
  tick: require('../../assets/sfx/tick.wav'),
};

/** Per-sound trim so nothing jumps out of the mix. */
const GAIN: Partial<Record<Sfx, number>> = {
  tap: 0.35,
  turn: 0.7,
  tick: 0.5,
  reveal: 0.6,
};

const players = new Map<Sfx, AudioPlayer>();
let enabled = true;
let configured = false;

function configure() {
  if (configured) return;
  configured = true;
  void setAudioModeAsync({
    // Respect the hardware silent switch. Someone has muted their phone for a
    // reason, and a party game that ignores that gets deleted.
    playsInSilentMode: false,
    shouldPlayInBackground: false,
    // Never interrupt whatever music the room is already playing.
    interruptionMode: 'mixWithOthers',
    interruptionModeAndroid: 'duckOthers',
  }).catch(() => {
    /* audio config is decoration; never let it throw into a game */
  });
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
  if (!value) {
    for (const p of players.values()) {
      try {
        p.pause();
      } catch {
        /* ignore */
      }
    }
  }
}

/** Warm the players we hit first, so the opening tap isn't silent. */
export function preloadSounds() {
  configure();
  for (const name of ['tap', 'deal', 'reveal', 'turn'] as Sfx[]) get(name);
}

function get(name: Sfx): AudioPlayer | null {
  try {
    let player = players.get(name);
    if (!player) {
      player = createAudioPlayer(SOURCES[name]);
      player.volume = GAIN[name] ?? 1;
      players.set(name, player);
    }
    return player;
  } catch {
    return null;
  }
}

export function playSfx(name: Sfx) {
  if (!enabled) return;
  configure();
  const player = get(name);
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {
    /* a failed sound must never break a round */
  }
}

/** Called on teardown in tests and on session end; native players are finite. */
export function releaseSounds() {
  for (const p of players.values()) {
    try {
      p.remove();
    } catch {
      /* ignore */
    }
  }
  players.clear();
}
