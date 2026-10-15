import { BookOpenText, HeartPulse, Leaf } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ThemeSelector } from './theme-selector';
import { LanguageSwitcher } from './language-switcher';
export function Header() {
  const t = useTranslations();
  return <header className="site-header"><div className="header-inner"><Link href="/" className="brand"><span className="brand-mark"><Leaf size={27}/></span><span><strong>{t('brand.name')}</strong><small>{t('brand.tagline')}</small></span></Link><nav className="main-nav"><a href="#home">{t('nav.home')}</a><a href="#categories">{t('nav.categories')}</a><a href="#archive">{t('nav.favorites')}</a><a href="#about">{t('nav.about')}</a></nav><div className="header-actions"><ThemeSelector/><LanguageSwitcher/></div></div></header>;
}
