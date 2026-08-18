import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Row, Screen, Sticker, Text, color, type as t } from '../src/ui';

const STEPS = [
  [
    '01',
    'SLIDE UP TO LOOK',
    'Slide the card up to see the secret word. Let go and it shuts instantly. One of you sees something else.',
    color.blue,
  ],
  [
    '02',
    'GIVE ONE CLUE',
    'Take turns, one word each. Too obvious and the ringer works it out. Too vague and you look guilty.',
    color.blue,
  ],
  ['03', 'ARGUE, THEN VOTE', 'Point at whoever sounded wrong.', color.blue],
  [
    '04',
    'THE STEAL',
    'Catch the ringer and they get one guess at the word. Right answer, they win anyway.',
    color.pink,
  ],
] as const;

export default function HowToPlay() {
  return (
    <Screen scroll>
      <Row style={styles.bar}>
        <Text style={t.d3}>HOW TO PLAY</Text>
      </Row>
      <View style={styles.list}>
        {STEPS.map(([n, title, body, tone]) => (
          <Card key={n}>
            <Sticker tone={tone}>{n}</Sticker>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </Card>
        ))}
      </View>
      <Button label="GOT IT" onPress={() => router.back()} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 16 },
  list: { gap: 12, flex: 1 },
  title: { ...t.d3, marginTop: 10, marginBottom: 6 },
  body: { ...t.body, color: color.inkSoft },
  cta: { marginTop: 16 },
});
