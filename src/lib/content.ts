import type { HealthNote } from './types';
import namesEn from '../../content/topics/names/en.json';
import namesUr from '../../content/topics/names/ur.json';
import hairEn from '../../content/topics/hair-scalp/en.json';
import hairUr from '../../content/topics/hair-scalp/ur.json';
import spiritualEn from '../../content/topics/spiritual-guidance/en.json';
import spiritualUr from '../../content/topics/spiritual-guidance/ur.json';
import jointsEn from '../../content/topics/joint-care/en.json';
import jointsUr from '../../content/topics/joint-care/ur.json';
import cardiovascularEn from '../../content/topics/heart-circulation/en.json';
import cardiovascularUr from '../../content/topics/heart-circulation/ur.json';
import digestiveEn from '../../content/topics/digestive-health/en.json';
import digestiveUr from '../../content/topics/digestive-health/ur.json';
import respiratoryEn from '../../content/topics/respiratory-health/en.json';
import respiratoryUr from '../../content/topics/respiratory-health/ur.json';
import homeopathyEn from '../../content/topics/homeopathy/en.json';
import homeopathyUr from '../../content/topics/homeopathy/ur.json';
import skinEn from '../../content/topics/skin-household/en.json';
import skinUr from '../../content/topics/skin-household/ur.json';

const topicSources = [
  { en: namesEn, ur: namesUr },
  { en: hairEn, ur: hairUr },
  { en: spiritualEn, ur: spiritualUr },
  { en: jointsEn, ur: jointsUr },
  { en: cardiovascularEn, ur: cardiovascularUr },
  { en: digestiveEn, ur: digestiveUr },
  { en: respiratoryEn, ur: respiratoryUr },
  { en: homeopathyEn, ur: homeopathyUr },
  { en: skinEn, ur: skinUr },
] as const;

const RTL_LOCALES = new Set(['ur', 'ps', 'pa-Arab', 'skr', 'sd']);
export const isRtlLocale = (locale: string): boolean => RTL_LOCALES.has(locale);

const supportedLocales = new Set(['en', 'ur', 'ps', 'pa-Arab', 'hi', 'pa', 'skr', 'sd', 'eo']);

/**
 * Topic JSON is the canonical article source. Urdu has a dedicated dataset today;
 * other locales use English only as a temporary fallback until their translated
 * topic files are added. Keeping this fallback explicit prevents pretending that
 * an untranslated article is translated.
 */
export const getHealthNotes = (locale: string): HealthNote[] => {
  const selectedLocale = supportedLocales.has(locale) ? locale : 'en';
  const sourceLocale = selectedLocale === 'ur' ? 'ur' : 'en';
  return topicSources.flatMap((topic) => [...(topic[sourceLocale] as readonly HealthNote[])]);
};
