import { Platform } from 'react-native';

export const Colors = {
  background: '#f7f5f0',
  surfaceBorder: '#2b2b2b',
  divider: '#e4ddcf',
  text: '#2b2b2b',
  textMuted: '#5a5a5a',
  textFaint: '#8a8a8a',
  placeholder: '#aaaaaa',
  accent: '#c1592f',
  accentSurface: '#fbe9e1',
  avatarTints: ['#f0d9c8', '#d9e4d3', '#ded4e8'] as const,
} as const;

export const Fonts = Platform.select({
  default: { body: 'System' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 10,
  large: 12,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
