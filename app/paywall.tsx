import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
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
} from '../src/ui';
import { useEntitlement } from '../src/store/entitlementStore';
import { storePriceLabel } from '../src/lib/purchases';
import { FREE_WORDS, PACKS, TOTAL_WORDS } from '../src/data/packs';
import { UNLOCK_PRICE_FALLBACK, UNLOCK_PRODUCT_ID } from '../src/config';
import { haptics } from '../src/lib/haptics';
import { playSfx } from '../src/lib/sound';

const PAID_PACKS = PACKS.filter((p) => !p.isFree).length;

export default function Paywall() {
  const unlocked = useEntitlement((s) => s.unlocked);
  const busy = useEntitlement((s) => s.busy);
  const purchase = useEntitlement((s) => s.purchase);
  const restore = useEntitlement((s) => s.restore);
  const [price, setPrice] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // The store's own localised price, so nobody is quoted dollars in Lagos.
  // Falls back to the constant if the store never answers.
  useEffect(() => {
    let alive = true;
    void storePriceLabel(UNLOCK_PRODUCT_ID).then((p) => {
      if (alive && p) setPrice(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  const report = (result: string) => {
    if (result === 'owned') {
      haptics.success();
      playSfx('win');
      router.back();
      return;
    }
    setMessage(
      result === 'unavailable'
        ? 'The store is not reachable right now. Nothing has been charged.'
        : result === 'failed'
          ? 'That did not go through. Nothing has been charged.'
          : null, // 'declined' — they backed out on purpose; saying so is nagging
    );
  };

  return (
    <Screen tone={color.yellow} scroll>
      <Row style={styles.bar}>
        <Sticker tone={color.paper}>ONE PAYMENT</Sticker>
      </Row>

      <Text style={styles.title}>
        EVERY{'\n'}PACK{'\n'}FOREVER
      </Text>

      <Card style={styles.card}>
        <Text style={t.label}>YOU HAVE</Text>
        <Text style={styles.line}>{FREE_WORDS} words across the three free packs</Text>
        <Rule />
        <Text style={[t.label, styles.spaced]}>YOU GET</Text>
        <Text style={styles.line}>
          All {TOTAL_WORDS} words — {PAID_PACKS} more packs, every one hand-paired and checked
        </Text>
        <Text style={styles.line}>No subscription. No ads. No account.</Text>
        <Text style={styles.line}>Bought once, on this store account, on every device you own</Text>
      </Card>

      {unlocked ? (
        <>
          <Sticker tone={color.green}>ALREADY UNLOCKED</Sticker>
          <View style={styles.spacer} />
          <Button label="BACK TO THE GAME" onPress={() => router.back()} />
        </>
      ) : (
        <>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.spacer} />
          <Button
            label={busy ? 'ONE MOMENT…' : `UNLOCK EVERYTHING — ${price ?? UNLOCK_PRICE_FALLBACK}`}
            tone={color.pink}
            disabled={busy}
            onPress={() => void purchase().then(report)}
          />
          <GhostButton
            label="RESTORE A PREVIOUS PURCHASE"
            onPress={() => void restore().then(report)}
          />
        </>
      )}
      <GhostButton label="NOT NOW" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { marginBottom: 14 },
  title: { ...t.d1, color: onColor(color.yellow), marginBottom: 18 },
  card: {},
  line: { ...t.small, color: color.ink, marginTop: 6 },
  spaced: { marginTop: 12 },
  spacer: { flex: 1, minHeight: 18 },
  message: { ...t.small, color: color.ink, marginTop: 14, textAlign: 'center' },
});
