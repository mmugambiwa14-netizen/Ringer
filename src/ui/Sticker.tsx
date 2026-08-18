import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { border, color, onColor, shadow, type as t } from './tokens';

/** Rotated pill label — the primary way state is named across the app. */
export function Sticker({
  children,
  tone = color.yellow,
  rotate = -2.5,
}: {
  children: string;
  tone?: string;
  rotate?: number;
}) {
  return (
    <View style={[styles.wrap, { backgroundColor: tone, transform: [{ rotate: `${rotate}deg` }] }]}>
      <Text style={[t.label, { color: onColor(tone) }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingTop: 5,
    paddingBottom: 4,
    borderWidth: border.base,
    borderColor: color.ink,
    shadowColor: color.ink,
    shadowOffset: { width: shadow.offsetSm, height: shadow.offsetSm },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
});
