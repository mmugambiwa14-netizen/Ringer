import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useRedirectWhen } from '../../src/lib/navigation';
import {
  Avatar, Button, Card, Row, Rule, Screen, Sticker, Text,
  color, onColor, type as t,
} from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { displayName } from '../../src/engine/roster';
import { haptics } from '../../src/lib/haptics';
import { playSfx } from '../../src/lib/sound';
import { track } from '../../src/lib/analytics';

export default function Result() {
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const round = game.round;

  useEffect(() => {
    if (!round?.outcome) return;
    if (round.outcome === 'crew') {
      haptics.success();
      playSfx('win');
    } else {
      haptics.thud();
      playSfx('lose');
    }
    track({
      name: 'round_completed',
      duration_s: Math.max(0, Math.round((Date.now() - round.startedAt) / 1000)),
      outcome: round.outcome,
      imposter_caught: round.accusedId !== null && round.imposterIds.includes(round.accusedId),
      guess_used: round.imposterGuess !== null,
      guess_correct: round.guessWasCorrect,
      player_count: game.players.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.outcome]);

  useRedirectWhen(!round || !round.outcome, '/');
  if (!round || !round.outcome) return null;

  const crewWon = round.outcome === 'crew';
  const tone = crewWon ? color.blue : color.pink;
  const ink = onColor(tone);
  const ringers = game.players.filter((p) => round.imposterIds.includes(p.id));

  const note = round.guessWasCorrect
    ? 'CAUGHT — BUT GUESSED THE WORD. STOLEN.'
    : crewWon
      ? 'VOTED OUT. CLEAN CATCH.'
      : 'SURVIVED THE VOTE.';

  return (
    <Screen tone={tone} scroll>
      <Row style={styles.bar}>
        <Sticker tone={color.paper}>{`ROUND ${game.roundNumber}`}</Sticker>
      </Row>

      <View style={styles.body}>
        <Text style={[styles.title, { color: ink }]}>
          {crewWon ? 'CREW\nWIN' : round.guessWasCorrect ? 'STOLEN' : 'RINGER\nWINS'}
        </Text>

        <Card style={styles.card}>
          <Text style={t.label}>THE WORD WAS</Text>
          <Text style={styles.word}>{round.word}</Text>
          <Rule />
          <Text style={[t.label, styles.spaced]}>
            {ringers.length > 1 ? 'THE RINGERS' : 'THE RINGER'}
          </Text>
          {ringers.map((p) => (
            <Row key={p.id} style={styles.ringer}>
              <Avatar icon={p.icon} size="sm" />
              <Text style={t.d3}>{displayName(p)}</Text>
            </Row>
          ))}
          {round.imposterGuess ? (
            <Text style={styles.guess}>GUESSED: {round.imposterGuess.toUpperCase()}</Text>
          ) : null}
          <Text style={styles.note}>{note}</Text>
        </Card>
      </View>

      <Button
        label="SCORES"
        onPress={() => {
          dispatch({ type: 'GO_TO_SCOREBOARD' });
          router.replace('/scoreboard');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 16 },
  body: { flex: 1, justifyContent: 'center', gap: 20 },
  title: { ...t.d1, textAlign: 'center' },
  card: {},
  word: { ...t.d3, marginTop: 5, marginBottom: 12 },
  spaced: { marginTop: 12 },
  ringer: { marginTop: 8 },
  guess: { ...t.tiny, color: color.inkSoft, marginTop: 12 },
  note: { ...t.tiny, color: color.inkSoft, marginTop: 6 },
});
