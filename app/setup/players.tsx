import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
import { displayName } from '../../src/engine/roster';
import { haptics } from '../../src/lib/haptics';

export default function Players() {
  const players = useGame((s) => s.game.players);
  const dispatch = useGame((s) => s.dispatch);
  // One row is editable at a time. A screen of live text fields invites
  // mis-taps while the phone is going round the table.
  const [editingId, setEditingId] = useState<string | null>(null);
  // Who Am I borrows this screen for its roster. Without a target it belongs to
  // RINGER's setup and carries on to the packs.
  const { next } = useLocalSearchParams<{ next?: string }>();
  const onwards = next ?? '/setup/packs';

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
            {editingId === p.id ? (
              <TextInput
                value={p.name}
                placeholder="TAP TO NAME"
                placeholderTextColor={color.inkSoft}
                maxLength={12}
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                style={styles.input}
                onChangeText={(name) => dispatch({ type: 'RENAME_PLAYER', id: p.id, name })}
                onBlur={() => setEditingId(null)}
                onSubmitEditing={() => setEditingId(null)}
              />
            ) : (
              <Text
                accessibilityRole="button"
                accessibilityLabel={p.name ? `Edit the name ${p.name}` : 'Add a name'}
                style={[styles.name, p.name ? null : styles.unnamed]}
                numberOfLines={1}
                onPress={() => {
                  haptics.tap();
                  setEditingId(p.id);
                }}
              >
                {p.name || 'TAP TO NAME'}
              </Text>
            )}
            {players.length > 3 ? (
              <Text
                accessibilityRole="button"
                accessibilityLabel={`Remove ${displayName(p)}`}
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
            router.replace(onwards as never);
          }}
        />
      </Row>

      <Text style={styles.note}>
        Tap a name to change it. Icons are handed out automatically. Skip naming and the game just
        calls you by your shape — &ldquo;pass to TRIANGLE&rdquo; works fine.
      </Text>

      <View style={styles.spacer} />
      <Button
        label={next ? 'READY' : 'NEXT — PICK PACKS'}
        tone={color.blue}
        // Who Am I works from two; RINGER needs three for a round to make sense.
        disabled={players.length < (next ? 2 : 3)}
        onPress={() => router.replace(onwards as never)}
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
  // minWidth 0 lets both the field and the resting label shrink below their own
  // content, instead of growing and shoving the remove button off the card.
  input: { flex: 1, minWidth: 0, ...t.d3, fontSize: 18, color: color.ink, padding: 0 },
  // The whole row-width label is the tap target, so it stays easy to hit while
  // the phone is being passed around.
  name: { flex: 1, minWidth: 0, ...t.d3, fontSize: 18, color: color.ink, paddingVertical: 2 },
  unnamed: { color: color.inkSoft },
  remove: { ...t.d3, fontSize: 15, paddingHorizontal: 6, color: color.pink, flexShrink: 0 },
  addRow: { marginTop: 12 },
  half: { flex: 1 },
  note: { ...t.small, color: color.inkSoft, marginTop: 12 },
  cta: { marginTop: 14 },
});
