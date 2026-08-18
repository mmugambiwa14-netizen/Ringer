import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, Sticker, Text, color, type as t } from '../src/ui';

export default function NotFound() {
  return (
    <Screen tone={color.yellow}>
      <View style={styles.body}>
        <Sticker tone={color.paper}>WRONG TURN</Sticker>
        <Text style={styles.title}>NOT{'\n'}HERE</Text>
        <Text style={styles.body2}>That screen doesn&rsquo;t exist. Nothing is broken.</Text>
      </View>
      <Button label="BACK TO START" onPress={() => router.replace('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { ...t.d1, textAlign: 'center' },
  body2: { ...t.body, textAlign: 'center', color: color.ink },
});
