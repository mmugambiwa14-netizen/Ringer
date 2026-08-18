# RINGER

A pass-and-play imposter word game. One phone, 3–20 players, about five minutes a round.
Everyone sees the secret word except one of you, who has to bluff their way through.

Built with Expo + React Native + TypeScript. No backend, no accounts, no ads, fully offline.

---

## Run it

```bash
npm install
npx expo start          # then press i / a, or scan the QR with Expo Go
```

Reanimated and Gesture Handler both need a dev build rather than plain Expo Go on some SDK
combinations — if the reveal gesture doesn't respond, run `npx expo run:ios` /
`npx expo run:android` once.

## Verify it

```bash
npm run verify       # everything below that works without node_modules
npm test             # 93 tests, no dependencies required
npm run check        # imports, engine boundary, Rules of Hooks, JSX balance, version
npm run content      # rebuild word packs from content/en/*.tsv
npm run sfx          # regenerate the sound effects (needs python3 + numpy)
npm run icons        # regenerate icon, adaptive icon and splash (needs pillow)
npm run typecheck    # needs node_modules
npm run lint         # needs node_modules
npm run format:check # needs node_modules
npm run bundle       # a real Metro export — proves the app can start
npm run preflight    # launch blockers; expected to fail until you ship
```

`npm run verify` is the gate that runs on a bare checkout — tests, content validation and
the static checks, none of which need a dependency tree. `typecheck`, `lint`, `format:check`
and a real Metro bundle run in CI after `npm ci`.

The bundle step is the one that proves the app can actually start. Nothing else resolves the
real module graph, so a dependency that is imported but never declared passes every other
gate and then red-screens on launch — which is exactly what `expo-asset` did.

### The static checks, and why they exist

Without `tsc` available in a bare checkout, several classes of bug ship silently. Each check
was written after the corresponding bug was actually found in this codebase:

| Check | Catches |
| --- | --- |
| `check-imports` | Broken relative paths, and any import that would pollute the pure engine |
| `check-hooks` | A hook placed after an early `return` — including the `if (x) return null;` guards these screens are full of. React tears the component down when the branch flips |
| `check-jsx` | Unbalanced tags after an edit, which otherwise appear as a red screen on a device |
| `check-version` | `package.json`, `app.json` and `APP_VERSION` drifting apart — the settings screen prints the last one to players, and it had already gone stale |

Each one is self-tested: break a file deliberately and it fails.

`npm test` runs on **Node's built-in test runner with zero dependencies installed** —
`src/engine/__tests__/expect.ts` is a small matcher shim over `node:assert`, using the same
matcher names as vitest and jest so the test bodies port across if you ever swap runner.
`tools/loader.mjs` is a resolver hook that lets Node run the extensionless imports Metro uses.

---

## Architecture

The one decision everything else hangs off: **the game is a pure reducer over a seeded RNG.**

```
src/engine/     pure TypeScript. no React, no React Native, no clock, no Math.random
src/lib/        pure helpers shared with the UI (reveal maths, haptics wrapper)
src/store/      zustand + AsyncStorage. owns persistence and the seed, nothing else
src/ui/         design system
src/data/       generated word packs (JSON) — do not hand-edit
content/en/     word packs as editable TSV — this is the source of truth
tools/          content build + validator, import checker, test loader
app/            expo-router screens
```

`src/engine` may not import from `src/ui`, from React, or from Expo. `npm run check`
enforces that. It's what makes the entire rule set verifiable in under two seconds instead
of by tapping through a simulator, and it means a bad rule decision surfaces as a red test
in week one rather than as a ruined game night in week six.

Every random decision derives from `state.seed`, so a whole round is reproducible:

```ts
const a = deal(withPlayers(6, 777));
const b = deal(withPlayers(6, 777));
a.round.word === b.round.word;              // same word
a.round.imposterIds === b.round.imposterIds; // same ringer
```

Even the round's start time comes in through the action (`{ type: 'DEAL', at: Date.now() }`)
rather than being read from a clock inside the engine — otherwise two identical deals would
differ and the reproducibility guarantee would be a lie.

