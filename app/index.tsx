import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  ResumePrompt,
  Row,
  Screen,
  Sticker,
  Text,
  border,
  color,
  shadow,
  type as t,
} from '../src/ui';
import { useGame } from '../src/store/gameStore';
import { phaseLabel, routeForPhase } from '../src/lib/phaseLabel';
import { track } from '../src/lib/analytics';

export default function Home() {
  const game = useGame((s) => s.game);
  const hydrated = useGame((s) => s.hydrated);
  const dispatch = useGame((s) => s.dispatch);
  const inFlight = useGame((s) => s.hasRoundInFlight)();
  const [dismissedResume, setDismissedResume] = useState(false);

  // Nothing renders until AsyncStorage has been read back, or a saved round
  // flashes as "no game" for a frame and the resume prompt never appears.
  if (!hydrated) return <Screen />;

  if (inFlight && !dismissedResume) {
    return (
      <ResumePrompt
        roundNumber={game.roundNumber}
        phaseLabel={phaseLabel(game.phase)}
        onResume={() => router.replace(routeForPhase(game.phase) as never)}
        onDiscard={() => {
          track({
            name: 'round_abandoned',
            phase: game.phase,
            player_count: game.players.length,
          });
          dispatch({ type: 'NEXT_ROUND' });
          setDismissedResume(true);
        }}
      />
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.wordmark}>RINGER</Text>
        </View>
        <Sticker>ONE PHONE · THREE GAMES</Sticker>
        <Text style={styles.tagline}>Everyone gets the word.{'\n'}Except one of you.</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="PLAY RINGER"
          tone={color.pink}
          onPress={() => {
            track({ name: 'setup_started' });
            router.push('/setup/players');
          }}
        />
        <Row>
          <Button
            label="CHARADES"
            size="sm"
            tone={color.green}
            style={styles.half}
            onPress={() => router.push('/charades')}
          />
          <Button
            label="WHO AM I"
            size="sm"
            tone={color.blue}
            style={styles.half}
            onPress={() => router.push('/whoami')}
          />
        </Row>
        <Row>
          <Button
            label="HOW TO PLAY"
            size="sm"
            tone={color.paper}
            style={styles.half}
            onPress={() => router.push('/how-to-play')}
          />
          <Button
            label="SETTINGS"
            size="sm"
            tone={color.paper}
            style={styles.half}
            onPress={() => router.push('/settings')}
          />
        </Row>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  logo: {
    backgroundColor: color.pink,
    borderWidth: border.base,
    borderColor: color.ink,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 14,
    transform: [{ rotate: '-2.5deg' }],
    shadowColor: color.ink,
    shadowOffset: { width: shadow.offsetLg, height: shadow.offsetLg },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  wordmark: { ...t.d1, fontSize: 60, lineHeight: 62 },
  tagline: { ...t.body, color: color.inkSoft, textAlign: 'center' },
  actions: { gap: 12 },
  half: { flex: 1 },
});
