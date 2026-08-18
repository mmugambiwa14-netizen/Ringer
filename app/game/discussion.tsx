import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { Button, Screen, Sticker, Text, color, type as t } from '../../src/ui';
import { useGame } from '../../src/store/gameStore';
import { haptics } from '../../src/lib/haptics';

export default function Discussion() {
  useKeepAwake();
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const total = game.config.discussionTimer;
  const [left, setLeft] = useState<number>(total);

  const toVote = () => {
    dispatch({ type: 'GO_TO_VOTE' });
    router.replace('/game/vote');
  };

  useEffect(() => {
    if (total <= 0) return;
    const id = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(id);
          haptics.warn();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [total]);

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');

  return (
    <Screen tone={color.yellow}>
      <View style={styles.body}>
        <Text style={t.label}>ARGUE ABOUT IT</Text>
        <Text style={styles.clock}>{total > 0 ? `${mm}:${ss}` : '—'}</Text>
        <Sticker tone={color.paper}>WHO SOUNDED WRONG?</Sticker>
      </View>
      <Button label="GO TO VOTE" tone={color.pink} onPress={toVote} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  clock: { ...t.d1, fontSize: 72, lineHeight: 74 },
});
