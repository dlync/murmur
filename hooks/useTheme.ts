import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeKey, ColorPalette } from '../constants/theme';

const THEME_KEY = '@murmur_theme';

const VALID_KEYS = Object.keys(themes) as ThemeKey[];

export function useTheme() {
  const [themeKey, setThemeKey] = useState<ThemeKey>('linen');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (stored && VALID_KEYS.includes(stored as ThemeKey)) {
          setThemeKey(stored as ThemeKey);
        }
      })
      .catch(() => {
        // Storage unavailable — fall back to default theme
      });
  }, []);

  async function setTheme(key: ThemeKey) {
    try {
      setThemeKey(key);
      await AsyncStorage.setItem(THEME_KEY, key);
    } catch {
      // Silently ignore storage write errors
    }
  }

  // Safe fallback in case themes object is somehow undefined
  const palette = themes[themeKey]?.colors ?? themes.linen.colors;

  return {
    themeKey,
    colors: palette as ColorPalette,
    setTheme,
  };
}