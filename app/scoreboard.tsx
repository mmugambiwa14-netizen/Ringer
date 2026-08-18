import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar,
  Button,
  GhostButton,
  Row,
  Screen,
  Text,
  border,
  color,
  type as t,
} from '../src/ui';
import { useGame } from '../src/store/gameStore';
import { standings } from '../src/engine/scoring';
import { displayName } from '../src/engine/roster';

export default function Scoreboard() {
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const rows = standings(game.players);
  const over = game.phase === 'gameOver';

  return (
    <Screen scroll>
      <Row style={styles.bar}>
        <Text style={t.d3}>{over ? 'FINAL' : 'STANDINGS'}</Text>
        <View style={styles.spacer} />
        <View style={styles.pill}>
          <Text style={t.tiny}>{`ROUND ${game.roundNumber}`}</Text>
        </View>
      </Row>

      <View>
        {rows.map((p, i) => (
          <Row key={p.id} style={styles.row}>
            <Text style={styles.rank}>{String(i + 1).padStart(2, '0')}</Text>
            <Avatar icon={p.icon} size="sm" />
            <Text style={styles.name} numberOfLines={1}>
              {displayName(p)}
            </Text>
            <Text style={styles.points}>{p.score}</Text>
          </Row>
        ))}
      </View>

      <Text style={styles.note}>
        Ringer survives: +3. Caught: crew take +1 each. Caught but guesses the word: +2 to the
        ringer. First to {game.config.winTarget} wins the session.
      </Text>

      <View style={styles.spacer} />
      {over ? (
        <Button
          label="SEE THE PODIUM"
          tone={color.pink}
          onPress={() => router.replace('/podium')}
        />
      ) : (
        <Button
          label="NEXT ROUND"
          tone={color.pink}
          onPress={() => {
            dispatch({ type: 'NEXT_ROUND' });
            router.replace('/game/deal');
          }}
        />
      )}
      <GhostButton
        label="END SESSION"
        onPress={() => {
          // A session with rounds behind it earns the podium and the share
          // moment; one abandoned at round zero just goes home.
          if (game.roundNumber > 0) router.replace('/podium');
          else {
            dispatch({ type: 'END_SESSION' });
            router.replace('/');
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 16 },
  spacer: { flex: 1 },
  pill: {
    borderWidth: border.base,
    borderColor: color.ink,
    paddingHorizontal: 9,
    paddingTop: 4,
    paddingBottom: 3,
  },
  row: { borderBottomWidth: border.base, borderBottomColor: color.ink, paddingVertical: 11 },
  rank: { ...t.tiny, width: 24 },
  name: { ...t.d3, fontSize: 19, flex: 1 },
  points: { ...t.d3, fontSize: 22 },
  note: { ...t.small, color: color.inkSoft, marginTop: 18 },
});
