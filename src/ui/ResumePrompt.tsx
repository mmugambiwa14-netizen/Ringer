import { StyleSheet, View } from 'react-native';
import { Button, GhostButton } from './Button';
import { Sticker } from './Sticker';
import { Text } from './Text';
import { color, type as t } from './tokens';

/**
 * Cold start with a round still in flight. Party games get interrupted —
 * someone gets a call, someone's battery dies — and coming back to the home
 * screen with the round silently binned is the worst possible outcome.
 */
export function ResumePrompt({
  roundNumber,
  phaseLabel,
  onResume,
  onDiscard,
}: {
  roundNumber: number;
  phaseLabel: string;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <Sticker tone={color.paper}>{`ROUND ${roundNumber}`}</Sticker>
        <Text style={styles.title}>STILL{'\n'}MID-ROUND</Text>
        <Text style={styles.sub}>You left off at {phaseLabel}. Pick it back up?</Text>
      </View>
      <Button label="CARRY ON" onPress={onResume} />
      <GhostButton label="BIN IT AND START OVER" onPress={onDiscard} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.yellow, padding: 24, paddingBottom: 40 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { ...t.d1, textAlign: 'center' },
  sub: { ...t.body, color: color.ink, textAlign: 'center' },
});
