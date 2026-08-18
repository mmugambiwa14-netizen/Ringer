import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, GhostButton, Row, Screen, Segmented, Text, color, type as t } from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import type { GameConfig, Mode } from '../../src/engine/types';

const MODE_NOTES: Record<Mode, string> = {
  classic: 'The ringer knows who they are and sees the category.',
  decoy: "Everyone gets a word — the ringer's is subtly wrong. Nobody knows who they are.",
  ghost: 'The ringer gets nothing. No word, no category. Brutal.',
};

export default function Rules() {
  const config = useGame((s) => s.game.config);
  const players = useGame((s) => s.game.players);
  const dispatch = useGame((s) => s.dispatch);
  const set = (patch: Partial<GameConfig>) => dispatch({ type: 'SET_CONFIG', patch });

  return (
    <Screen scroll>
      <Row style={styles.bar}>
        <Text style={t.d3}>RULES</Text>
      </Row>

      <View style={styles.stack}>
        <Segmented
          label="MODE"
          value={config.mode}
          note={MODE_NOTES[config.mode]}
          onChange={(mode) => set({ mode })}
          options={[
            { value: 'classic', label: 'CLASSIC' },
            { value: 'decoy', label: 'DECOY' },
            { value: 'ghost', label: 'GHOST' },
          ]}
        />
        <Segmented
          label="RINGERS"
          value={config.imposterCount}
          note={`${players.length} players — auto gives you ${players.length <= 6 ? 1 : players.length <= 11 ? 2 : 3}.`}
          onChange={(imposterCount) => set({ imposterCount })}
          options={[
            { value: 'auto', label: 'AUTO' },
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
          ]}
        />
        <Segmented
          label="CLUE LAPS"
          value={config.clueLaps}
          onChange={(clueLaps) => set({ clueLaps })}
          options={[
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
          ]}
        />
        <Segmented
          label="TURN TIMER"
          value={config.turnTimer}
          onChange={(turnTimer) => set({ turnTimer })}
          options={[
            { value: 0, label: 'OFF' },
            { value: 15, label: '15s' },
            { value: 30, label: '30s' },
            { value: 60, label: '60s' },
          ]}
        />
        <Segmented
          label="DISCUSSION"
          value={config.discussionTimer}
          onChange={(discussionTimer) => set({ discussionTimer })}
          options={[
            { value: 0, label: 'OFF' },
            { value: 60, label: '1 MIN' },
            { value: 120, label: '2 MIN' },
            { value: 180, label: '3 MIN' },
          ]}
        />
        <Segmented
          label="THE STEAL"
          value={config.imposterCanGuess ? 'on' : 'off'}
          note={
            config.imposterCanGuess
              ? 'A caught ringer gets one guess at the word to steal the round.'
              : 'Caught is caught. Shorter rounds, harsher game.'
          }
          onChange={(v) => set({ imposterCanGuess: v === 'on' })}
          options={[
            { value: 'on', label: 'ON' },
            { value: 'off', label: 'OFF' },
          ]}
        />
        <Segmented
          label="PLAY TO"
          value={config.winTarget}
          note="First to this score ends the session."
          onChange={(winTarget) => set({ winTarget })}
          options={[
            { value: 5, label: '5' },
            { value: 10, label: '10' },
            { value: 15, label: '15' },
          ]}
        />
        <Segmented
          label="VOTING"
          value={config.voteStyle}
          note={
            config.voteStyle === 'quick'
              ? 'Everyone points on three, the host taps the accused. Five seconds.'
              : 'Pass the phone round again. Slower, but nobody follows the crowd.'
          }
          onChange={(voteStyle) => set({ voteStyle })}
          options={[
            { value: 'quick', label: 'QUICK' },
            { value: 'secret', label: 'SECRET BALLOT' },
          ]}
        />
      </View>

      <View style={styles.spacer} />
      <Button
        label="DEAL THE ROUND"
        tone={color.pink}
        onPress={() => router.replace('/game/deal')}
      />
      <GhostButton label="BACK" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 16 },
  stack: { gap: 18 },
  spacer: { flex: 1, minHeight: 18 },
});
