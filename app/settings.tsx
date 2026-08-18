import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Button, Row, Screen, Segmented, Text, color, type as t } from '../src/ui';
import { usePrefs } from '../src/store/prefsStore';
import { useGame } from '../src/store/gameStore';
import { ROSTER } from '../src/engine/roster';
import { APP_NAME, APP_VERSION } from '../src/config';

export default function Settings() {
  const prefs = usePrefs();
  const config = useGame((s) => s.game.config);
  const dispatch = useGame((s) => s.dispatch);

  return (
    <Screen scroll>
      <Row style={styles.bar}>
        <Text style={t.d3}>SETTINGS</Text>
      </Row>

      <View style={styles.stack}>
        <View>
          <Text style={styles.label}>PLAYER ICONS</Text>
          <Text style={styles.note}>
            Every player is given a shape and a colour the moment they join. Nobody has to choose,
            and nobody ends up as &ldquo;Player 4&rdquo;.
          </Text>
          <View style={styles.icons}>
            {ROSTER.map((_, i) => (
              <Avatar key={i} icon={i} size="sm" />
            ))}
          </View>
        </View>

        <Segmented
          label="REVEAL STYLE"
          value={prefs.revealStyle}
          note={
            prefs.revealStyle === 'colour'
              ? 'Role floods the card in colour. Looks best — but a glance across the table gives it away.'
              : 'Neutral card for everyone, role stated in words. Safer at a crowded table.'
          }
          onChange={(revealStyle) => prefs.set({ revealStyle })}
          options={[
            { value: 'colour', label: 'FULL COLOUR' },
            { value: 'plain', label: 'PLAIN' },
          ]}
        />

        <Segmented
          label="FAIR DEAL"
          value={config.fairDeal ? 'on' : 'off'}
          note="Weights the draw away from whoever was ringer last, so nobody gets it three times running."
          onChange={(v) => dispatch({ type: 'SET_CONFIG', patch: { fairDeal: v === 'on' } })}
          options={[
            { value: 'on', label: 'ON' },
            { value: 'off', label: 'OFF' },
          ]}
        />

        <Segmented
          label="18+ PACK"
          value={prefs.adultUnlocked ? 'on' : 'off'}
          note="Adult party humour — exes, hangovers, the morning after. Off by default; turning it on is a decision about who you hand the phone to."
          onChange={(v) => prefs.set({ adultUnlocked: v === 'on' })}
          options={[
            { value: 'off', label: 'HIDDEN' },
            { value: 'on', label: 'SHOW IT' },
          ]}
        />

        <Segmented
          label="SOUND"
          value={prefs.sound ? 'on' : 'off'}
          note="Card riffles, wood-block turn ticks and a stamp on the result. Respects your phone's silent switch either way."
          onChange={(v) => prefs.set({ sound: v === 'on' })}
          options={[
            { value: 'on', label: 'ON' },
            { value: 'off', label: 'OFF' },
          ]}
        />

        <Segmented
          label="HAPTICS"
          value={prefs.haptics ? 'on' : 'off'}
          onChange={(v) => prefs.set({ haptics: v === 'on' })}
          options={[
            { value: 'on', label: 'ON' },
            { value: 'off', label: 'OFF' },
          ]}
        />

        <Segmented
          label="ANONYMOUS STATS"
          value={prefs.analytics ? 'on' : 'off'}
          note="Counts like how many rounds a group plays. No names, no words you saw, no device identifiers, nothing shared with anyone. Off unless you switch it on, and the game works identically either way."
          onChange={(v) => prefs.set({ analytics: v === 'on' })}
          options={[
            { value: 'off', label: 'OFF' },
            { value: 'on', label: 'ON' },
          ]}
        />
      </View>

      <View style={styles.spacer} />
      <Text style={styles.version}>{`${APP_NAME} v${APP_VERSION}`}</Text>
      <Button label="DONE" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 16 },
  stack: { gap: 20 },
  label: { ...t.label, marginBottom: 7 },
  note: { ...t.small, color: color.inkSoft },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  spacer: { flex: 1, minHeight: 20 },
  version: { ...t.tiny, color: color.inkSoft, textAlign: 'center', marginBottom: 12 },
});
