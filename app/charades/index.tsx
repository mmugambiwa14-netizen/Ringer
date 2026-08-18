import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  GhostButton,
  Row,
  Screen,
  Segmented,
  Sticker,
  Text,
  color,
  type as t,
} from '../../src/ui';
import { packsForGame } from '../../src/data/packs';

const WORDS = packsForGame('charades').reduce((n, p) => n + p.words.length, 0);

export default function CharadesSetup() {
  const [seconds, setSeconds] = useState<60 | 90 | 120>(90);

  return (
    <Screen tone={color.green} scroll>
      <Row style={styles.bar}>
        <Sticker tone={color.paper}>NO WORDS · NO POINTING</Sticker>
      </Row>
      <Text style={styles.title}>CHARADES</Text>
      <Text style={styles.blurb}>
        One person acts, everyone else shouts. Tap GOT IT the moment someone says it, SKIP if it is
        hopeless. {WORDS} things to act, and not one of them needs you to know American sport.
      </Text>

      <View style={styles.stack}>
        <Segmented
          label="ROUND LENGTH"
          value={seconds}
          note="Long enough to get a rhythm, short enough that the next person wants a go."
          onChange={setSeconds}
          options={[
            { value: 60, label: '60s' },
            { value: 90, label: '90s' },
            { value: 120, label: '120s' },
          ]}
        />
      </View>

      <View style={styles.spacer} />
      <Button
        label="START ACTING"
        tone={color.pink}
        onPress={() => router.push(`/charades/play?seconds=${seconds}`)}
      />
      <GhostButton label="BACK" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 14 },
  title: { ...t.d1, marginBottom: 12 },
  blurb: { ...t.body, color: color.ink, marginBottom: 22 },
  stack: { gap: 20 },
  spacer: { flex: 1, minHeight: 24 },
});