---

## Content

**775 words across 10 packs, every one with a decoy pair.**

| Pack | Words | | Pack | Words |
| --- | --- | --- | --- | --- |
| PARTY *(free)* | 79 | | SPORT | 80 |
| FOOD *(free)* | 80 | | OBJECTS | 80 |
| ANIMALS *(free)* | 80 | | JOBS | 80 |
| PLACES | 80 | | TECH | 81 |
| SCREEN | 80 | | SPICY *(18+)* | 55 |

Words live in `content/en/*.tsv` — tab-separated `WORD⇥DECOY⇥difficulty` — so they can be
edited, diffed and argued about by someone who has never opened a JSON file. `npm run content`
validates them and generates `src/data/packs/en/*.json`. Ids are derived from the text and stay
stable, which matters because recently-used tracking keys off them.

### What the validator enforces

The mechanical half of the five criteria from the build plan:

- ≤ 16 characters — the binding constraint is display width on a phone
- ≤ 3 words, uppercase, no stray punctuation
- No duplicates inside a pack **or across packs** — a word appearing twice could be dealt
  twice in one session
- Every word has a decoy, and the decoy is genuinely different:
  - neither may contain the other
  - **they may not share a word.** `TRAIN DRIVER` / `TRAM DRIVER` fails, because every clue
    about the shared half lands identically for both roles and the ringer never gives
    themselves away. Stopwords are exempt: `SPIN THE BOTTLE` / `PASS THE PARCEL` is fine.
  - near-identical spelling is rejected once words are long enough to misread
    (`DOCUMENTARY` / `MOCKUMENTARY`)

The first run flagged 69 problems in the drafts and every one of them was real. What a
machine still can't judge — *is this clueable from four different angles?* — is exactly what
playtesting is for. Expect to cut a chunk of these after real sessions; that's the process,
not a failure of it.

### The 18+ pack

`SPICY` is adult *party* register — exes, hangovers, the morning after — deliberately
suggestive rather than explicit, so it survives a store review and an honest age-rating
questionnaire. It is **hidden entirely** until switched on in settings, and the flag lives in
prefs rather than in the pack list, so the default install has nothing to declare.

---

## The reveal gesture

`src/ui/RevealCard.tsx`. A shutter covers the card; dragging **up** moves it one-to-one with
your finger, uncovering the word from the bottom. **Letting go snaps it shut immediately.**
There is no state in which the word is left sitting on screen for the next person to catch,
which is the entire point.

- `onFinalize` handles the close, so a cancelled gesture — an incoming call, a system edge
  swipe — shuts the card just as reliably as a clean release.
- Backgrounding the app slams `progress` to 0 with no animation. Coming back from a phone
  call must never restore an exposed word.
- Pressing and holding without moving also opens it, and releasing closes it the same way.
  That's a real path for anyone who can't make a controlled drag, not a bolted-on fallback.
- The word needs ~55% of the card height of travel before it counts as revealed, so a
  stray flick can't expose it.
- The haptic on reveal is **deliberately identical for crew and ringer**. A distinct buzz
  per role is tempting and leaks the role to anyone watching hands at the table.

The maths lives in `src/lib/reveal.ts`, separate from the gesture wiring, so the clamping
and thresholds are unit-tested without a simulator.

---

## Sound

Eight effects, **synthesised rather than licensed** — `tools/make-sfx.py` generates them from
numpy with a fixed seed, so a rebuild is byte-identical. No attribution to track, no licence
to renew, and the whole palette re-tunes by editing numbers instead of re-buying samples.

The brief matches the visual system: physical and analog — rubber stamp, card riffle, wood
block — not glossy interface blips.

| Sound | Where | Character |
| --- | --- | --- |
| `tap` | every button | 45ms click, deliberately tiny |
| `turn` | clue turn advances | wood block, reads across a table |
| `deal` | the deal beat | accelerating riffle, then the pile lands |
| `reveal` | shutter clears the word | paper slide, peaks and gets out of the way |
| `stamp` | vote cast | rubber stamp hitting paper |
| `win` / `lose` | round and session result | major stab / minor fall |
| `tick` | last seconds of a turn | dry and slightly unpleasant, on purpose |

