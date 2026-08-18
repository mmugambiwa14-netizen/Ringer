import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from './Text';
import { color, font } from './tokens';

const SIZE = 180;
const R = 78;
const C = 2 * Math.PI * R;

/** Counts down and calls onExpire once. Pass seconds = 0 to hide it. */
export function TimerRing({ seconds, onExpire }: { seconds: number; onExpire?: () => void }) {
  const [left, setLeft] = useState(seconds);

  // Held in a ref, and deliberately out of the effect's deps: every caller
  // passes an inline arrow, so depending on it would tear down and restart the
  // countdown — resetting it to full — on each parent render.
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setLeft(seconds);
    if (seconds <= 0) return;
    const id = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  // Expiry fires from an effect rather than from inside the state updater.
  // React may invoke an updater more than once, and this one buzzes the phone
  // and plays a sound.
  useEffect(() => {
    if (seconds > 0 && left === 0) onExpireRef.current?.();
  }, [left, seconds]);

  if (seconds <= 0) return null;
  const pct = left / seconds;
  const urgent = left <= 5;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R + 8}
          stroke={color.ink}
          strokeWidth={3}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={urgent ? color.pink : color.yellow}
          strokeWidth={16}
          fill="none"
          strokeDasharray={`${C}`}
          strokeDashoffset={C * (1 - pct)}
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R - 8}
          stroke={color.ink}
          strokeWidth={3}
          fill="none"
        />
      </Svg>
      <View style={styles.numWrap} pointerEvents="none">
        <Text style={styles.num}>{left}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignSelf: 'center' },
  svg: { transform: [{ rotate: '-90deg' }] },
  numWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: font.display, fontSize: 54, color: color.ink },
});
