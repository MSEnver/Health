export const LOCALE_CONFIG = {
  en: { dir: 'ltr', fontClass: 'font-latin' },
  ur: { dir: 'rtl', fontClass: 'font-urdu' },
  ps: { dir: 'rtl', fontClass: 'font-pashto' },
  'pa-Arab': { dir: 'rtl', fontClass: 'font-punjabi-arabic' },
  hi: { dir: 'ltr', fontClass: 'font-hindi' },
  pa: { dir: 'ltr', fontClass: 'font-punjabi-gurmukhi' },
  skr: { dir: 'rtl', fontClass: 'font-saraiki' },
  sd: { dir: 'rtl', fontClass: 'font-sindhi' },
  eo: { dir: 'ltr', fontClass: 'font-latin' },
} as const;

export const SUPPORTED_LOCALES = Object.keys(LOCALE_CONFIG) as (keyof typeof LOCALE_CONFIG)[];
export type SupportedLocale = keyof typeof LOCALE_CONFIG;

export const isRtlLocale = (locale: string): boolean =>
  locale in LOCALE_CONFIG &&
  LOCALE_CONFIG[locale as SupportedLocale].dir === 'rtl';

export const getLocaleConfig = (locale: string) =>
  LOCALE_CONFIG[locale as SupportedLocale] ?? LOCALE_CONFIG.en;
