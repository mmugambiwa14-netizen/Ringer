import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useRedirectWhen } from '../../src/lib/navigation';
import {
  Avatar,
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
import { useGame } from '../../src/store/gameStore';
import { displayName } from '../../src/engine/roster';
import { packsForGame } from '../../src/data/packs';
import {
  currentTurn,
  isOver,
  markPassed,
  markSolved,
  results,
  startWhoAmI,
  type WhoAmIState,
} from '../../src/engine/whoami';
import { displayFontSize } from '../../src/lib/fitText';
import { haptics } from '../../src/lib/haptics';
import { playSfx } from '../../src/lib/sound';

const DECK = packsForGame('whoami').flatMap((p) => p.words);

export default function WhoAmIPlay() {
  useKeepAwake();
  const players = useGame((s) => s.game.players);
  const [state, setState] = useState<WhoAmIState>(() => startWhoAmI(players, DECK, Date.now()));
  const [handedOver, setHandedOver] = useState(false);

  useRedirectWhen(players.length < 2, '/whoami');

  const turn = currentTurn(state);
  const player = players.find((p) => p.id === turn?.playerId);
  const done = isOver(state);

  if (players.length < 2) return null;

  if (done) {
    const rows = results(state);
    const solved = rows.filter((r) => r.solved).length;
    return (
      <Screen tone={color.blue} scroll>
        <Row style={styles.bar}>
          <Sticker tone={color.paper}>ALL DONE</Sticker>
        </Row>
        <Text style={styles.big}>{solved}</Text>
        <Text style={styles.caption}>{solved === 1 ? 'ONE GOT THERE' : `${solved} GOT THERE`}</Text>

        <Card>
          <Text style={t.label}>WHO WAS WHAT</Text>
          <Rule />
          {rows.map(({ turn: tn, solved: hit }) => {
            const who = players.find((p) => p.id === tn.playerId);
            return (
              <Row key={tn.playerId} style={styles.resultRow}>
                <Text style={styles.tick}>{hit ? '✓' : '·'}</Text>
                {who ? <Avatar icon={who.icon} size="sm" /> : null}
                <Text style={styles.who} numberOfLines={1}>
                  {who ? displayName(who) : '—'}
                </Text>
                <Text style={[styles.was, hit ? null : styles.missed]} numberOfLines={1}>
                  {tn.word.text}
                </Text>
              </Row>
            );
          })}
        </Card>

        <View style={styles.spacer} />
        <Button
          label="GO AGAIN"
          tone={color.pink}
          onPress={() => {
            setState(startWhoAmI(players, DECK, Date.now()));
            setHandedOver(false);
          }}
        />
        <GhostButton label="DONE" onPress={() => router.dismissAll()} />
      </Screen>
    );
  }

  if (!turn || !player) return null;

  // Two beats, same as the RINGER reveal: a handoff card with nothing on it,
  // then the identity. Splitting them is what stops the phone arriving in
  // someone's hand already showing their own answer.
  if (!handedOver) {
    return (
      <Screen tone={color.blue}>
        <View style={styles.handoff}>
          <Avatar icon={player.icon} size="xl" />
          <Text style={[t.label, styles.onBlue]}>PASS THE PHONE TO</Text>
          <Text style={styles.name}>{displayName(player)}</Text>
          <Sticker tone={color.paper}>{`${state.index + 1} OF ${state.turns.length}`}</Sticker>
          <Text style={[t.small, styles.onBlue, styles.instruction]}>
            Hold it up facing the table. Everyone else reads it — you don&rsquo;t.
          </Text>
        </View>
        <Button label="HOLDING IT UP" onPress={() => setHandedOver(true)} />
      </Screen>
    );
  }

  const next = (fn: typeof markSolved) => {
    setState(fn);
    setHandedOver(false);
  };

  return (
    <Screen tone={color.paper}>
      <Row style={styles.bar}>
        <Sticker>{`${displayName(player)} IS…`}</Sticker>
        <View style={styles.grow} />
        <Avatar icon={player.icon} size="sm" />
      </Row>

      <View style={styles.body}>
        <Text
          style={[styles.identity, { fontSize: displayFontSize(turn.word.text) }]}
          numberOfLines={3}
        >
          {turn.word.text}
        </Text>
        <Text style={styles.hint}>Yes or no answers only. No mouthing it.</Text>
      </View>

      <Button
        label="GOT IT"
        tone={color.green}
        onPress={() => {
          haptics.success();
          playSfx('win');
          next(markSolved);
        }}
      />
      <GhostButton
        label="GIVE UP — NEXT PLAYER"
        onPress={() => {
          haptics.thud();
          next(markPassed);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 16 },
  grow: { flex: 1 },
  handoff: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  onBlue: { color: color.paper },
  name: { ...t.d1, color: color.paper, textAlign: 'center' },
  instruction: { textAlign: 'center', maxWidth: 280 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  // fontSize comes from displayFontSize at render; lineHeight is left out so it
  // tracks the chosen size instead of fighting it.
  identity: { ...t.d1, textAlign: 'center' },
  hint: { ...t.small, color: color.inkSoft, textAlign: 'center' },
  big: { ...t.d1, fontSize: 96, lineHeight: 100, color: onColor(color.blue) },
  caption: { ...t.label, color: color.paper, marginBottom: 18 },
  resultRow: { gap: 9, marginTop: 8, alignItems: 'center' },
  tick: { ...t.d3, width: 16 },
  who: { ...t.d3, fontSize: 15, flexShrink: 0, maxWidth: 96 },
  was: { ...t.small, flex: 1, minWidth: 0, textAlign: 'right', color: color.ink },
  missed: { color: color.inkSoft },
  spacer: { flex: 1, minHeight: 20 },
});
