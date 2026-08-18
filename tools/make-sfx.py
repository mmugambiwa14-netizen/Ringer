#!/usr/bin/env python3
"""
Generates RINGER's sound effects as WAV files.

The sounds are synthesised rather than licensed, which means there is no
attribution to track, no licence to renew, and the whole palette can be
re-tuned by editing numbers instead of re-buying samples. Everything is
seeded, so a rebuild produces byte-identical files.

The brief matches the visual system: physical and analog — rubber stamp,
card riffle, wood block — not glossy interface blips.

    python3 tools/make-sfx.py
"""
import numpy as np, wave, pathlib

SR = 44100
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "sfx"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(20260818)


def t(dur):
    return np.linspace(0, dur, int(SR * dur), endpoint=False)


def decay(n, tau, curve=1.0):
    """Exponential fall-off. Lower tau = snappier."""
    x = np.linspace(0, 1, n)
    return np.exp(-x / tau) ** curve


def attack(n, ms=3.0):
    """Short fade-in so nothing starts with a click artefact."""
    a = np.ones(n)
    k = max(int(SR * ms / 1000), 1)
    a[:k] = np.linspace(0, 1, k)
    return a


def lowpass(x, cutoff):
    """One-pole low-pass. Cheap, and the gentle slope suits these sounds."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = a * acc + (1 - a) * v
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def noise(n):
    return rng.uniform(-1, 1, n)


def tone(freq, dur, kind="sine"):
    ph = 2 * np.pi * freq * t(dur)
    if kind == "square":
        return np.sign(np.sin(ph))
    if kind == "tri":
        return 2 / np.pi * np.arcsin(np.sin(ph))
    return np.sin(ph)


def softclip(x, drive=1.6):
    """Adds bite without the harshness of hard clipping."""
    return np.tanh(x * drive) / np.tanh(drive)


def place(buf, x, at):
    i = int(at * SR)
    end = min(i + len(x), len(buf))
    buf[i:end] += x[: end - i]


def write(name, x, peak=0.82):
    x = np.asarray(x, dtype=np.float64)
    x = x - np.mean(x)  # block DC; filtered noise leaves a small offset
    m = np.max(np.abs(x))
    if m > 0:
        x = x / m * peak
    # 4ms fade out so nothing ends on a discontinuity
    k = min(int(SR * 0.004), len(x))
    if k:
        x[-k:] *= np.linspace(1, 0, k)
    pcm = (x * 32767).astype("<i2")
    with wave.open(str(OUT / name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return len(pcm) / SR


# ---------------------------------------------------------------- tap
# Button press. Must be tiny — it fires on every single touch.
n = int(SR * 0.045)
tap = highpass(noise(n), 900) * decay(n, 0.10) * 0.7
tap += tone(190, 0.045) * decay(n, 0.13) * 0.55
tap *= attack(n, 1.0)
write("tap.wav", softclip(tap, 1.2), peak=0.55)

# ---------------------------------------------------------------- turn
# Wood block tick for the clue turn. Dry, woody, unmistakable across a table.
n = int(SR * 0.10)
turn = tone(660, 0.10, "tri") * decay(n, 0.07)
turn += tone(1320, 0.10) * decay(n, 0.03) * 0.35
turn += highpass(noise(n), 2500) * decay(n, 0.02) * 0.4
turn *= attack(n, 1.0)
write("turn.wav", softclip(turn, 1.4), peak=0.7)

# ---------------------------------------------------------------- deal
# Card riffle: ticks that accelerate then settle, ending on the pile landing.
dur = 1.15
deal = np.zeros(int(SR * dur))
# The gap shrinks toward a floor rather than geometrically — a pure geometric
# decay converges before it reaches the end and the loop never terminates.
pos, gap = 0.02, 0.075
while pos < 0.80:
    m = int(SR * 0.028)
    tick = highpass(noise(m), 1800) * decay(m, 0.06) * rng.uniform(0.55, 1.0)
    place(deal, tick, pos)
    pos += gap
    gap = max(gap * 0.90, 0.018)  # accelerating riffle, floored
m = int(SR * 0.30)
land = lowpass(noise(m), 700) * decay(m, 0.10)
land += tone(95, 0.30) * decay(m, 0.13) * 0.8
place(deal, land * 1.3, 0.84)
write("deal.wav", softclip(deal, 1.3))

# ---------------------------------------------------------------- reveal
# Paper sliding: filtered noise that opens up as the shutter clears.
# A hump, not a ramp: it has to peak as the word clears and then get out of
# the way, or it sounds like it was cut off mid-swell.
dur = 0.40
n = int(SR * dur)
hump = np.sin(np.linspace(0, np.pi, n)) ** 1.3
sweep = highpass(lowpass(noise(n), 5200), 500) * hump
sweep += tone(240, dur) * hump * 0.16
write("reveal.wav", softclip(sweep, 1.1), peak=0.58)

# ---------------------------------------------------------------- stamp
# Rubber stamp hitting paper. Used for the vote and the result cards.
dur = 0.28
n = int(SR * dur)
stamp = lowpass(noise(n), 420) * decay(n, 0.09) * 1.2
stamp += tone(78, dur) * decay(n, 0.11)
stamp += highpass(noise(n), 3000) * decay(n, 0.015) * 0.5
stamp *= attack(n, 0.6)
write("stamp.wav", softclip(stamp, 2.0))

# ---------------------------------------------------------------- win
# Crew win. Bright, major, two hits — celebratory without being a slot machine.
dur = 0.75
win = np.zeros(int(SR * dur))
for i, f in enumerate([523.25, 659.25, 783.99]):        # C major
    m = int(SR * 0.55)
    v = (tone(f, 0.55, "tri") * 0.6 + tone(f * 2, 0.55) * 0.2) * decay(m, 0.28)
    place(win, v * attack(m, 4) * 0.5, 0.0 + i * 0.012)
for i, f in enumerate([783.99, 1046.50]):               # resolve up
    m = int(SR * 0.42)
    v = tone(f, 0.42, "tri") * decay(m, 0.24)
    place(win, v * attack(m, 4) * 0.42, 0.20 + i * 0.012)
m = int(SR * 0.2)
place(win, lowpass(noise(m), 500) * decay(m, 0.08) * 0.5, 0.0)
write("win.wav", softclip(win, 1.2))

# ---------------------------------------------------------------- lose
# Ringer win. Minor, falling, a bit smug. Not a failure sound — someone won.
dur = 0.85
lose = np.zeros(int(SR * dur))
for i, f in enumerate([440.00, 523.25, 622.25]):        # A minor-ish cluster
    m = int(SR * 0.6)
    v = (tone(f, 0.6, "tri") * 0.55 + tone(f / 2, 0.6) * 0.25) * decay(m, 0.3)
    place(lose, v * attack(m, 5) * 0.5, 0.0 + i * 0.014)
for i, f in enumerate([415.30, 311.13]):                # slide down
    m = int(SR * 0.5)
    v = tone(f, 0.5, "tri") * decay(m, 0.3)
    place(lose, v * attack(m, 5) * 0.45, 0.26 + i * 0.10)
m = int(SR * 0.26)
place(lose, lowpass(noise(m), 380) * decay(m, 0.1) * 0.6, 0.0)
write("lose.wav", softclip(lose, 1.25))

# ---------------------------------------------------------------- tick
# Last five seconds of a turn. Deliberately dry and slightly unpleasant.
n = int(SR * 0.07)
tick = tone(1180, 0.07, "square") * decay(n, 0.05) * 0.5
tick += highpass(noise(n), 4000) * decay(n, 0.02) * 0.3
tick *= attack(n, 1.0)
write("tick.wav", softclip(tick, 1.1), peak=0.5)

for f in sorted(OUT.glob("*.wav")):
    with wave.open(str(f)) as w:
        print(f"  {f.name:12} {w.getnframes() / w.getframerate():.2f}s  {f.stat().st_size / 1024:.0f} KB")
