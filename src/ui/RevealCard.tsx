import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { border, color, motion, shadow, type as t } from './tokens';
import { Text } from './Text';
import { haptics } from '../lib/haptics';
import { playSfx } from '../lib/sound';
import { isReadable, shutterOffset, shutterProgress, travelFor } from '../lib/reveal';

/**
 * SLIDE UP TO REVEAL.
 *
 * A shutter covers the card. Dragging up moves it one-to-one with the finger,
 * uncovering the word from the bottom. Lifting the finger snaps it shut
 * immediately — there is no state where the word is left sitting on screen for
 * the next person to catch, which is the whole point of the interaction.
 *
 * Pressing and holding without moving also opens it, and releasing closes it
 * the same way. That is a genuine accessibility path for anyone who can't make
 * a controlled drag, not a fallback bolted on.
 */

export interface RevealCardProps {
  /** Full-bleed card colour. Role colour in colour mode, paper in plain mode. */
  background: string;
  children: React.ReactNode;
  /** Fires once per open, when the word first becomes readable. */
  onRevealed?: () => void;
  /** Show the looping hint arrow until the player has opened it once. */
  showHint?: boolean;
  testID?: string;
}

export function RevealCard({
  background,
  children,
  onRevealed,
  showHint = true,
  testID,
}: RevealCardProps) {
  const [height, setHeight] = useState(0);
  const progress = useSharedValue(0);
  const hintOffset = useSharedValue(0);
  const firedThisOpen = useSharedValue(false);
  const [hasOpened, setHasOpened] = useState(false);
  const reduced = useReducedMotion();
  const travel = travelFor(height);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setHeight(e.nativeEvent.layout.height);
  }, []);

  const markRevealed = useCallback(() => {
    setHasOpened(true);
    haptics.reveal();
    playSfx('reveal');
    onRevealed?.();
  }, [onRevealed]);

  // Any trip through the background slams the shutter shut with no animation.
  // Someone taking a call mid-reveal must not come back to an exposed word.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') progress.value = 0;
    });
    return () => sub.remove();
  }, [progress]);

  // Looping nudge on the handle, only until they have done it once.
  useEffect(() => {
    if (hasOpened || !showHint || reduced) {
      hintOffset.value = withTiming(0, { duration: 120 });
      return;
    }
    hintOffset.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 620, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 620, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [hasOpened, showHint, reduced, hintOffset]);

  const close = () => {
    'worklet';
    progress.value = withTiming(0, {
      duration: motion.shutterClose,
      easing: Easing.out(Easing.quad),
    });
    firedThisOpen.value = false;
  };

  const pan = Gesture.Pan()
    // Only an upward drag should take the gesture, so the screen stays scrollable.
    .activeOffsetY([-8, 10000])
    .failOffsetX([-24, 24])
    .onUpdate((e) => {
      const next = shutterProgress(e.translationY, travel);
      progress.value = next;
      if (isReadable(next) && !firedThisOpen.value) {
        firedThisOpen.value = true;
        runOnJS(markRevealed)();
      }
    })
    // onFinalize covers release AND cancellation (a call, a system gesture).
    .onFinalize(close);

  const hold = Gesture.LongPress()
    .minDuration(180)
    .maxDistance(10000)
    .onStart(() => {
      progress.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
      if (!firedThisOpen.value) {
        firedThisOpen.value = true;
        runOnJS(markRevealed)();
      }
    })
    .onFinalize(close);

  const gesture = Gesture.Race(pan, hold);

  const shutterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: shutterOffset(progress.value, height || 1) }],
  }));

  // The face only becomes hittable/visible as the shutter clears it, so a
  // half-open card can't be screenshotted into a readable word by accident.
  const faceStyle = useAnimatedStyle(() => ({
    opacity: progress.value <= 0.02 ? 0 : 1,
  }));

  const hintStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hintOffset.value }],
    opacity: 1 - progress.value * 2,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.wrap} onLayout={onLayout} testID={testID}>
        <View style={[styles.card, { backgroundColor: background }]}>
          <Animated.View style={[styles.face, faceStyle]} pointerEvents="none">
            {children}
          </Animated.View>

          <Animated.View style={[styles.shutter, shutterStyle]} pointerEvents="none">
            <Stripes />
            <Animated.View style={[styles.hint, hintStyle]}>
              <Arrow />
              <Text style={styles.hintTitle}>SLIDE UP</Text>
              <Text style={styles.hintSub}>LET GO AND IT SHUTS</Text>
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </GestureDetector>
  );
}

/** Diagonal riso hatching for the shutter. */
function Stripes() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern id="hatch" width="24" height="24" patternUnits="userSpaceOnUse">
          <Rect width="24" height="24" fill={color.paperDeep} />
          <Line x1="0" y1="24" x2="24" y2="0" stroke={color.paperStripe} strokeWidth="12" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#hatch)" />
    </Svg>
  );
}

function Arrow() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40">
      <Rect x="0" y="0" width="0" height="0" />
      <Line
        x1="20"
        y1="34"
        x2="20"
        y2="8"
        stroke={color.ink}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Line
        x1="20"
        y1="7"
        x2="9"
        y2="19"
        stroke={color.ink}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Line
        x1="20"
        y1="7"
        x2="31"
        y2="19"
        stroke={color.ink}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 300 },
  card: {
    flex: 1,
    borderWidth: border.base,
    borderColor: color.ink,
    overflow: 'hidden',
    // Hard offset shadow, no blur, no alpha — matches every other surface.
    shadowColor: color.ink,
    shadowOffset: { width: shadow.offset, height: shadow.offset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  shutter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  hint: { alignItems: 'center', gap: 10 },
  hintTitle: { ...t.d3, color: color.ink },
  hintSub: { ...t.tiny, color: color.inkSoft },
});
