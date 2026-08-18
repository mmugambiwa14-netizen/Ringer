import { StyleSheet, View, type ViewProps } from 'react-native';
import { border, color, shadow } from './tokens';

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

export function Rule() {
  return <View style={styles.rule} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.paper,
    borderWidth: border.base,
    borderColor: color.ink,
    padding: 16,
    shadowColor: color.ink,
    shadowOffset: { width: shadow.offset, height: shadow.offset },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  rule: { height: border.base, backgroundColor: color.ink },
});
