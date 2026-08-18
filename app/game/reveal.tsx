import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useRedirectWhen } from '../../src/lib/navigation';
import { useKeepAwake } from 'expo-keep-awake';
import {
  Avatar,
  Button,
  RevealCard,
  Row,
  Screen,
  Sticker,
  Text,
  border,
  color,
  onColor,
  type as t,
} from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { usePrefs } from '../../src/store/prefsStore';
import { displayName } from '../../src/engine/roster';
import { revealFor } from '../../src/engine/selectors';

/**
 * Two beats per player: a handoff card with nothing secret on it, then the
 * shutter. Splitting them is what stops the phone arriving in someone's hand
 * already showing a word.
 */
export default function Reveal() {
  useKeepAwake();
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const revealStyle = usePrefs((s) => s.revealStyle);
  const [handedOver, setHandedOver] = useState(false);

  const round = game.round;
  const player = round ? game.players[round.revealIndex] : undefined;

  const face = useMemo(
    () => (round && player ? revealFor(game, player) : null),
    [game, round, player],
  );

  // Only redirect when the screen is genuinely unreachable — a deep link with
  // no round. `player` is *legitimately* undefined for one render after the
  // last reveal, because REVEAL_NEXT leaves revealIndex past the end of the
  // table; redirecting on that would race the replace() to /game/starting and
  // could drop the table on the home screen instead.
  useRedirectWhen(!round, '/');
  if (!round || !player || !face) return null;

  const name = displayName(player);
  const isRinger = face.kind === 'ringer';
  const cardTone =
    revealStyle === 'plain' || game.config.mode === 'decoy'
      ? color.paper
      : isRinger
        ? color.pink
        : color.blue;
  const ink = onColor(cardTone);

  if (!handedOver) {
    return (
      <Screen>
        <View style={styles.handoff}>
          <Avatar icon={player.icon} size="xl" label={name} />
          <Text style={t.label}>PASS THE PHONE TO</Text>
          <Text style={styles.bigName}>{name}</Text>
          <Sticker>{`PLAYER ${round.revealIndex + 1} OF ${game.players.length}`}</Sticker>
        </View>
        <Button label={`I'M ${name} — SHOW ME`} onPress={() => setHandedOver(true)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Row style={styles.bar}>
        <Sticker>HOLD IT FLAT</Sticker>
        <View style={styles.spacer} />
        <Avatar icon={player.icon} size="sm" label={name} />
      </Row>

      <RevealCard background={cardTone}>
        <Text style={[t.label, { color: ink }]}>{face.headline}</Text>
        <Text style={[styles.word, { color: ink }]} adjustsFontSizeToFit numberOfLines={2}>
          {face.word}
        </Text>
        {face.category ? (
          <View style={styles.pill}>
            <Text style={t.tiny}>CATEGORY · {face.category}</Text>
          </View>
        ) : null}
        {face.hint ? <Text style={[styles.hint, { color: ink }]}>{face.hint}</Text> : null}
      </RevealCard>

      <Button
        label="GOT IT — NEXT"
        tone={color.blue}
        style={styles.next}
        onPress={() => {
          const last = round.revealIndex + 1 >= game.players.length;
          dispatch({ type: 'REVEAL_NEXT' });
          if (last) router.replace('/game/starting');
          else setHandedOver(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  handoff: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  bigName: { ...t.d1, textAlign: 'center' },
  bar: { marginBottom: 16 },
  spacer: { flex: 1 },
  word: { ...t.word, textAlign: 'center', marginTop: 10, marginBottom: 14 },
  pill: {
    borderWidth: border.base,
    borderColor: color.ink,
    backgroundColor: color.paper,
    paddingHorizontal: 9,
    paddingTop: 4,
    paddingBottom: 3,
  },
  hint: { ...t.small, textAlign: 'center', marginTop: 12, maxWidth: 260 },
  next: { marginTop: 18 },
});
