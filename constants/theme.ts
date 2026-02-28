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

export type ThemeKey = 'linen' | 'sage' | 'slate' | 'parchment' | 'rose' | 'chalk' | 'ember' | 'pine' | 'noir' | 'carbon';

export const themes: Record<ThemeKey, { label: string; colors: ColorPalette }> = {

  // ── Light ─────────────────────────────────────────────────────────────────

  linen: {
    label: 'Linen',
    colors: {
      bg: '#F2EFE9', surface: '#EAE6DE', surface2: '#E2DDD4',
      border: '#D4CEC4', border2: '#BFB8AC', muted: '#948E84',
      dim: '#625D56', text: '#2C2820', bright: '#1A1612',
      accent: '#5E7A8A', accentL: '#D4E0E6', accentD: '#3E5A6A',
      error: '#A05040', white: '#FFFFFF',
    },
  },

  sage: {
    label: 'Sage',
    colors: {
      bg: '#EEF0EB', surface: '#E4E8E0', surface2: '#D8DDD2',
      border: '#C4CCC0', border2: '#AAB4A8', muted: '#7A8A78',
      dim: '#566054', text: '#242E22', bright: '#141E12',
      accent: '#5A7A58', accentL: '#C8DCC8', accentD: '#3A5A38',
      error: '#A05040', white: '#FFFFFF',
    },
  },

  slate: {
    label: 'Slate',
    colors: {
      bg: '#F4F4F6', surface: '#EBEBEE', surface2: '#E0E0E4',
      border: '#CCCCD4', border2: '#AAAAB8', muted: '#80808E',
      dim: '#58586A', text: '#202030', bright: '#10101E',
      accent: '#6060A0', accentL: '#D4D4F0', accentD: '#404080',
      error: '#A04040', white: '#FFFFFF',
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

  carbon: {
    // Dark monochrome — the inverse of Chalk
    label: 'Carbon',
    colors: {
      bg: '#0F0F0F', surface: '#171717', surface2: '#1F1F1F',
      border: '#2A2A2A', border2: '#383838', muted: '#767676',
      dim: '#AAAAAA', text: '#D8D8D8', bright: '#EEEEEE',
      accent: '#EEEEEE', accentL: '#1F1F1F', accentD: '#FFFFFF',
      error: '#CC4444', white: '#0F0F0F',
    },
  },

  // ── Dark ──────────────────────────────────────────────────────────────────

  ember: {
    // Warm dark brown — pairs with Linen & Parchment
    label: 'Ember',
    colors: {
      bg: '#1A1410', surface: '#221C16', surface2: '#2C241C',
      border: '#3A2E24', border2: '#504032', muted: '#8A7262',
      dim: '#B09080', text: '#D4C4B0', bright: '#EEE0CC',
      accent: '#C4874A', accentL: '#2E1E0E', accentD: '#E0A870',
      error: '#C05040', white: '#FDF4E8',
    },
  },

  pine: {
    // Deep forest green — pairs with Sage
    label: 'Pine',
    colors: {
      bg: '#111A12', surface: '#182018', surface2: '#1E2A1E',
      border: '#263628', border2: '#344838', muted: '#6A8A6C',
      dim: '#90AE92', text: '#C0D4C0', bright: '#DCF0DC',
      accent: '#68A86A', accentL: '#162416', accentD: '#90CC90',
      error: '#C05040', white: '#F0FFF0',
    },
  },

  noir: {
    // Near-black with dusty rose — pairs with Rose, Slate & Chalk
    label: 'Noir',
    colors: {
      bg: '#141214', surface: '#1C181C', surface2: '#241E24',
      border: '#322830', border2: '#483840', muted: '#886878',
      dim: '#AA8898', text: '#D4C0C8', bright: '#EEE0E8',
      accent: '#C07080', accentL: '#2A1820', accentD: '#E090A0',
      error: '#C04040', white: '#FFF8FA',
    },
  },

};

export const colors = themes.linen.colors;

export const fonts = {
  display: 'Fraunces_900Black',
  displayItalic: 'Fraunces_900Black_Italic',
  displayLight: 'Fraunces_300Light_Italic',
  ui: 'DMSans_400Regular',
  uiSemiBold: 'DMSans_600SemiBold',
  uiBold: 'DMSans_700Bold',
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};