import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DealAnimation, Screen, Sticker, Text, color, type as t } from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { playSfx } from '../../src/lib/sound';
import { haptics } from '../../src/lib/haptics';
import { track } from '../../src/lib/analytics';

/** Long enough to read as a shuffle, short enough that nobody taps through it. */
const BEAT_MS = 1500;

export default function Deal() {
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const dealt = useRef(false);
  const wobble = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    // Guard: effects run twice under StrictMode, and dealing twice would
    // silently throw away a round and re-roll the ringer.
    if (dealt.current) return;
    dealt.current = true;

    dispatch({ type: 'DEAL', at: Date.now() });
    track({
      name: 'round_started',
      player_count: game.players.length,
      mode: game.config.mode,
      pack_count: game.config.packs.length,
      laps: game.config.clueLaps,
      vote_style: game.config.voteStyle,
      turn_timer: game.config.turnTimer,
    });
    playSfx('deal');
    haptics.press();

    if (!reduced)
      wobble.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 90, easing: Easing.inOut(Easing.quad) }),
          withTiming(-1, { duration: 90, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );

    const id = setTimeout(() => router.replace('/game/reveal'), BEAT_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, wobble]);

  const wobbleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value * 2.2}deg` }],
  }));

  return (
    <Screen tone={color.yellow}>
      <View style={styles.body}>
        <DealAnimation count={game.players.length} icons={game.players.map((p) => p.icon)} />
        <Animated.View style={wobbleStyle}>
          <Text style={styles.title}>DEALING</Text>
        </Animated.View>
        <Sticker tone={color.paper}>{`ROUND ${Math.max(game.roundNumber, 1)}`}</Sticker>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  title: { ...t.d1, textAlign: 'center' },
});
