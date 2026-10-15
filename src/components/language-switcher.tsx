'use client';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
export function LanguageSwitcher() {
  const locale = useLocale(); const pathname = usePathname(); const router = useRouter();
  return <label className="language-control"><span className="sr-only">Language</span><select value={locale} onChange={e => router.replace(pathname, { locale: e.target.value })} aria-label="Language"><option value="en">English</option><option value="ur">اردو</option></select></label>;
}
