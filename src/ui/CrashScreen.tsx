import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, GhostButton } from './Button';
import { Card } from './Card';
import { Sticker } from './Sticker';
import { Text } from './Text';
import { color, type as t } from './tokens';

/**
 * Shown by expo-router's ErrorBoundary. A party game crashing is embarrassing
 * but survivable; a party game crashing and losing the scores is not, so the
 * primary action retries in place and only the secondary one resets.
 */
export function CrashScreen({
  error,
  retry,
  reset,
}: {
  error: Error;
  retry: () => void;
  reset: () => void;
}) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Sticker tone={color.paper}>SOMETHING BROKE</Sticker>
        <Text style={styles.title}>THAT{'\n'}WASN&rsquo;T{'\n'}THE PLAN</Text>
        <Text style={styles.body}>
          The round is still saved. Try carrying on — if it breaks again, starting a fresh
          session will clear it.
        </Text>
        <Card style={styles.card}>
          <Text style={t.label}>WHAT HAPPENED</Text>
          <Text style={styles.mono}>{String(error?.message ?? 'Unknown error').slice(0, 400)}</Text>
        </Card>
        <Button label="TRY AGAIN" onPress={retry} style={styles.cta} />
        <GhostButton label="START A FRESH SESSION" onPress={reset} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.pink },
  inner: { flexGrow: 1, padding: 24, paddingTop: 72, gap: 16 },
  title: { ...t.d1, color: color.ink },
  body: { ...t.body, color: color.ink },
  card: { marginTop: 8 },
  mono: { ...t.tiny, color: color.inkSoft, marginTop: 6, lineHeight: 16 },
  cta: { marginTop: 12 },
});
