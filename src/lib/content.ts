import type { HealthNote } from './types';

import namesEn from '../../content/topics/names/en.json';
import namesUr from '../../content/topics/names/ur.json';
import namesPs from '../../content/topics/names/ps.json';
import namesPaArab from '../../content/topics/names/pa-Arab.json';
import namesHi from '../../content/topics/names/hi.json';
import namesPa from '../../content/topics/names/pa.json';
import namesSkr from '../../content/topics/names/skr.json';
import namesSd from '../../content/topics/names/sd.json';
import namesEo from '../../content/topics/names/eo.json';
import hairEn from '../../content/topics/hair-scalp/en.json';
import hairUr from '../../content/topics/hair-scalp/ur.json';
import hairPs from '../../content/topics/hair-scalp/ps.json';
import hairPaArab from '../../content/topics/hair-scalp/pa-Arab.json';
import hairHi from '../../content/topics/hair-scalp/hi.json';
import hairPa from '../../content/topics/hair-scalp/pa.json';
import hairSkr from '../../content/topics/hair-scalp/skr.json';
import hairSd from '../../content/topics/hair-scalp/sd.json';
import hairEo from '../../content/topics/hair-scalp/eo.json';
import spiritualEn from '../../content/topics/spiritual-guidance/en.json';
import spiritualUr from '../../content/topics/spiritual-guidance/ur.json';
import spiritualPs from '../../content/topics/spiritual-guidance/ps.json';
import spiritualPaArab from '../../content/topics/spiritual-guidance/pa-Arab.json';
import spiritualHi from '../../content/topics/spiritual-guidance/hi.json';
import spiritualPa from '../../content/topics/spiritual-guidance/pa.json';
import spiritualSkr from '../../content/topics/spiritual-guidance/skr.json';
import spiritualSd from '../../content/topics/spiritual-guidance/sd.json';
import spiritualEo from '../../content/topics/spiritual-guidance/eo.json';
import jointsEn from '../../content/topics/joint-care/en.json';
import jointsUr from '../../content/topics/joint-care/ur.json';
import jointsPs from '../../content/topics/joint-care/ps.json';
import jointsPaArab from '../../content/topics/joint-care/pa-Arab.json';
import jointsHi from '../../content/topics/joint-care/hi.json';
import jointsPa from '../../content/topics/joint-care/pa.json';
import jointsSkr from '../../content/topics/joint-care/skr.json';
import jointsSd from '../../content/topics/joint-care/sd.json';
import jointsEo from '../../content/topics/joint-care/eo.json';
import cardiovascularEn from '../../content/topics/heart-circulation/en.json';
import cardiovascularUr from '../../content/topics/heart-circulation/ur.json';
import cardiovascularPs from '../../content/topics/heart-circulation/ps.json';
import cardiovascularPaArab from '../../content/topics/heart-circulation/pa-Arab.json';
import cardiovascularHi from '../../content/topics/heart-circulation/hi.json';
import cardiovascularPa from '../../content/topics/heart-circulation/pa.json';
import cardiovascularSkr from '../../content/topics/heart-circulation/skr.json';
import cardiovascularSd from '../../content/topics/heart-circulation/sd.json';
import cardiovascularEo from '../../content/topics/heart-circulation/eo.json';
import digestiveEn from '../../content/topics/digestive-health/en.json';
import digestiveUr from '../../content/topics/digestive-health/ur.json';
import digestivePs from '../../content/topics/digestive-health/ps.json';
import digestivePaArab from '../../content/topics/digestive-health/pa-Arab.json';
import digestiveHi from '../../content/topics/digestive-health/hi.json';
import digestivePa from '../../content/topics/digestive-health/pa.json';
import digestiveSkr from '../../content/topics/digestive-health/skr.json';
import digestiveSd from '../../content/topics/digestive-health/sd.json';
import digestiveEo from '../../content/topics/digestive-health/eo.json';
import respiratoryEn from '../../content/topics/respiratory-health/en.json';
import respiratoryUr from '../../content/topics/respiratory-health/ur.json';
import respiratoryPs from '../../content/topics/respiratory-health/ps.json';
import respiratoryPaArab from '../../content/topics/respiratory-health/pa-Arab.json';
import respiratoryHi from '../../content/topics/respiratory-health/hi.json';
import respiratoryPa from '../../content/topics/respiratory-health/pa.json';
import respiratorySkr from '../../content/topics/respiratory-health/skr.json';
import respiratorySd from '../../content/topics/respiratory-health/sd.json';
import respiratoryEo from '../../content/topics/respiratory-health/eo.json';
import homeopathyEn from '../../content/topics/homeopathy/en.json';
import homeopathyUr from '../../content/topics/homeopathy/ur.json';
import homeopathyPs from '../../content/topics/homeopathy/ps.json';
import homeopathyPaArab from '../../content/topics/homeopathy/pa-Arab.json';
import homeopathyHi from '../../content/topics/homeopathy/hi.json';
import homeopathyPa from '../../content/topics/homeopathy/pa.json';
import homeopathySkr from '../../content/topics/homeopathy/skr.json';
import homeopathySd from '../../content/topics/homeopathy/sd.json';
import homeopathyEo from '../../content/topics/homeopathy/eo.json';
import skinEn from '../../content/topics/skin-household/en.json';
import skinUr from '../../content/topics/skin-household/ur.json';
import skinPs from '../../content/topics/skin-household/ps.json';
import skinPaArab from '../../content/topics/skin-household/pa-Arab.json';
import skinHi from '../../content/topics/skin-household/hi.json';
import skinPa from '../../content/topics/skin-household/pa.json';
import skinSkr from '../../content/topics/skin-household/skr.json';
import skinSd from '../../content/topics/skin-household/sd.json';
import skinEo from '../../content/topics/skin-household/eo.json';

