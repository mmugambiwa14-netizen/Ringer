import { useEffect } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar,
  Button,
  GhostButton,
  Row,
  Screen,
  Text,
  border,
  color,
  type as t,
} from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { identityFor } from '../../src/engine/roster';
import { haptics } from '../../src/lib/haptics';

export default function Players() {
  const players = useGame((s) => s.game.players);
  const dispatch = useGame((s) => s.dispatch);

  // Open with a sensible table rather than an empty screen. In an effect,
  // not in render — dispatching during render double-fires under StrictMode.
  useEffect(() => {
    if (players.length === 0) {
      for (let i = 0; i < 4; i++) dispatch({ type: 'ADD_PLAYER' });
    }
  }, [players.length, dispatch]);

  return (
    <Screen scroll>
      <Row style={styles.bar}>
        <Text style={t.d3}>WHO&rsquo;S IN</Text>
        <View style={styles.spacer} />
        <View style={styles.pill}>
          <Text style={t.label}>{players.length}</Text>
        </View>
      </Row>

      <View style={styles.list}>
        {players.map((p) => (
          <View key={p.id} style={styles.row}>
            <Avatar icon={p.icon} size="md" />
            <TextInput
              value={p.name}
              placeholder={identityFor(p.icon).name}
              placeholderTextColor={color.inkSoft}
              maxLength={12}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
              onChangeText={(name) => dispatch({ type: 'RENAME_PLAYER', id: p.id, name })}
            />
            <Text style={styles.tag}>{identityFor(p.icon).name}</Text>
            {players.length > 3 ? (
              <Text
                accessibilityRole="button"
                accessibilityLabel={`Remove ${identityFor(p.icon).name}`}
                style={styles.remove}
                onPress={() => {
                  haptics.tap();
                  dispatch({ type: 'REMOVE_PLAYER', id: p.id });
                }}
              >
                ✕
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      <Row style={styles.addRow}>
        <Button
          label="+ ADD PLAYER"
          size="sm"
          tone={color.paper}
          style={styles.half}
          disabled={players.length >= 20}
          onPress={() => dispatch({ type: 'ADD_PLAYER' })}
        />
        <Button
          label="SKIP NAMES"
          size="sm"
          tone={color.paper}
          style={styles.half}
          onPress={() => {
            players.forEach((p) => dispatch({ type: 'RENAME_PLAYER', id: p.id, name: '' }));
            router.push('/setup/packs');
          }}
        />
      </Row>

      <Text style={styles.note}>
        Icons are handed out automatically. Skip naming and the game just calls you by your shape —
        &ldquo;pass to TRIANGLE&rdquo; works fine.
      </Text>

      <View style={styles.spacer} />
      <Button
        label="NEXT — PICK PACKS"
        tone={color.blue}
        disabled={players.length < 3}
        onPress={() => router.push('/setup/packs')}
        style={styles.cta}
      />
      <GhostButton label="BACK" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 16 },
  spacer: { flex: 1 },
  pill: {
    borderWidth: border.base,
    borderColor: color.ink,
    paddingHorizontal: 9,
    paddingTop: 4,
    paddingBottom: 3,
  },
  list: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: border.base,
    borderColor: color.ink,
    backgroundColor: color.paper,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: color.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  // minWidth 0 lets the field shrink below its own content. Without it the
  // input grows to fit whatever is typed and shoves the shape tag and the
  // remove button off the right edge of the card — the tag clipping mid-word
  // into something that reads as a rendering fault.
  input: { flex: 1, minWidth: 0, ...t.d3, fontSize: 18, color: color.ink, padding: 0 },
  tag: { ...t.tiny, color: color.inkSoft, flexShrink: 0 },
  remove: { ...t.d3, fontSize: 15, paddingHorizontal: 6, color: color.pink, flexShrink: 0 },
  addRow: { marginTop: 12 },
  half: { flex: 1 },
  note: { ...t.small, color: color.inkSoft, marginTop: 12 },
  cta: { marginTop: 14 },
});
