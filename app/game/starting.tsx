import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useRedirectWhen } from '../../src/lib/navigation';
import { Avatar, Button, Screen, Sticker, Text, color, onColor, type as t } from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { displayName } from '../../src/engine/roster';

export default function StartingPlayer() {
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const starter = game.players.find((p) => p.id === game.round?.startingPlayerId);

  useRedirectWhen(!starter, '/');
  if (!starter) return null;
  const ink = onColor(color.blue);

  return (
    <Screen tone={color.blue}>
      <View style={styles.body}>
        <Avatar icon={starter.icon} size="xl" />
        <Text style={[t.label, { color: ink }]}>PHONE ON THE TABLE. FIRST CLUE FROM</Text>
        <Text style={[styles.name, { color: ink }]}>{displayName(starter)}</Text>
        <Sticker>ONE WORD EACH · CLOCKWISE</Sticker>
      </View>
      <Button
        label="START CLUES"
        onPress={() => {
          dispatch({ type: 'BEGIN_CLUES' });
          router.replace('/game/clues');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  name: { ...t.d1, textAlign: 'center' },
});
