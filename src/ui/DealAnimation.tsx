import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { border, color, shadow } from './tokens';
import { identityFor } from '../engine/roster';

/**
 * The deal. A stack of cards fans out, hangs for a beat, then snaps back into
 * a pile. It exists to make the deal feel like it happened — without it the
 * round appears out of nowhere and nobody trusts that the roles were shuffled.
 *
 * One card per player, capped at eight on screen. Past that the fan reads as
 * mush and the animation costs more than it earns.
 */

const MAX_CARDS = 8;
const CARD_W = 96;
const CARD_H = 132;

export function DealAnimation({ count, icons }: { count: number; icons: number[] }) {
  const shown = Math.min(count, MAX_CARDS);
  const { width } = useWindowDimensions();
  const spread = Math.min(width * 0.34, 132);

  return (
    <View style={styles.stage} pointerEvents="none">
      {Array.from({ length: shown }, (_, i) => (
        <DealtCard
          key={i}
          index={i}
          total={shown}
          spread={spread}
          icon={icons[i] ?? i}
        />
      ))}
    </View>
  );
}

function DealtCard({
  index,
  total,
  spread,
  icon,
}: {
  index: number;
  total: number;
  spread: number;
  icon: number;
}) {
  const progress = useSharedValue(0);
  const reduced = useReducedMotion();
  // -1 .. 1 across the fan, so the middle card barely moves.
  const offset = total === 1 ? 0 : (index / (total - 1)) * 2 - 1;

  useEffect(() => {
    if (reduced) {
      // Reduce Motion is a request to stop things flying around, not to hide
      // the beat entirely — the cards still appear, they just don't fan.
      progress.value = withSequence(withTiming(0.12, { duration: 200 }), withTiming(0, { duration: 200 }));
      return;
    }
    progress.value = withDelay(
      index * 55,
      withSequence(
        withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 260 }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }),
      ),
    );
  }, [index, progress, reduced]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: offset * spread * p },
        { translateY: -Math.abs(offset) * 14 * p - p * 8 },
        { rotate: `${offset * 13 * p - 2}deg` },
        { scale: 0.94 + p * 0.06 },
      ],
      zIndex: index,
    };
  });

  const identity = identityFor(icon);

  return (
    <Animated.View style={[styles.card, style]}>
      <View style={[styles.face, { backgroundColor: identity.color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: CARD_H + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderWidth: border.base,
    borderColor: color.ink,
    backgroundColor: color.paper,
    padding: 8,
    shadowColor: color.ink,
    shadowOffset: { width: shadow.offsetSm, height: shadow.offsetSm },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  face: { flex: 1, borderWidth: border.hair, borderColor: color.ink },
});