Two deliberate calls in `src/lib/sound.ts`: the app **respects the hardware silent switch**
(someone muted their phone for a reason), and it **mixes with other audio** rather than
ducking it, because the room usually has music on.

Players are created once and rewound to replay — creating one per play leaks native
resources fast when the turn tick fires every few seconds.

---

## The deal

`app/game/deal.tsx`. One card per player fans out, hangs for a beat, then snaps back into a
pile. It exists because without it the round appears out of nowhere and nobody trusts that
the roles were actually shuffled. 1.5 seconds, capped at eight cards on screen — past that
the fan reads as mush and costs more than it earns.

The deal is dispatched *from this screen*, behind a ref guard, so the animation covers the
real shuffle rather than decorating one that already happened.

---

## The share loop

The strongest distribution mechanic here is structural: **six people play on one phone and
five of them don't have the app.** That's free, already-converted demand sitting at the
table. `app/podium.tsx` is the one moment the app asks for anything — the session has ended,
everyone has just enjoyed an hour of it, and they're all holding their own phones. Anywhere
earlier and it's an interruption.

It shares the final scores plus the link through the OS share sheet, which lands in WhatsApp
or Messages where the table already is. The copy lives in `src/lib/shareText.ts` — pure, no
React Native import, tested — with `share.ts` as the thin native wrapper. Same rule as the
engine.

One Android trap worth knowing: its share sheet ignores the `url` field entirely, so the link
has to be inside the message text as well or half your shares go out pointing at nothing.
There's a test pinning that.

**No QR code yet.** A QR on the podium would be better than a share sheet for a table sitting
together, but it needs an encoder, and shipping a QR I couldn't scan-test would be worse than
shipping none. Add `react-native-qrcode-svg` and verify it on a real device.

Before any of this ships, replace `APP_LINK` in `src/config.ts` — it currently points at a
placeholder.

---

## Player identity

Twenty auto-assigned identities in `src/engine/roster.ts` — a shape and a colour, handed out
the moment someone joins. No picker, no avatar screen.

**Shape carries the identity, colour only reinforces it.** A triangle is a triangle across a
table, in a screenshot, on a bad screen, and to someone who can't tell the colours apart.

Names are optional. Leave one blank and `displayName()` falls back to the shape's name, so
"PASS TO TRIANGLE" reads fine and a table can start in about four seconds. Typing six names
into someone else's phone is the slowest moment in every game in this category.

---

## Modes

| Mode | What the ringer gets |
| --- | --- |
| **Classic** | Told they're the ringer, sees the category |
| **Decoy** | A subtly wrong word, and *nobody* is told they're the ringer |
| **Ghost** | Nothing at all. No word, no category, no steal attempt |

---

## Ties

| Rule | What happens |
| --- | --- |
| **Runoff** *(default)* | Vote again, narrowed to the players who tied |
| **Revote** | Vote again, whole table back in play |
| **Imposter wins** | The tie stands immediately — nobody is caught |

Both re-vote rules are capped at two attempts (`MAX_TIE_REVOTES` in
`src/engine/reducer.ts`). A table of four that splits 2-2 will keep doing it, the vote
screen has no way out, and every transition is persisted — so without the cap a deadlocked
round couldn't even be escaped by force-quitting the app. On the third deadlock the tie
simply stands: nobody agreed, so nobody is caught.

---

## Scoring

| Event | Points |
| --- | --- |
| Crew win | +1 to every non-ringer |
| Crew win and you personally voted for a ringer | +1 bonus (secret ballot only) |
| Ringer survives the vote | +3 |
| Ringer caught but guesses the word | +2 |
| Ringer caught, guess wrong | 0 |

Guess matching is forgiving: case-insensitive, punctuation-stripped, and within one edit for
words over five characters. Nobody should lose a round to a typo. Near misses are flagged so
the table can call it.

---

## What's built

