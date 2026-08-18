import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useRedirectWhen } from '../../src/lib/navigation';
import {
  Avatar,
  Button,
  GhostButton,
  Row,
  Screen,
  Sticker,
  Text,
  border,
  color,
  shadow,
  type as t,
} from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { displayName } from '../../src/engine/roster';
import { guessIsNearMiss } from '../../src/engine/guess';

export default function Guess() {
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const [text, setText] = useState('');
  const round = game.round;
  const caught = game.players.find((p) => p.id === round?.accusedId);

  useRedirectWhen(!round || !caught, '/');
  if (!round || !caught) return null;

  const nearMiss = text.length > 0 && guessIsNearMiss(text, round.word);

  return (
    <Screen tone={color.pink}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Row style={styles.bar}>
          <Sticker tone={color.paper}>CAUGHT</Sticker>
        </Row>

        <View style={styles.flex}>
          <Row style={styles.who}>
            <Avatar icon={caught.icon} size="lg" />
            <Text style={styles.title}>
              {displayName(caught)} WAS{'\n'}THE RINGER
            </Text>
          </Row>
          <Text style={styles.body}>
            One guess at the secret word. Get it right and you steal the round.
          </Text>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="TYPE IT"
            placeholderTextColor={color.inkSoft}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            style={styles.input}
            onSubmitEditing={() => dispatch({ type: 'SUBMIT_GUESS', guess: text })}
          />
          {nearMiss ? (
            <Text style={styles.near}>CLOSE. THE TABLE DECIDES IF THAT COUNTS.</Text>
          ) : null}
        </View>

        <Button
          label="LOCK IT IN"
          disabled={text.trim().length === 0}
          onPress={() => {
            dispatch({ type: 'SUBMIT_GUESS', guess: text });
            router.replace('/game/result');
          }}
        />
        <GhostButton
          label="GIVE UP"
          onPress={() => {
            dispatch({ type: 'SKIP_GUESS' });
            router.replace('/game/result');
          }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { marginBottom: 16 },
  who: { gap: 12 },
  title: { ...t.d2, flex: 1 },
  body: { ...t.body, marginTop: 12, color: color.ink },
  input: {
    marginTop: 18,
    borderWidth: border.base,
    borderColor: color.ink,
    backgroundColor: color.paper,
    paddingHorizontal: 14,
    paddingVertical: 16,
    ...t.d2,
    fontSize: 26,
    color: color.ink,
    shadowColor: color.ink,
    shadowOffset: { width: shadow.offset, height: shadow.offset },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  near: { ...t.tiny, marginTop: 10, color: color.ink },
});
