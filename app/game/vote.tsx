import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useRedirectWhen } from '../../src/lib/navigation';
import { Avatar, Button, Row, Screen, Sticker, Text, border, color, type as t } from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { displayName } from '../../src/engine/roster';
import { haptics } from '../../src/lib/haptics';
import { playSfx } from '../../src/lib/sound';
import type { Player } from '../../src/engine/types';

export default function Vote() {
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const [ballotIndex, setBallotIndex] = useState(0);
  const [handedOver, setHandedOver] = useState(false);

  const round = game.round;
  const secret = game.config.voteStyle === 'secret';
  const voter = game.players[ballotIndex];

  // Every hook runs before any early return — otherwise the hook count
  // changes between a quick-vote render and a secret-ballot one and React
  // tears the component down mid-game.
  useRedirectWhen(!round, '/');

  // Belt and braces: the last ballot resolves inline below, but a restored
  // session could land here with the index past the end. Dispatching from
  // render would fire twice under StrictMode and double-resolve the vote.
  useEffect(() => {
    if (round && secret && !voter) {
      dispatch({ type: 'RESOLVE_VOTE' });
      router.replace('/game/vote-result');
    }
  }, [round, secret, voter, dispatch]);

  if (!round) return null;

  // A runoff narrows the choice to the players who tied.
  const choices: Player[] =
    round.tiedIds.length > 0
      ? game.players.filter((p) => round.tiedIds.includes(p.id))
      : game.players;

  // ---------- quick vote: one screen, five seconds ----------
  if (!secret) {
    return (
      <Screen scroll>
        <Row style={styles.bar}>
          <Sticker tone={color.pink}>3 · 2 · 1 · POINT</Sticker>
        </Row>
        <Text style={styles.title}>WHO&rsquo;S{'\n'}THE RINGER?</Text>
        <Text style={styles.sub}>Everyone points at once. Tap whoever the table accused.</Text>
        <Grid
          players={choices}
          onPick={(id) => {
            haptics.press();
            playSfx('stamp');
            dispatch({ type: 'QUICK_VOTE', accusedId: id });
            router.replace('/game/vote-result');
          }}
        />
      </Screen>
    );
  }

  // ---------- secret ballot: pass the phone again ----------
  if (!voter) return null;

  if (!handedOver) {
    return (
      <Screen>
        <View style={styles.handoff}>
          <Avatar icon={voter.icon} size="xl" />
          <Text style={t.label}>SECRET BALLOT — PASS TO</Text>
          <Text style={styles.big}>{displayName(voter)}</Text>
          <Sticker>{`BALLOT ${ballotIndex + 1} OF ${game.players.length}`}</Sticker>
        </View>
        <Button label="MY TURN" onPress={() => setHandedOver(true)} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Row style={styles.bar}>
        <Sticker tone={color.blue}>{`BALLOT ${ballotIndex + 1} / ${game.players.length}`}</Sticker>
      </Row>
      <Text style={t.label}>SECRET VOTE FROM</Text>
      <Text style={styles.title}>{displayName(voter)}</Text>
      <Grid
        players={choices.filter((p) => p.id !== voter.id)}
        onPick={(id) => {
          haptics.tap();
          dispatch({ type: 'CAST_VOTE', voterId: voter.id, accusedId: id });
          const last = ballotIndex + 1 >= game.players.length;
          if (last) {
            dispatch({ type: 'RESOLVE_VOTE' });
            router.replace('/game/vote-result');
          } else {
            setBallotIndex((i) => i + 1);
            setHandedOver(false);
          }
        }}
      />
    </Screen>
  );
}

function Grid({ players, onPick }: { players: Player[]; onPick: (id: string) => void }) {
  return (
    <View style={styles.grid}>
      {players.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={`Accuse ${displayName(p)}`}
          onPress={() => onPick(p.id)}
          style={styles.tile}
        >
          <Avatar icon={p.icon} size="md" />
          <Text style={styles.tileName} numberOfLines={1}>
            {displayName(p)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 12 },
  title: { ...t.d2, marginBottom: 6 },
  sub: { ...t.small, color: color.inkSoft, marginBottom: 16 },
  handoff: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  big: { ...t.d1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  tile: {
    width: '47%',
    flexGrow: 1,
    gap: 9,
    borderWidth: border.base,
    borderColor: color.ink,
    backgroundColor: color.paper,
    padding: 13,
    shadowColor: color.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  tileName: { ...t.d3, fontSize: 16 },
});
