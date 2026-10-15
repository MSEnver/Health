import type { ThemeName } from '@/lib/types';
export const themes: { id: ThemeName; label: string; description: string }[] = [
  { id: 'clean', label: 'Clean & Modern', description: 'Bright, calm mint and green' },
  { id: 'dark', label: 'Dark & Elegant', description: 'Deep navy, emerald and gold' },
  { id: 'warm', label: 'Warm & Traditional', description: 'Ivory, olive and brass' }
];
export const defaultTheme: ThemeName = 'clean';
