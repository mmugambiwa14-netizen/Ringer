import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  GhostButton,
  Row,
  Screen,
  Text,
  border,
  color,
  onColor,
  type as t,
} from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { usableWordCount, visiblePacks } from '../../src/data/packs';
import { usePrefs } from '../../src/store/prefsStore';
import { haptics } from '../../src/lib/haptics';

export default function Packs() {
  const selected = useGame((s) => s.game.config.packs);
  const mode = useGame((s) => s.game.config.mode);
  const dispatch = useGame((s) => s.dispatch);
  const adultUnlocked = usePrefs((s) => s.adultUnlocked);
  const packs = visiblePacks(adultUnlocked);

  const toggle = (id: string) => {
    haptics.tap();
    const next = selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id];
    if (next.length === 0) return; // always leave one pack on
    dispatch({ type: 'SET_CONFIG', patch: { packs: next } });
  };

  return (
    <Screen scroll>
      <Row style={styles.bar}>
        <Text style={t.d3}>WORD PACKS</Text>
      </Row>

      <View style={styles.grid}>
        {packs.map((pack) => {
          const on = selected.includes(pack.id);
          const usable = usableWordCount(pack, mode);
          const tone = on ? color.blue : color.paper;
          return (
            <Pressable
              key={pack.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => toggle(pack.id)}
              style={[styles.tile, { backgroundColor: tone }]}
            >
              <Text style={styles.emoji}>{pack.emoji}</Text>
              <Text style={[styles.name, { color: onColor(tone) }]}>{pack.name}</Text>
              <Text style={[styles.count, { color: onColor(tone) }]}>
                {usable} WORD{usable === 1 ? '' : 'S'}
                {pack.adult ? ' · 18+' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.note}>
        Curated, not padded — every word is machine-checked and every one has a decoy pair.
        {mode === 'decoy' ? ' Decoy mode only uses words that ship with a pair.' : ''}
        {adultUnlocked ? '' : ' The 18+ pack is off; turn it on in settings.'}
      </Text>

      <View style={styles.spacer} />
      <Button label="NEXT — RULES" tone={color.blue} onPress={() => router.push('/setup/rules')} />
      <GhostButton label="BACK" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    flexGrow: 1,
    borderWidth: border.base,
    borderColor: color.ink,
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 11,
    shadowColor: color.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  emoji: { fontSize: 22, marginBottom: 6 },
  name: { ...t.d3, fontSize: 16 },
  count: { ...t.tiny, marginTop: 4 },
  note: { ...t.small, color: color.inkSoft, marginTop: 14 },
  spacer: { flex: 1, minHeight: 16 },
});
