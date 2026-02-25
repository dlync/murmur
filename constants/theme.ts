export interface ColorPalette {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  border2: string;
  muted: string;
  dim: string;
  text: string;
  bright: string;
  accent: string;
  accentL: string;
  accentD: string;
  error: string;
  white: string;
}

export type ThemeKey = 'linen' | 'dusk' | 'sage' | 'slate' | 'parchment' | 'midnight' | 'rose' | 'forest' | 'chalk';

export const themes: Record<ThemeKey, { label: string; colors: ColorPalette }> = {
  linen: {
    label: 'Linen',
    colors: {
      bg: '#F2EFE9',
      surface: '#EAE6DE',
      surface2: '#E2DDD4',
      border: '#D4CEC4',
      border2: '#BFB8AC',
      muted: '#948E84',
      dim: '#625D56',
      text: '#2C2820',
      bright: '#1A1612',
      accent: '#5E7A8A',
      accentL: '#D4E0E6',
      accentD: '#3E5A6A',
      error: '#A05040',
      white: '#FFFFFF',
    },
  },
  dusk: {
    label: 'Dusk',
    colors: {
      bg: '#1E1B18',
      surface: '#262320',
      surface2: '#2E2A26',
      border: '#3A3530',
      border2: '#4E4840',
      muted: '#7A7268',
      dim: '#9E9488',
      text: '#D4CFC8',
      bright: '#EDE8E0',
      accent: '#C4865A',
      accentL: '#3A2A1E',
      accentD: '#E0A070',
      error: '#C06050',
      white: '#F2EFE9',
    },
  },
  sage: {
    label: 'Sage',
    colors: {
      bg: '#EEF0EB',
      surface: '#E4E8E0',
      surface2: '#D8DDD2',
      border: '#C4CCC0',
      border2: '#AAB4A8',
      muted: '#7A8A78',
      dim: '#566054',
      text: '#242E22',
      bright: '#141E12',
      accent: '#5A7A58',
      accentL: '#C8DCC8',
      accentD: '#3A5A38',
      error: '#A05040',
      white: '#FFFFFF',
    },
  },
  slate: {
    label: 'Slate',
    colors: {
      bg: '#F4F4F6',
      surface: '#EBEBEE',
      surface2: '#E0E0E4',
      border: '#CCCCD4',
      border2: '#AAAAB8',
      muted: '#80808E',
      dim: '#58586A',
      text: '#202030',
      bright: '#10101E',
      accent: '#6060A0',
      accentL: '#D4D4F0',
      accentD: '#404080',
      error: '#A04040',
      white: '#FFFFFF',
    },
  },
  parchment: {
    label: 'Parchment',
    colors: {
      bg: '#F5EDD8', surface: '#EDE4CC', surface2: '#E4D8BC',
      border: '#DDD3B8', border2: '#C8B898', muted: '#8A7050',
      dim: '#6A5438', text: '#3A2E1A', bright: '#2A1E0A',
      accent: '#B8732A', accentL: '#EDD8B0', accentD: '#8A5010',
      error: '#A04030', white: '#FDF8EE',
    },
  },
  midnight: {
    label: 'Midnight',
    colors: {
      bg: '#0D1117', surface: '#131920', surface2: '#1A2430',
      border: '#1E2D3D', border2: '#2A3D52', muted: '#8BA3C0',
      dim: '#A8C0D8', text: '#C8D8E8', bright: '#E0EEF8',
      accent: '#4A90B8', accentL: '#0E2030', accentD: '#70B8E0',
      error: '#C05050', white: '#F0F8FF',
    },
  },
  rose: {
    label: 'Rose',
    colors: {
      bg: '#FAF0EE', surface: '#F2E4E0', surface2: '#EAD8D4',
      border: '#E8D0CC', border2: '#D8B8B4', muted: '#8A5A58',
      dim: '#6A3A38', text: '#2A1A18', bright: '#1A0A08',
      accent: '#C05A5A', accentL: '#F0D0D0', accentD: '#903A3A',
      error: '#A03030', white: '#FFF8F8',
    },
  },
  forest: {
    label: 'Forest',
    colors: {
      bg: '#0F1A14', surface: '#162010', surface2: '#1C2A18',
      border: '#1E3020', border2: '#2A4028', muted: '#7A9A80',
      dim: '#9AB8A0', text: '#C8DCC0', bright: '#E0F0D8',
      accent: '#5A9A60', accentL: '#0E2014', accentD: '#80C888',
      error: '#C05040', white: '#F0FFF0',
    },
  },
  chalk: {
    label: 'Chalk',
    colors: {
      bg: '#FAFAFA', surface: '#F2F2F2', surface2: '#E8E8E8',
      border: '#E0E0E0', border2: '#CCCCCC', muted: '#888888',
      dim: '#555555', text: '#222222', bright: '#111111',
      accent: '#111111', accentL: '#E8E8E8', accentD: '#000000',
      error: '#CC3333', white: '#FFFFFF',
    },
  },
};

// Default export for backwards compatibility — components not yet
// using ThemeContext can still import `colors` and get the linen palette.
export const colors = themes.linen.colors;

export const fonts = {
  serif: 'Georgia',
  syne: 'System',
  sans: 'System',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};