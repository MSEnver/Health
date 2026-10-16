import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { getLocaleConfig } from '@/lib/locale';
export function generateStaticParams() { return routing.locales.map(locale => ({ locale })); }
export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const localeConfig = getLocaleConfig(locale);
  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>
        <div className={`site-shell locale-${locale} ${localeConfig.fontClass}`} lang={locale} dir={localeConfig.dir}>
          <Header />
          <main className="app-main">{children}</main>
        </div>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
