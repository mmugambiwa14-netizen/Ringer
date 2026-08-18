import { useCallback } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text } from './Text';
import { border, color, motion, onColor, shadow, type as t } from './tokens';
import { haptics } from '../lib/haptics';
import { playSfx } from '../lib/sound';

type Size = 'lg' | 'sm';

/**
 * The button lands on the page when pressed: it translates into its own shadow
 * and the shadow goes to zero. That single interaction carries the whole
 * aesthetic, so it is worth doing on the UI thread rather than with opacity.
 */
export function Button({
  label,
  onPress,
  tone = color.yellow,
  size = 'lg',
  disabled,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  tone?: string;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}) {
  const pressed = useSharedValue(0);
  const drop = size === 'lg' ? shadow.offset : 4;

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: pressed.value * drop }, { translateY: pressed.value * drop }],
    shadowOffset: {
      width: (1 - pressed.value) * drop,
      height: (1 - pressed.value) * drop,
    },
  }));

  const set = useCallback(
    (v: number) => {
      pressed.value = withTiming(v, { duration: motion.press, easing: Easing.out(Easing.quad) });
    },
    [pressed],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={() => {
        set(1);
        haptics.tap();
        playSfx('tap');
      }}
      onPressOut={() => set(0)}
      onPress={onPress}
      testID={testID}
      style={style}
    >
      <Animated.View
        style={[
          styles.base,
          size === 'sm' ? styles.sm : styles.lg,
          { backgroundColor: tone, opacity: disabled ? 0.45 : 1 },
          animated,
        ]}
      >
        <Text
          numberOfLines={2}
          style={[size === 'sm' ? styles.labelSm : styles.labelLg, { color: onColor(tone) }]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** Underlined text action for the secondary path on a screen. */
export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.ghost}>
      <Text style={styles.ghostLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: border.base,
    borderColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: color.ink,
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  lg: { paddingTop: 17, paddingBottom: 15, paddingHorizontal: 16 },
  sm: { paddingTop: 12, paddingBottom: 10, paddingHorizontal: 14 },
  labelLg: { ...t.d3, fontSize: 21, textAlign: 'center' },
  labelSm: { ...t.d3, fontSize: 15, textAlign: 'center' },
  ghost: { paddingVertical: 12, alignItems: 'center' },
  ghostLabel: {
    ...t.small,
    fontSize: 14,
    letterSpacing: 1.1,
    textDecorationLine: 'underline',
    color: color.ink,
  },
});
