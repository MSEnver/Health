export const SUPPORTED_LOCALES = ['en', 'ur', 'ps', 'pa-Arab', 'hi', 'pa', 'skr', 'sd', 'eo'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const RTL_LOCALES = new Set<SupportedLocale>(['ur', 'ps', 'pa-Arab', 'skr', 'sd']);

export const isRtlLocale = (locale: string): boolean =>
  RTL_LOCALES.has(locale as SupportedLocale);
