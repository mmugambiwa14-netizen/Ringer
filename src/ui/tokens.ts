/**
 * RISO BRUTALIST — the whole design system in one file.
 * Flat ink on warm paper, thick borders, hard offset shadows, oversized caps.
 * No gradients, no blur, no glow, no alpha shadows. If a screen looks soft,
 * something has broken.
 */
export const color = {
  paper: '#F2EBDD',
  paperDeep: '#E4DAC6',
  paperStripe: '#D9CDB4',
  ink: '#141210',
  inkSoft: '#4A443C',

  blue: '#1F4BFF', // CREW — safety, information, primary action
  pink: '#FF3D9A', // RINGER — danger, reveal, destructive
  yellow: '#FFC700', // timers, warnings, highlights
  green: '#00B865', // success
  violet: '#7B4BFF', // decoy mode

  white: '#FFFFFF',
} as const;

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;
export const border = { hair: 2, base: 3, thick: 5 } as const;
export const shadow = { offset: 6, offsetLg: 10, offsetSm: 3 } as const;
export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64] as const;

export const font = {
  display: 'ArchivoBlack_400Regular',
  body: 'Archivo_600SemiBold',
  bodyBold: 'Archivo_800ExtraBold',
  mono: 'SpaceMono_700Bold',
} as const;

export const type = {
  d1: { fontFamily: font.display, fontSize: 56, lineHeight: 52, letterSpacing: -1.6 },
  d2: { fontFamily: font.display, fontSize: 38, lineHeight: 38, letterSpacing: -1 },
  d3: { fontFamily: font.display, fontSize: 23, lineHeight: 24, letterSpacing: -0.4 },
  word: { fontFamily: font.display, fontSize: 48, lineHeight: 48, letterSpacing: -1.4 },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: font.body, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: font.mono, fontSize: 11, letterSpacing: 2 },
  tiny: { fontFamily: font.mono, fontSize: 9.5, letterSpacing: 1.4 },
} as const;

/**
 * Contrast is checked, not assumed. White on pink is only 3.4:1, so pink
 * surfaces take ink text at any size below the display sizes.
 */
export function onColor(background: string): string {
  return background === color.blue || background === color.violet ? color.white : color.ink;
}

export const motion = {
  press: 90,
  enter: 140,
  shutterClose: 150,
  stamp: 200,
} as const;
