'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ThemeName } from '@/lib/types';
import { defaultTheme } from '@/theme/themes';
type ThemeContextValue = { theme: ThemeName; setTheme: (theme: ThemeName) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme);
  useEffect(() => {
    const saved = window.localStorage.getItem('health-guide-theme') as ThemeName | null;
    if (saved && ['clean', 'dark', 'warm'].includes(saved)) setThemeState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('health-guide-theme', theme);
  }, [theme]);
  const setTheme = useCallback((next: ThemeName) => setThemeState(next), []);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
