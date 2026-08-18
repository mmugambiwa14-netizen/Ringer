import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useRedirectWhen } from '../../src/lib/navigation';
import {
  Avatar,
  Button,
  Card,
  Row,
  Screen,
  Sticker,
  Text,
  border,
  color,
  type as t,
} from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { voteCounts } from '../../src/engine/selectors';
import { displayName } from '../../src/engine/roster';

export default function VoteResult() {
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const round = game.round;
  const accused = game.players.find((p) => p.id === round?.accusedId);

  useRedirectWhen(!round || !accused, '/');
  if (!round || !accused) return null;

  const counts = voteCounts(game);
  const max = Math.max(1, ...counts.values());
  const quick = game.config.voteStyle === 'quick';

  return (
    <Screen scroll>
      <Row style={styles.bar}>
        <Sticker>THE VOTE</Sticker>
      </Row>

      {quick ? null : (
        <View style={styles.tally}>
          {game.players
            .slice()
            .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
            .map((p) => {
              const n = counts.get(p.id) ?? 0;
              const top = p.id === accused.id;
              return (
                <View key={p.id} style={styles.tallyRow}>
                  <Row style={styles.tallyLabel}>
                    <Text style={t.tiny}>{displayName(p)}</Text>
                    <View style={styles.spacer} />
                    <Text style={t.tiny}>{n}</Text>
                  </Row>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        {
                          width: `${Math.max((n / max) * 100, 2)}%`,
                          backgroundColor: top ? color.pink : color.blue,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
        </View>
      )}

      <Card style={styles.card}>
        <Text style={t.label}>VOTED OUT</Text>
        <Row style={styles.out}>
          <Avatar icon={accused.icon} size="lg" />
          <Text style={styles.name} adjustsFontSizeToFit numberOfLines={1}>
            {displayName(accused)}
          </Text>
        </Row>
      </Card>

      <View style={styles.spacer} />
      <Button
        label="REVEAL"
        tone={color.pink}
        onPress={() => {
          dispatch({ type: 'GO_TO_SCOREBOARD' });
          const caught = round.imposterIds.includes(accused.id);
          const canGuess = caught && game.config.imposterCanGuess && game.config.mode !== 'ghost';
          router.replace(canGuess ? '/game/guess' : '/game/result');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 16 },
  tally: { gap: 12, marginBottom: 20 },
  tallyRow: { gap: 4 },
  tallyLabel: {},
  spacer: { flex: 1 },
  track: {
    height: 22,
    borderWidth: border.base,
    borderColor: color.ink,
    backgroundColor: color.paper,
  },
  fill: { height: '100%' },
  card: { marginTop: 4 },
  out: { marginTop: 8 },
  name: { ...t.d2, flex: 1 },
});
