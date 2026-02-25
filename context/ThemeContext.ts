import React from "react";
import { themes } from "../constants/theme";

export interface ThemeContextValue {
  themeKey: "linen" | "dusk" | "sage" | "slate";
  colors: typeof themes.linen.colors;
  setTheme: (key: "linen" | "dusk" | "sage" | "slate") => void;
}

export const ThemeContext = React.createContext<ThemeContextValue>({
  themeKey: "linen",
  colors: themes.linen.colors,
  setTheme: () => {},
});
