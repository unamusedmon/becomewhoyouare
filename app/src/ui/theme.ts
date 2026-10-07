import { Platform } from 'react-native';

/** "Sils-Maria at dusk": near-black, off-white ink, one warm accent. No red anywhere time-related. */
export const colors = {
  bg: '#0F0E0D',
  surface: '#1A1917',
  line: '#2A2825',
  ink: '#EDE8DF',
  muted: '#8E887E',
  faint: '#5C5850',
  accent: '#D9A441',
  /** The only saturated moment in the UI, so it actually lands. */
  win: '#F2C14E',
};

export const fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui, -apple-system, sans-serif' }),
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 };
