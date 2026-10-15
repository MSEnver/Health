'use client';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

const languages = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'اردو' },
  { value: 'ps', label: 'پښتو' },
  { value: 'pa-Arab', label: 'پنجابی (پاکستانی)' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ (ਗੁਰਮੁਖੀ)' },
  { value: 'skr', label: 'سرائیکی' },
  { value: 'sd', label: 'سنڌي' },
  { value: 'eo', label: 'Esperanto' }
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="language-control">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={e => router.replace(pathname, { locale: e.target.value })}
        aria-label="Language"
      >
        {languages.map(language => (
          <option key={language.value} value={language.value}>{language.label}</option>
        ))}
      </select>
    </label>
  );
}
