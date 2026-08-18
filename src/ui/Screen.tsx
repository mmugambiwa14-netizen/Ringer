import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from './tokens';

/**
 * Every screen is a full-bleed colour block with safe-area padding.
 * `scroll` is off by default — the reveal screen in particular must not sit in
 * a scroll view or the pan gesture fights it.
 */
export function Screen({
  tone = color.paper,
  scroll = false,
  style,
  children,
  ...rest
}: ViewProps & { tone?: string; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: insets.top + 18,
    paddingBottom: Math.max(insets.bottom, 12) + 12,
  };

  if (scroll) {
    return (
      <View style={[styles.root, { backgroundColor: tone }]} {...rest}>
        <ScrollView
          contentContainerStyle={[styles.inner, pad, style]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, styles.inner, pad, { backgroundColor: tone }, style]} {...rest}>
      {children}
    </View>
  );
}

export function Row({ style, ...rest }: ViewProps) {
  return <View style={[styles.row, style]} {...rest} />;
}

export function Spacer() {
  return <View style={styles.spacer} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flexGrow: 1, paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  spacer: { flex: 1 },
});
