import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ColorThemeId = "blue" | "purple" | "emerald" | "crimson" | "pink";

interface ColorThemePreset {
  id: ColorThemeId;
  label: string;
  swatch: string; // CSS color for the swatch circle
  vars: Record<string, string>;
}

// Each preset overrides only color-related tokens. Layout, glass, shadows,
// surfaces and dark mode remain untouched.
export const COLOR_THEMES: ColorThemePreset[] = [
  {
    id: "blue",
    label: "Azul Nexvior",
    swatch: "hsl(224 95% 64%)",
    vars: {
      "--primary": "224 95% 64%",
      "--primary-glow": "230 100% 70%",
      "--ring": "224 95% 64%",
      "--accent": "230 80% 60%",
      "--shadow-glow": "0 0 40px hsl(224 95% 64% / 0.4)",
      "--gradient-primary": "linear-gradient(135deg, hsl(224 95% 64%), hsl(245 90% 65%))",
      "--gradient-portfolio":
        "linear-gradient(135deg, hsl(230 70% 35%), hsl(250 60% 40%) 60%, hsl(225 80% 50%))",
      "--gradient-blob":
        "radial-gradient(circle at 30% 30%, hsl(224 90% 70% / 0.6), hsl(260 80% 50% / 0.3) 60%, transparent 80%)",
    },
  },
  {
    id: "purple",
    label: "Roxo Neon",
    swatch: "hsl(270 90% 65%)",
    vars: {
      "--primary": "270 90% 65%",
      "--primary-glow": "280 100% 72%",
      "--ring": "270 90% 65%",
      "--accent": "285 85% 62%",
      "--shadow-glow": "0 0 40px hsl(270 90% 65% / 0.45)",
      "--gradient-primary": "linear-gradient(135deg, hsl(270 90% 65%), hsl(295 85% 65%))",
      "--gradient-portfolio":
        "linear-gradient(135deg, hsl(270 70% 35%), hsl(290 60% 42%) 60%, hsl(280 80% 55%))",
      "--gradient-blob":
        "radial-gradient(circle at 30% 30%, hsl(275 90% 72% / 0.6), hsl(300 80% 55% / 0.3) 60%, transparent 80%)",
    },
  },
  {
    id: "emerald",
    label: "Verde Emerald",
    swatch: "hsl(152 75% 50%)",
    vars: {
      "--primary": "152 75% 50%",
      "--primary-glow": "160 85% 58%",
      "--ring": "152 75% 50%",
      "--accent": "168 70% 48%",
      "--shadow-glow": "0 0 40px hsl(152 75% 50% / 0.45)",
      "--gradient-primary": "linear-gradient(135deg, hsl(152 75% 50%), hsl(172 75% 52%))",
      "--gradient-portfolio":
        "linear-gradient(135deg, hsl(152 60% 28%), hsl(170 55% 35%) 60%, hsl(160 75% 45%))",
      "--gradient-blob":
        "radial-gradient(circle at 30% 30%, hsl(155 85% 60% / 0.55), hsl(180 70% 45% / 0.3) 60%, transparent 80%)",
    },
  },
  {
    id: "crimson",
    label: "Vermelho Crimson",
    swatch: "hsl(350 85% 58%)",
    vars: {
      "--primary": "350 85% 58%",
      "--primary-glow": "355 95% 66%",
      "--ring": "350 85% 58%",
      "--accent": "10 85% 60%",
      "--shadow-glow": "0 0 40px hsl(350 85% 58% / 0.45)",
      "--gradient-primary": "linear-gradient(135deg, hsl(350 85% 58%), hsl(15 90% 60%))",
      "--gradient-portfolio":
        "linear-gradient(135deg, hsl(350 70% 32%), hsl(10 65% 40%) 60%, hsl(355 80% 52%))",
      "--gradient-blob":
        "radial-gradient(circle at 30% 30%, hsl(352 90% 68% / 0.55), hsl(20 80% 55% / 0.3) 60%, transparent 80%)",
    },
  },
  {
    id: "pink",
    label: "Rosa Neon",
    swatch: "hsl(325 90% 65%)",
    vars: {
      "--primary": "325 90% 65%",
      "--primary-glow": "320 100% 72%",
      "--ring": "325 90% 65%",
      "--accent": "310 85% 62%",
      "--shadow-glow": "0 0 40px hsl(325 90% 65% / 0.45)",
      "--gradient-primary": "linear-gradient(135deg, hsl(325 90% 65%), hsl(295 85% 65%))",
      "--gradient-portfolio":
        "linear-gradient(135deg, hsl(325 70% 35%), hsl(300 60% 42%) 60%, hsl(315 80% 55%))",
      "--gradient-blob":
        "radial-gradient(circle at 30% 30%, hsl(325 90% 72% / 0.6), hsl(300 80% 55% / 0.3) 60%, transparent 80%)",
    },
  },
];

const STORAGE_KEY = "nexvior:color-theme";
const DEFAULT_ID: ColorThemeId = "blue";

interface Ctx {
  colorTheme: ColorThemeId;
  setColorTheme: (id: ColorThemeId) => void;
  presets: ColorThemePreset[];
}

const ColorThemeContext = createContext<Ctx | undefined>(undefined);

const applyTheme = (id: ColorThemeId) => {
  const preset = COLOR_THEMES.find((p) => p.id === id) ?? COLOR_THEMES[0];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(preset.vars)) {
    root.style.setProperty(k, v);
  }
  root.setAttribute("data-color-theme", preset.id);
};

export const ColorThemeProvider = ({ children }: { children: ReactNode }) => {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(() => {
    if (typeof window === "undefined") return DEFAULT_ID;
    const saved = localStorage.getItem(STORAGE_KEY) as ColorThemeId | null;
    return saved && COLOR_THEMES.some((p) => p.id === saved) ? saved : DEFAULT_ID;
  });

  useEffect(() => {
    applyTheme(colorTheme);
    localStorage.setItem(STORAGE_KEY, colorTheme);
  }, [colorTheme]);

  return (
    <ColorThemeContext.Provider
      value={{ colorTheme, setColorTheme: setColorThemeState, presets: COLOR_THEMES }}
    >
      {children}
    </ColorThemeContext.Provider>
  );
};

export const useColorTheme = () => {
  const ctx = useContext(ColorThemeContext);
  if (!ctx) throw new Error("useColorTheme must be used within ColorThemeProvider");
  return ctx;
};
