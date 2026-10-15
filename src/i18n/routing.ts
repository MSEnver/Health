import { defineRouting } from 'next-intl/routing';
import { SUPPORTED_LOCALES } from '../lib/locale';

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: 'en',
  localePrefix: 'always'
});
