import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import {
  Button,
  Card,
  GhostButton,
  Row,
  Rule,
  Screen,
  Sticker,
  Text,
  color,
  onColor,
  type as t,
} from '../../src/ui';
import { packsForGame } from '../../src/data/packs';
import {
  charadesScore,
  currentWord,
  isDeckSpent,
  markGot,
  markSkipped,
  playedWords,
  startCharades,
  type CharadesState,
} from '../../src/engine/charades';
import { displayFontSize } from '../../src/lib/fitText';
import { haptics } from '../../src/lib/haptics';
import { playSfx } from '../../src/lib/sound';

const DECK = packsForGame('charades').flatMap((p) => p.words);

export default function CharadesPlay() {
  useKeepAwake();
  const params = useLocalSearchParams<{ seconds?: string }>();
  const total = Number(params.seconds ?? 90);

  // Seeded once per round from the clock — the engine stays pure, the screen
  // owns the entropy, same rule as the RINGER deal.
  const [state, setState] = useState<CharadesState>(() => startCharades(DECK, Date.now()));
  const [left, setLeft] = useState<number>(total);
  const over = left <= 0 || isDeckSpent(state);
  const endedRef = useRef(false);

  useEffect(() => {
    if (total <= 0) return;
    const id = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [total]);

  // Out of the state updater: React may run one more than once, and this makes
  // a noise.
  useEffect(() => {
    if (!over || endedRef.current) return;
    endedRef.current = true;
    haptics.warn();
    playSfx('lose');
  }, [over]);

  const word = currentWord(state);
  const { got, skipped } = charadesScore(state);

  if (over) {
    const played = playedWords(state);
    return (
      <Screen tone={color.green} scroll>
        <Row style={styles.bar}>
          <Sticker tone={color.paper}>TIME</Sticker>
        </Row>
        <Text style={styles.big}>{got}</Text>
        <Text style={styles.caption}>
          {got === 1 ? 'ONE GOT' : `${got} GOT`}
          {skipped > 0 ? ` · ${skipped} SKIPPED` : ''}
        </Text>

        <Card style={styles.card}>
          <Text style={t.label}>WHAT CAME UP</Text>
          <Rule />
          {played.map(({ word: w, got: hit }) => (
            <Row key={w.id} style={styles.resultRow}>
              <Text style={styles.tick}>{hit ? '✓' : '·'}</Text>
              <Text style={[t.d3, styles.resultWord, hit ? null : styles.missed]} numberOfLines={1}>
                {w.text}
              </Text>
            </Row>
          ))}
        </Card>

        <View style={styles.spacer} />
        <Button
          label="ANOTHER ROUND"
          tone={color.pink}
          onPress={() => router.replace(`/charades/play?seconds=${total}`)}
        />
        <GhostButton label="DONE" onPress={() => router.dismissAll()} />
      </Screen>
    );
  }

  return (
    <Screen tone={color.paper}>
      <Row style={styles.bar}>
        <Sticker tone={left <= 10 ? color.pink : color.yellow}>{`${left}s`}</Sticker>
        <View style={styles.grow} />
        <View style={styles.pill}>
          <Text style={t.tiny}>{`${got} GOT`}</Text>
        </View>
      </Row>

      <View style={styles.body}>
        <Text
          style={[styles.word, { fontSize: displayFontSize(word?.text ?? '') }]}
          numberOfLines={3}
        >
          {word?.text ?? ''}
        </Text>
      </View>

      <Button
        label="GOT IT"
        tone={color.green}
        onPress={() => {
          haptics.success();
          playSfx('stamp');
          setState(markGot);
        }}
      />
      <GhostButton
        label="SKIP"
        onPress={() => {
          haptics.tap();
          setState(markSkipped);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 16 },
  grow: { flex: 1 },
  pill: {
    borderWidth: 3,
    borderColor: color.ink,
    paddingHorizontal: 9,
    paddingTop: 4,
    paddingBottom: 3,
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  word: { ...t.d1, textAlign: 'center' },
  big: { ...t.d1, fontSize: 96, lineHeight: 100, color: onColor(color.green) },
  caption: { ...t.label, marginBottom: 18 },
  card: {},
  resultRow: { gap: 10, marginTop: 8, alignItems: 'center' },
  tick: { ...t.d3, width: 18 },
  resultWord: { flex: 1, minWidth: 0, fontSize: 16 },
  missed: { color: color.inkSoft },
  spacer: { flex: 1, minHeight: 20 },
});
