import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useRedirectWhen } from '../../src/lib/navigation';
import { useKeepAwake } from 'expo-keep-awake';
import {
  Avatar, Button, GhostButton, Row, Screen, Sticker, Text, TimerRing,
  border, color, type as t,
} from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { clueTurnInfo } from '../../src/engine/selectors';
import { displayName } from '../../src/engine/roster';
import { haptics } from '../../src/lib/haptics';
import { playSfx } from '../../src/lib/sound';

/**
 * The turn director. Nothing secret is on screen, so the phone lies face-up in
 * the middle of the table and everyone can read whose turn it is from a metre
 * away. This is the bit nobody else in the category does properly.
 */
export default function Clues() {
  useKeepAwake();
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const info = clueTurnInfo(game);

  const next = useCallback(() => {
    const last = info && info.turn >= info.total;
    playSfx('turn');
    dispatch({ type: 'NEXT_TURN' });
    if (last) router.replace('/game/discussion');
  }, [dispatch, info]);

  useRedirectWhen(!info, '/');
  if (!info) return null;

  return (
    <Screen>
      <Row style={styles.bar}>
        <Sticker>{`LAP ${info.lap} / ${info.laps}`}</Sticker>
        <View style={styles.spacer} />
        <View style={styles.pill}>
          <Text style={t.tiny}>{`TURN ${info.turn}/${info.total}`}</Text>
        </View>
      </Row>

      <View style={styles.body}>
        <Avatar icon={info.player.icon} size="lg" />
        <Text style={t.label}>CLUE FROM</Text>
        <Text style={styles.name} adjustsFontSizeToFit numberOfLines={1}>
          {displayName(info.player)}
        </Text>
        <TimerRing
          key={info.turn}
          seconds={game.config.turnTimer}
          onExpire={() => {
            haptics.warn();
            playSfx('tick');
          }}
        />
      </View>

      <Text style={styles.rule}>ONE WORD ONLY · NOT THE WORD ITSELF</Text>
      <Button label="NEXT PLAYER" onPress={next} />
      <GhostButton
        label="SKIP TO DISCUSSION"
        onPress={() => {
          dispatch({ type: 'GO_TO_DISCUSSION' });
          router.replace('/game/discussion');
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
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  name: { ...t.d1, textAlign: 'center' },
  rule: { ...t.tiny, color: color.inkSoft, textAlign: 'center', marginBottom: 12 },
});
