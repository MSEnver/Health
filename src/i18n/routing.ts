import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ur', 'ps', 'pa-Arab', 'hi', 'pa', 'skr', 'sd', 'eo'],
  defaultLocale: 'en',
  localePrefix: 'always'
});
