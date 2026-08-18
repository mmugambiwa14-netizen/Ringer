import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar,
  Button,
  GhostButton,
  Row,
  Screen,
  Sticker,
  Text,
  color,
  type as t,
} from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { displayName } from '../../src/engine/roster';
import { packsForGame } from '../../src/data/packs';

const IDENTITIES = packsForGame('whoami').reduce((n, p) => n + p.words.length, 0);

export default function WhoAmISetup() {
  const players = useGame((s) => s.game.players);
  const ready = players.length >= 2;

  return (
    <Screen tone={color.blue} scroll>
      <Row style={styles.bar}>
        <Sticker tone={color.paper}>EVERYONE BUT YOU CAN SEE IT</Sticker>
      </Row>
      <Text style={styles.title}>WHO{'\n'}AM I?</Text>
      <Text style={styles.blurb}>
        Hold the phone up facing the table. Everyone else can read who you are — you cannot. Ask
        yes/no questions until you work it out. {IDENTITIES} identities, none of them a celebrity
        only one country has heard of.
      </Text>

      <View style={styles.list}>
        {players.map((p) => (
          <View key={p.id} style={styles.chip}>
            <Avatar icon={p.icon} size="sm" />
            <Text style={styles.chipName} numberOfLines={1}>
              {displayName(p)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.spacer} />
      {ready ? (
        <Button
          label="DEAL IDENTITIES"
          tone={color.pink}
          onPress={() => router.push('/whoami/play')}
        />
      ) : (
        <Button
          label="ADD SOME PLAYERS"
          tone={color.pink}
          onPress={() => router.push('/setup/players?next=/whoami/play')}
        />
      )}
      <GhostButton
        label={ready ? 'CHANGE THE PLAYERS' : 'BACK'}
        onPress={() => (ready ? router.push('/setup/players?next=/whoami/play') : router.back())}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 14 },
  title: { ...t.d1, color: color.paper, marginBottom: 12 },
  blurb: { ...t.body, color: color.paper, marginBottom: 20 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 3,
    borderColor: color.ink,
    backgroundColor: color.paper,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipName: { ...t.d3, fontSize: 15, maxWidth: 120 },
  spacer: { flex: 1, minHeight: 24 },
});
