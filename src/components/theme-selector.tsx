'use client';
import { Palette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { themes } from '@/theme/themes';
import { useTheme } from './theme-provider';
export function ThemeSelector() {
  const t = useTranslations('themes'); const { theme, setTheme } = useTheme();
  return <label className="theme-control" aria-label={t('label')}><Palette size={16}/><span className="sr-only">{t('label')}</span><select value={theme} onChange={e => setTheme(e.target.value as typeof theme)} aria-label={t('label')}>
    {themes.map(item => <option key={item.id} value={item.id}>{t(item.id)}</option>)}
  </select></label>;
}
