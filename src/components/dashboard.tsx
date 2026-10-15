'use client';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, HeartPulse, Leaf, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { HealthNote } from '@/lib/types';
import notesEn from '../../data/health.en.json';
import notesUr from '../../data/health.ur.json';
import { ContentCard } from './content-card';
const featuredIds = ['h-1', 'h-2', 'sp-1', 'hom-1', 'j-1', 'c-3'];
export function Dashboard() {
  const locale = useLocale(); const t = useTranslations();
  const source = (locale === 'ur' ? notesUr : notesEn) as HealthNote[];
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('all'); const [sitting, setSitting] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]); const [showFavorites, setShowFavorites] = useState(false); const [selected, setSelected] = useState<HealthNote | null>(null);
  const [stateLoaded, setStateLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('health-guide-view-state');
      if (saved) {
        const state = JSON.parse(saved) as { query?: string; category?: string; sitting?: string; showFavorites?: boolean; favorites?: string[] };
        if (typeof state.query === 'string') setQuery(state.query);
        if (typeof state.category === 'string') setCategory(state.category);
        if (typeof state.sitting === 'string') setSitting(state.sitting);
        if (typeof state.showFavorites === 'boolean') setShowFavorites(state.showFavorites);
        if (Array.isArray(state.favorites)) setFavorites(state.favorites.filter((id): id is string => typeof id === 'string'));
      }
    } catch {
      sessionStorage.removeItem('health-guide-view-state');
    }
    setStateLoaded(true);
  }, []);
  useEffect(() => {
    if (!stateLoaded) return;
    sessionStorage.setItem('health-guide-view-state', JSON.stringify({ query, category, sitting, showFavorites, favorites }));
  }, [stateLoaded, query, category, sitting, showFavorites, favorites]);
  const categories = useMemo(() => [...new Set(source.map(n => n.category))], [source]);
  const sittings = useMemo(() => [...new Set(source.map(n => n.sitting))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [source]);
  const visible = useMemo(() => source.filter(n => {
    const q = query.trim().toLocaleLowerCase();
    const matchText = !q || [n.title, n.description, n.body, n.urdu, n.urduText, n.englishDescription, ...(n.tags || [])].some(v => v?.toLocaleLowerCase().includes(q));
    return matchText && (category === 'all' || n.category === category) && (sitting === 'all' || n.sitting === sitting) && (!showFavorites || favorites.includes(n.id));
  }), [source, query, category, sitting, showFavorites, favorites]);
  const favoriteToggle = (id: string) => setFavorites(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const titleFor = (note: HealthNote) => note.displayTitle || note.title;
  const summaryFor = (note: HealthNote) => note.localized?.[locale]?.description || (locale === 'ur' ? note.urdu || note.urduText || note.description || '' : note.description || note.body || note.englishDescription || '');
  return <>
    <section className="hero-section" id="home"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/>{t('hero.eyebrow')}</div><h1>{t('hero.title').split('\n').map((line, i) => <span key={line}>{i > 0 && <br/>}{line}</span>)}</h1><p>{t('hero.description')}</p><div className="hero-tags">{['Hair','Joints','Cardiovascular','Respiratory','Spiritual','Homeopathy'].map(id => <button key={id} onClick={() => { setCategory(id); setShowFavorites(false); document.getElementById('archive')?.scrollIntoView({behavior:'smooth'}); }}>{t(`categories.${id}` as 'categories.Names')}</button>)}</div></div><div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="hero-plant"><Leaf size={100} strokeWidth={1.15}/><Leaf size={70} strokeWidth={1.15}/></div><div className="hero-note"><HeartPulse size={17}/><span>{t('hero.knowledgeLabel')}</span></div></div><form className="hero-search" onSubmit={e => { e.preventDefault(); setShowFavorites(false); document.getElementById('archive')?.scrollIntoView({behavior:'smooth'}); }}><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('hero.searchPlaceholder')} aria-label={t('hero.searchPlaceholder')}/>{query && <button type="button" className="clear-search" onClick={() => setQuery('')} aria-label={t('sections.clearSearch')}><X size={16}/></button>}<button className="search-submit" type="submit">{t('hero.search')}</button></form></section>
    <section className="section-block archive-section" id="archive"><div className="section-heading"><div><span className="section-kicker">{t('sections.libraryKicker')}</span><h2>{showFavorites ? t('nav.favorites') : t('sections.articles')}</h2><p className="section-subtitle">{t('sections.showing')} {visible.length} {t('sections.of')} {source.length} {t('sections.entries')}</p></div><button className={`outline-button ${showFavorites ? 'active' : ''}`} type="button" onClick={() => setShowFavorites(v => !v)}><HeartPulse size={16}/>{t('quick.favorites')} <span className="favorite-count">{favorites.length}</span></button></div>
      <div className="filters-row"><div className="filter-pills"><button className={category === 'all' ? 'selected' : ''} onClick={() => setCategory('all')}>{t('sections.all')}</button>{categories.map(id => <button className={category === id ? 'selected' : ''} key={id} onClick={() => setCategory(id)}>{t(`categories.${id}` as 'categories.Names')}</button>)}</div><select className="sitting-select" value={sitting} onChange={e => setSitting(e.target.value)} aria-label={t('detail.sitting')}><option value="all">{t('quick.sittings')}: {t('sections.all')}</option>{sittings.map(s => <option key={s} value={s}>{t('quick.sittingLabel')} {s.replace(/^Sitting\s*/i, '')}</option>)}</select></div>
      {visible.length ? <div className="article-grid">{visible.map(n => <ContentCard key={n.id} note={n} locale={locale} favorite={favorites.includes(n.id)} onFavorite={favoriteToggle} onOpen={setSelected}/>)}</div> : <div className="empty-state"><Search size={28}/><p>{t('sections.noResults')}</p><button className="outline-button" onClick={() => { setQuery(''); setCategory('all'); setSitting('all'); setShowFavorites(false); }}>{t('sections.all')}</button></div>}
    </section>
    
    
    <footer className="site-footer"><div className="footer-brand"><span className="brand-mark"><Leaf size={22}/></span><strong>{t('brand.name')}</strong></div><p>{t('footer.notice')}</p><span>© {new Date().getFullYear()} HealthGuide · Archive edition</span></footer>
    {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={e => e.stopPropagation()}><div className="modal-topline"><span>{t(`categories.${selected.category}` as never)}</span><button className="icon-button" onClick={() => setSelected(null)} aria-label={t('detail.close')}><X size={20}/></button></div><h2 id="detail-title" dir={locale === 'ur' ? 'rtl' : 'auto'}>{titleFor(selected)}</h2><div className="detail-meta"><span>{t('quick.sittingLabel')} {selected.sitting.replace(/^Sitting\s*/i, '')}</span>{selected.date && <span>{selected.date}</span>}</div><p className="detail-body" dir={locale === 'ur' ? 'rtl' : 'auto'}>{summaryFor(selected)}</p>{selected.spiritualGoal && <div className="detail-callout"><strong>{t('sections.purpose')}</strong><p>{selected.localized?.[locale]?.spiritualGoal || selected.spiritualGoal}</p></div>}{selected.nameDetails && <dl className="name-details">{Object.entries(selected.nameDetails).filter(([,v])=>v !== undefined).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>)}</dl>}{(selected.localized?.[locale]?.body || (locale === 'ur' ? selected.body : selected.body)) && (selected.localized?.[locale]?.body || selected.body) !== summaryFor(selected) && <p className="detail-body" dir={['ur','ps','pa-Arab','skr','sd'].includes(locale) ? 'rtl' : 'auto'}>{selected.localized?.[locale]?.body || selected.body}</p>}<div className="health-disclaimer"><strong>{t('detail.medicalNotice')}</strong><p>{t('detail.medicalNoticeText')}</p></div><button className="search-submit modal-save" onClick={() => favoriteToggle(selected.id)}><HeartPulse size={16}/>{favorites.includes(selected.id) ? t('detail.unbookmark') : t('detail.bookmark')}</button></section></div>}
  </>;
}