export const SUPPORTED_LOCALES = ["en","ur","ps","pa-Arab","hi","pa","skr","sd","eo"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const RTL_LOCALES = new Set<SupportedLocale>(['ur', 'ps', 'pa-Arab', 'skr', 'sd']);
export const isRtlLocale = (locale: string): boolean => RTL_LOCALES.has(locale as SupportedLocale);

const expectedCounts: Record<string, number> = {"names":23,"hair-scalp":5,"spiritual-guidance":9,"joint-care":4,"heart-circulation":3,"digestive-health":3,"respiratory-health":2,"homeopathy":4,"skin-household":3};

const topicSources: Record<SupportedLocale, readonly (readonly HealthNote[])[]> = {
  'en': [
    (namesEn as readonly HealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairEn as readonly HealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualEn as readonly HealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsEn as readonly HealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularEn as readonly HealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveEn as readonly HealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryEn as readonly HealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyEn as readonly HealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinEn as readonly HealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'ur': [
    (namesUr as readonly HealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairUr as readonly HealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualUr as readonly HealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsUr as readonly HealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularUr as readonly HealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveUr as readonly HealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryUr as readonly HealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyUr as readonly HealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinUr as readonly HealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'ps': [
    (namesPs as readonly HealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairPs as readonly HealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualPs as readonly HealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsPs as readonly HealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularPs as readonly HealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestivePs as readonly HealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryPs as readonly HealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyPs as readonly HealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinPs as readonly HealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'pa-Arab': [
    (namesPaArab as readonly HealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairPaArab as readonly HealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualPaArab as readonly HealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsPaArab as readonly HealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularPaArab as readonly HealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestivePaArab as readonly HealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryPaArab as readonly HealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyPaArab as readonly HealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinPaArab as readonly HealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'hi': [
    (namesHi as readonly HealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairHi as readonly HealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualHi as readonly HealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsHi as readonly HealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularHi as readonly HealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveHi as readonly HealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryHi as readonly HealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyHi as readonly HealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinHi as readonly HealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'pa': [
    (namesPa as readonly HealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairPa as readonly HealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualPa as readonly HealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsPa as readonly HealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularPa as readonly HealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestivePa as readonly HealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryPa as readonly HealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyPa as readonly HealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinPa as readonly HealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'skr': [
    (namesSkr as readonly HealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairSkr as readonly HealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualSkr as readonly HealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsSkr as readonly HealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularSkr as readonly HealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveSkr as readonly HealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratorySkr as readonly HealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathySkr as readonly HealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinSkr as readonly HealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'sd': [
    (namesSd as readonly HealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairSd as readonly HealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualSd as readonly HealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsSd as readonly HealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularSd as readonly HealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveSd as readonly HealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratorySd as readonly HealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathySd as readonly HealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinSd as readonly HealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'eo': [
    (namesEo as readonly HealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairEo as readonly HealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualEo as readonly HealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsEo as readonly HealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularEo as readonly HealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveEo as readonly HealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryEo as readonly HealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyEo as readonly HealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinEo as readonly HealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
};

/** Return the canonical topic articles for the requested locale. Missing translations are never silently replaced with English. */
export const getHealthNotes = (locale: string): HealthNote[] => {
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    throw new Error(`Unsupported content locale: ${locale}`);
  }
  const selected = topicSources[locale as SupportedLocale];
  return selected.flatMap((records, index) => {
    const topic = ['names', 'hair-scalp', 'spiritual-guidance', 'joint-care', 'heart-circulation', 'digestive-health', 'respiratory-health', 'homeopathy', 'skin-household'][index];
    if (records.length !== expectedCounts[topic]) {
      throw new Error(`Incomplete ${locale} topic dataset for ${topic}: expected ${expectedCounts[topic]}, received ${records.length}`);
    }
    return [...records];
  });
};
