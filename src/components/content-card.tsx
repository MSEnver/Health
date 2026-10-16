'use client';
import { Bookmark, BookOpen, Clock3 } from 'lucide-react';
import type { HealthNote } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { getLocaleConfig } from '@/lib/locale';
export function ContentCard({ note, locale, favorite, onFavorite, onOpen }: { note: HealthNote; locale: string; favorite: boolean; onFavorite: (id: string) => void; onOpen: (note: HealthNote) => void }) {
  const t = useTranslations();
  const direction = getLocaleConfig(locale).dir;
  const title = note.localized?.[locale]?.title || (locale === 'ur' ? (note.displayTitle || note.title) : note.title);
  const summary = note.localized?.[locale]?.description || (locale === 'ur' ? (note.urdu || note.urduText || note.description || '') : (note.description || note.body || note.englishDescription || ''));
  return <article className="content-card" dir={direction}><div className={`article-art art-${note.category.toLowerCase()}`}><span>{(note.categoryLabel || t(`categories.${note.category}` as 'categories.Names'))}</span><BookOpen size={34}/></div><div className="content-card-body"><div className="article-meta"><span>{(note.categoryLabel || t(`categories.${note.category}` as 'categories.Names'))}</span><span><Clock3 size={13}/> {t('quick.sittingLabel')} {note.sitting.replace(/^Sitting\s*/i, '')}</span></div><h3>{title}</h3><p dir={direction}>{summary}</p><div className="card-actions"><button className="text-action" onClick={() => onOpen(note)} type="button">{t('sections.readMore')} <span aria-hidden="true">→</span></button><button className={`icon-button ${favorite ? 'is-favorite' : ''}`} aria-label={favorite ? t('detail.unbookmark') : t('detail.bookmark')} title={favorite ? t('detail.unbookmark') : t('detail.bookmark')} onClick={() => onFavorite(note.id)} type="button"><Bookmark size={17} fill={favorite ? 'currentColor' : 'none'}/></button></div></div></article>;
}
