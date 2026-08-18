# Store listing copy

Everything here is drafted and ready to paste. Two things must be replaced before submission:
the support URL and the privacy policy URL, once `store/privacy-policy.html` is hosted.

---

## App name (30 char limit)

```
Ringer: Imposter Party Game
```

27 characters. The name field carries the most search weight of any field in either store, so
it is not just "Ringer" — the category words are doing real work there.

## Subtitle / short description (30 / 80 chars)

**iOS subtitle (30):**
```
One phone. One of you is lying
```

**Play short description (80):**
```
Everyone gets the secret word. Except one of you. A party game for one phone.
```

Do not repeat words between name, subtitle and keywords — Apple indexes them jointly, so a
repeat wastes a slot.

## Keywords (iOS, 100 chars, comma separated, no spaces)

```
word,bluff,spy,undercover,fake,chameleon,group,friends,drinking,family,offline,social,guess
```

Deliberately omits "imposter", "party" and "game" — they are already in the app name and
would be wasted characters.

## Description

```
Everyone at the table sees the same secret word. Everyone except one person.

That person is the ringer. They have to give a clue about a word they have never seen,
work out what it is from what everyone else says, and not get caught doing it.

Pass one phone around. Slide the card up to see your word — let go and it shuts instantly,
so nobody catches a glimpse over your shoulder. Then go round the table, one clue each.
Too obvious and the ringer works out the word. Too vague and everyone thinks it is you.

Argue. Accuse. Vote.

Catch the ringer and they get one last guess at the word. Get it right and they steal the
round anyway.

THREE WAYS TO PLAY
• Classic — the ringer knows what they are, and gets a word close to the real one to
  bluff from
• Decoy — everyone gets a word, but one of them is subtly wrong, and nobody is told who
• Ghost — the ringer gets nothing at all. No word, no category. Good luck

BUILT FOR A REAL TABLE
• One phone, 3 to 20 players, about five minutes a round
• Nobody types their name unless they want to — everyone gets a shape, and the game calls
  you by it
• A turn director everyone can read from across the table
• Works completely offline. No account, no sign-up, no wifi
• No ads. Ever. No subscription — one payment for the full set

775 WORDS, ALL CHECKED
Every word is picked so a table of six can actually clue it, and every one has a partner
word for Decoy mode. Curated, not padded.

Three packs are free — 239 words, enough for a whole night. The other seven unlock with a
single payment, once, and stay yours. No subscription, no ads, no account.

Play it at a dinner table, in a pub, in the back of a car, on a train, at a family
Christmas. It needs one phone and people who like accusing each other.
```

## Screenshots — the order matters

Most people never scroll past the second one.

1. **The reveal card, mid-slide** — the shutter half up, the word showing. Caption:
   "Slide up to see your word."
2. **The ringer card** — full pink, "YOU'RE THE RINGER". Caption: "Unless you're the ringer."
3. Clue turn with the timer ring — "One clue each. Don't be obvious."
4. The vote grid — "Then argue about it."
5. Result screen — "Caught? One guess to steal it."
6. Word pack grid — "Ten packs. Three of them free."
7. Player list with icons — "Nobody has to type a name."

Shoot on a mid-size device, keep the status bar clean, and do not add glossy 3D device
frames — the flat design is the differentiator and a frame buries it.

## Monetisation — and why the split is stated out loud

One non-consumable in-app purchase (`UNLOCK_PRODUCT_ID` in `src/config.ts`), unlocking the
seven paid packs permanently. Declare it in both stores; iOS also needs the price tier set
before the listing can go live.

The description says which packs are free and how many words that is. That is deliberate, not
modesty: leading with "775 words" while 536 of them sit behind a paywall is the kind of metadata
Apple rejects under 2.3.1, and it earns one-star reviews from people who felt bait-and-switched
even when it passes review. State the split and the one-payment model reads as a selling point
instead of a complaint.

"No subscription" deserves its own line. The nearest competitors charge up to **$7.99 a week**
for the same genre, and the shopper comparing those two numbers is the one most likely to
convert.

## Name risk — check this before paying anyone to draw anything

The category is saturated with near-identical names. Live at the time of writing: *Fakeit:
Imposter Game*, *Fake It — Guess The Impostor*, *Imposter Who?*, *Imposter Party*, *Imposter —
Secret Word Game*, *Imposter Game: Word Party*, *Imposter Game — Party Edition*, *Imposter AI*.

At least one of them also ships a pack called **Spicy** and overlaps six of ten category names
with this app. That is not a plagiarism problem — the genre converged — but it does mean the 4.3
appeal below is likely to be needed, and that "Ringer" is carrying more of the differentiation
than the category words after it.

## Age rating

**12+ / Teen**, with the 18+ pack hidden by default.

Answer both questionnaires honestly. Declare infrequent/mild suggestive themes on account of
the Spicy pack even though it is off by default, because it is reachable in the shipped
binary. A dishonest rating questionnaire is the fastest route to removal.

## Category

Primary: **Games → Word**. Secondary: **Games → Family** on iOS, **Trivia** on Play.

## What to write in the "review notes" field

```
Ringer is an offline pass-and-play party game. No account or login is required — tap PLAY
to start. There is no network functionality, no ads, and no data collection (an anonymous
statistics toggle exists in Settings and is off by default).

There is a single non-consumable in-app purchase that permanently unlocks seven additional
word packs. Three packs are playable without it, and every mode and rule is available in the
free tier — the purchase adds words only. Restore is in Settings > Word Packs.

An 18+ word pack is included but hidden until enabled in Settings > 18+ Pack. Its content is
adult party humour (exes, hangovers, dating) and is suggestive rather than explicit.
```

## If it gets rejected under Guideline 4.3 (Spam)

Expect this. The imposter-game category is saturated, and a 4.3 rejection is the most likely
reason a first submission bounces. Have the appeal ready before submitting, and lead with
specifics rather than "mine is different":

- **Decoy and Ghost modes** are mechanically distinct games, not difficulty settings. Decoy
  in particular — where nobody is told they are the imposter — is not present in the
  competing apps.
- **An original 775-word database**, written for this app, every entry with a paired decoy
  word. Not licensed, not scraped.
- **An original visual and audio identity**: a flat riso-print design system and a synthesised
  sound palette, both produced for this app.
- **Original accessibility work**: shape-based player identity so colour never carries
  meaning alone, and a plain-reveal mode.
