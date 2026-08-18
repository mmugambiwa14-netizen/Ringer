import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useRedirectWhen } from '../src/lib/navigation';
import {
  Avatar, Button, Card, GhostButton, Row, Screen, Sticker, Text,
  border, color, onColor, type as t,
} from '../src/ui';
import { useGame } from '../src/store/gameStore';
import { standings } from '../src/engine/scoring';
import { displayName } from '../src/engine/roster';
import { shareSession } from '../src/lib/share';
import { playSfx } from '../src/lib/sound';
import { haptics } from '../src/lib/haptics';
import { APP_LINK } from '../src/config';
import { track, trackSessionEnd } from '../src/lib/analytics';

/**
 * End of session. This is the one moment the app is allowed to ask for
 * anything: five of the six people at this table don't have it, they have just
 * spent an hour enjoying it, and they are all holding their own phones.
 * Anywhere earlier and it's an interruption.
 */
export default function Podium() {
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const [shared, setShared] = useState(false);
  const rows = standings(game.players);
  const winner = rows[0];

  useEffect(() => {
    playSfx('win');
    haptics.success();
    trackSessionEnd(game.roundNumber, game.players.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRedirectWhen(!winner, '/');
  if (!winner) return null;

  const onShare = async () => {
    track({ name: 'share_opened', rounds_played: game.roundNumber });
    const ok = await shareSession(game.players, game.roundNumber);
    if (ok) {
      setShared(true);
      haptics.success();
      track({ name: 'share_completed', rounds_played: game.roundNumber });
    }
  };

  return (
    <Screen tone={color.blue} scroll>
      <Row style={styles.bar}>
        <Sticker tone={color.paper}>{`${game.roundNumber} ROUNDS`}</Sticker>
      </Row>

      <View style={styles.crown}>
        <Avatar icon={winner.icon} size="xl" />
        <Text style={[t.label, { color: onColor(color.blue) }]}>TONIGHT&rsquo;S RINGER-CATCHER</Text>
        <Text style={styles.name} adjustsFontSizeToFit numberOfLines={1}>
          {displayName(winner)}
        </Text>
        <Text style={styles.score}>{winner.score}</Text>
      </View>

      <Card>
        {rows.slice(1, 5).map((p, i) => (
          <Row key={p.id} style={styles.row}>
            <Text style={styles.rank}>{String(i + 2).padStart(2, '0')}</Text>
            <Avatar icon={p.icon} size="sm" />
            <Text style={styles.rowName} numberOfLines={1}>
              {displayName(p)}
            </Text>
            <Text style={styles.rowScore}>{p.score}</Text>
          </Row>
        ))}
      </Card>

      <View style={styles.spacer} />

      <Button
        label={shared ? 'SENT — THANKS' : 'SEND THIS TO THE TABLE'}
        tone={shared ? color.green : color.yellow}
        onPress={onShare}
      />
      <Text style={styles.hint}>
        {shared
          ? 'Whoever installs it can host the next round.'
          : `Shares the final scores and ${APP_LINK.replace('https://', '')}`}
      </Text>

      <Button
        label="PLAY AGAIN"
        tone={color.paper}
        style={styles.again}
        onPress={() => {
          dispatch({ type: 'END_SESSION' });
          router.replace('/game/deal');
        }}
      />
      <GhostButton
        label="BACK TO START"
        onPress={() => {
          dispatch({ type: 'END_SESSION' });
          router.replace('/');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 12 },
  crown: { alignItems: 'center', gap: 12, marginBottom: 20 },
  name: { ...t.d1, color: '#fff', textAlign: 'center' },
  score: { ...t.d1, fontSize: 80, lineHeight: 82, color: color.yellow },
  row: { borderBottomWidth: border.hair, borderBottomColor: color.ink, paddingVertical: 9 },
  rank: { ...t.tiny, width: 22 },
  rowName: { ...t.d3, fontSize: 17, flex: 1 },
  rowScore: { ...t.d3, fontSize: 19 },
  spacer: { flex: 1, minHeight: 20 },
  hint: { ...t.tiny, color: onColor(color.blue), textAlign: 'center', marginTop: 10, opacity: 0.8 },
  again: { marginTop: 14 },
});
