'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ThemeName } from '@/lib/types';
import { defaultTheme } from '@/theme/themes';

type ThemeContextValue = { theme: ThemeName; setTheme: (theme: ThemeName) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = 'health-guide-theme';
const validThemes: ThemeName[] = ['clean', 'dark', 'warm'];

function readSavedTheme(): ThemeName {
  if (typeof window === 'undefined') return defaultTheme;
  const saved = window.localStorage.getItem(THEME_KEY) as ThemeName | null;
  return saved && validThemes.includes(saved) ? saved : defaultTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Read the saved preference during client initialization so changing locale does not
  // briefly reset the selected theme to the default theme.
  const [theme, setThemeState] = useState<ThemeName>(readSavedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeName) => {
    if (!validThemes.includes(next)) return;
    window.localStorage.setItem(THEME_KEY, next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next === 'dark' ? 'dark' : 'light';
    setThemeState(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
