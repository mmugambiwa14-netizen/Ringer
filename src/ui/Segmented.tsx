import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { border, color, type as t } from './tokens';
import { haptics } from '../lib/haptics';

export interface Option<T> {
  value: T;
  label: string;
}

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  note,
}: {
  label: string;
  options: readonly Option<T>[];
  /** Widened on purpose: a config union may be broader than the options shown. */
  value: string | number | boolean;
  onChange: (v: T) => void;
  note?: string;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.seg}>
        {options.map((o, i) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => {
                haptics.tap();
                onChange(o.value);
              }}
              style={[
                styles.opt,
                i < options.length - 1 && styles.divider,
                on && { backgroundColor: color.ink },
              ]}
            >
              <Text style={[styles.optLabel, on && { color: color.paper }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...t.label, marginBottom: 7 },
  seg: {
    flexDirection: 'row',
    borderWidth: border.base,
    borderColor: color.ink,
    backgroundColor: color.paper,
    overflow: 'hidden',
    shadowColor: color.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  opt: { flex: 1, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  divider: { borderRightWidth: border.base, borderRightColor: color.ink },
  optLabel: { ...t.label, fontSize: 11, textAlign: 'center' },
  note: { ...t.small, color: color.inkSoft, marginTop: 8 },
});
