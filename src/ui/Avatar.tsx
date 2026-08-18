import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { border, color } from './tokens';
import { identityFor } from '../engine/roster';

/**
 * Auto-assigned player identity. Shape carries the identity, colour only
 * reinforces it — so a player is recognisable across a table, in a screenshot,
 * and to someone who can't tell the colours apart.
 */

const SIZES = { sm: 30, md: 42, lg: 62, xl: 132 } as const;
export type AvatarSize = keyof typeof SIZES;

const INK = color.ink;

function Glyph({ shape }: { shape: string }) {
  switch (shape) {
    case 'circle':
      return <Circle cx="20" cy="20" r="11" fill={INK} />;
    case 'triangle':
      return <Polygon points="20,8 32.5,31 7.5,31" fill={INK} />;
    case 'square':
      return <Rect x="9.5" y="9.5" width="21" height="21" fill={INK} />;
    case 'diamond':
      return <Polygon points="20,6.5 33.5,20 20,33.5 6.5,20" fill={INK} />;
    case 'star':
      return (
        <Polygon
          points="20,6 24,16 34.5,16 26,22.5 29.2,33 20,26.5 10.8,33 14,22.5 5.5,16 16,16"
          fill={INK}
        />
      );
    case 'cross':
      return <Path d="M15.5 6.5h9v9h9v9h-9v9h-9v-9h-9v-9h9z" fill={INK} />;
    case 'ring':
      return <Circle cx="20" cy="20" r="10.5" fill="none" stroke={INK} strokeWidth="7" />;
    case 'half':
      return (
        <>
          <Path d="M20 7.5a12.5 12.5 0 0 1 0 25z" fill={INK} />
          <Circle cx="20" cy="20" r="12.5" fill="none" stroke={INK} strokeWidth="3" />
        </>
      );
    case 'chevron':
      return <Path d="M10 8h9.5l10 12-10 12H10l10-12z" fill={INK} />;
    case 'hex':
      return <Polygon points="20,6 32,13 32,27 20,34 8,27 8,13" fill={INK} />;
    case 'bolt':
      return <Path d="M22 5l-11 17h7l-3 13 12-18h-7z" fill={INK} />;
    case 'drop':
      return <Path d="M20 5c7 9 10 12.5 10 17a10 10 0 0 1-20 0c0-4.5 3-8 10-17z" fill={INK} />;
    case 'arrow':
      return <Path d="M20 5l11 12h-6.5v18h-9V17H9z" fill={INK} />;
    case 'moon':
      return <Path d="M25 5a15 15 0 1 0 0 30 12 12 0 0 1 0-30z" fill={INK} />;
    case 'plus':
      return <Path d="M17 8h6v9h9v6h-9v9h-6v-9H8v-6h9z" fill={INK} />;
    case 'flag':
      return (
        <>
          <Path d="M11 5h3v30h-3z" fill={INK} />
          <Path d="M15 6h16l-4 6 4 6H15z" fill={INK} />
        </>
      );
    case 'eye':
      return (
        <>
          <Path
            d="M20 11c8 0 13 9 13 9s-5 9-13 9S7 20 7 20s5-9 13-9z"
            fill="none"
            stroke={INK}
            strokeWidth="3"
          />
          <Circle cx="20" cy="20" r="4.5" fill={INK} />
        </>
      );
    case 'wave':
      return (
        <>
          <Path
            d="M6 24c4-8 8-8 12 0s10 8 14 0"
            fill="none"
            stroke={INK}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Path
            d="M6 14c4-8 8-8 12 0s10 8 14 0"
            fill="none"
            stroke={INK}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      );
    case 'grid':
      return (
        <>
          <Rect x="8" y="8" width="10" height="10" fill={INK} />
          <Rect x="22" y="8" width="10" height="10" fill={INK} />
          <Rect x="8" y="22" width="10" height="10" fill={INK} />
          <Rect x="22" y="22" width="10" height="10" fill={INK} />
        </>
      );
    case 'key':
      return (
        <>
          <Circle cx="14" cy="15" r="7.5" fill="none" stroke={INK} strokeWidth="5" />
          <Path d="M18 20l13 13m-5 0l4 4m-8-8l4 4" fill="none" stroke={INK} strokeWidth="4.5" />
        </>
      );
    default:
      return <Circle cx="20" cy="20" r="11" fill={INK} />;
  }
}

export function Avatar({
  icon,
  size = 'md',
  label,
}: {
  icon: number;
  size?: AvatarSize;
  label?: string;
}) {
  const identity = identityFor(icon);
  const px = SIZES[size];
  const drop = size === 'sm' ? 2 : size === 'xl' ? 8 : size === 'lg' ? 5 : 3;

  return (
    <View
      accessible
      accessibilityLabel={label ?? identity.name}
      style={[
        styles.tile,
        {
          width: px,
          height: px,
          backgroundColor: identity.color,
          shadowOffset: { width: drop, height: drop },
        },
      ]}
    >
      <Svg width={px} height={px} viewBox="0 0 40 40">
        <Glyph shape={identity.shape} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: border.base,
    borderColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: color.ink,
    shadowOpacity: 1,
    shadowRadius: 0,
  },
});
