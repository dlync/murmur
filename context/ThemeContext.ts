import React from 'react';
import { ColorPalette, ThemeKey, themes } from '../constants/theme';

export interface ThemeContextValue {
  themeKey: ThemeKey;
  colors: ColorPalette;
  setTheme: (key: ThemeKey) => void;
}

export const ThemeContext = React.createContext<ThemeContextValue>({
  themeKey: 'linen',
  colors: themes.linen.colors,
  setTheme: () => {},
});