- [x] Engine: dealing, fair deal, three modes, both vote styles, tie rules, scoring, history
- [x] 93 tests covering every outcome branch, the content contract, the share copy and resume routing
- [x] Slide-up reveal with auto-close, backgrounding guard, hold fallback
- [x] Design system: tokens, Button, Card, Sticker, Avatar, Segmented, TimerRing, Screen
- [x] All 16 screens wired end to end
- [x] Persistence — a round survives the app being backgrounded or killed
- [x] 775 words across 10 packs, all with decoy pairs, all machine-validated
- [x] Content pipeline: editable TSV in, validated JSON out
- [x] 18+ pack gated off by default
- [x] 8 synthesised sound effects wired through the flow, with a mute toggle
- [x] Deal animation
- [x] Share loop on the podium
- [x] Icon, adaptive icon and splash, generated and reproducible
- [x] Crash screen, 404 screen, and a resume prompt for interrupted rounds
- [x] Analytics event schema — opt-in, no identifiers, no-op until a sink is wired
- [x] Reduce Motion honoured across the reveal, the deal and the hint
- [x] Privacy policy, store listing copy, EAS config, CI workflow, Maestro flows

## Before you submit

Everything below is written and ready; these are the steps that need a human, an account, or
a real device.

```bash
npm run preflight   # the machine-checkable half of this list, exits 1 while any remain
```

`preflight` is deliberately not part of `npm run check` or CI — it would fail every build
until the day you ship. Run it by hand before a submission.

**Must do**

- [ ] **Replace `APP_LINK` in `src/config.ts`.** It is a placeholder and the share button
      currently points at nothing.
- [ ] **Host `store/privacy-policy.html`** and put the URL in both store listings. Both
      stores require it even though the app collects nothing.
- [ ] **Fill in `eas.json`** — Apple ID, ASC app ID, team ID, Play service account.
- [ ] **Clear the name.** Check "Ringer" on the App Store, Play, and as a domain before
      anyone is paid to draw anything. This category is crowded with near-identical names.
- [ ] **Wire an analytics transport** in `setAnalyticsSink` — Aptabase or TelemetryDeck.
      Never Firebase; see the COPPA note in `src/lib/analytics.ts`.
- [ ] **Run the Maestro flows on real devices** (`maestro test .maestro/`), especially
      `02-reveal-closes` — that behaviour is the whole game.
- [ ] **Playtest with three groups who have never seen it.** Cut every word that made a
      table go quiet.

**Worth doing**

- [ ] Commission the icon from a human. The generated one in `assets/` is genuinely
      distinctive and will not embarrass you, but the icon is ~80% of the download decision
      and it is the single highest-return money on the whole project.
- [ ] Answer both age-rating questionnaires honestly — declare mild suggestive themes for the
      Spicy pack even though it ships hidden, because it is reachable in the binary.
- [ ] Draft the Guideline 4.3 appeal *before* submitting. `store/listing.md` has it written.

**Deliberately not done**

- QR code on the podium — needs a dependency and a real device to scan-test. Shipping a QR
  I could not verify would be worse than shipping none.
- Online multiplayer, in-app purchases, localisation beyond English. All designed around
  (`Pack.isFree` already exists) but out of scope for v1.
- A security review. There are no accounts, no server, no PII and no payment code of our
  own — the attack surface is a local list of nicknames. **This changes the day online
  rooms ship**, and that is when to pay for one.

---

## What's next

- **Playtest the words.** The list is written and validated; it is not yet *proven*. Run real
  sessions, mark every word that made the table go quiet, and cut them. Growing each pack
  from 80 to 120 is the easy part — knowing which 80 deserve to stay is not.
- The how-to-play carousel (currently a static card list, which works)
- Localisation — `src/config.ts` and the strings are ready to extract
- App icon and store assets — the one thing worth paying a human for
- Analytics event schema before launch, not after
- i18n scaffolding (English only shipping)

Deliberately not built: online multiplayer, IAP, accounts. All designed around — `Pack.isFree`
already exists so adding purchases later isn't a rewrite — but out of scope for v1.
