import { Text as RNText, type TextProps } from 'react-native';
import { color } from './tokens';

/** Wraps RN Text so a missing font never renders invisible on ink surfaces. */
export function Text({ style, ...rest }: TextProps) {
  return <RNText allowFontScaling style={[{ color: color.ink }, style]} {...rest} />;
}
