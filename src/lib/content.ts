import type { HealthNote } from './types';
import { SUPPORTED_LOCALES, type SupportedLocale } from './locale';

type RawHealthNote = Omit<HealthNote, 'sitting' | 'category'> &
  Partial<Pick<HealthNote, 'sitting' | 'category'>>;

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

const expectedCounts: Record<string, number> = {"names":23,"hair-scalp":5,"spiritual-guidance":9,"joint-care":4,"heart-circulation":3,"digestive-health":3,"respiratory-health":2,"homeopathy":4,"skin-household":3};

const topicSources: Record<SupportedLocale, readonly (readonly RawHealthNote[])[]> = {
  'en': [
    (namesEn as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairEn as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualEn as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsEn as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularEn as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveEn as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryEn as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyEn as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinEn as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'ur': [
    (namesUr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairUr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualUr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsUr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularUr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveUr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryUr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyUr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinUr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'ps': [
    (namesPs as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairPs as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualPs as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsPs as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularPs as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestivePs as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryPs as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyPs as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinPs as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'pa-Arab': [
    (namesPaArab as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairPaArab as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualPaArab as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsPaArab as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularPaArab as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestivePaArab as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryPaArab as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyPaArab as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinPaArab as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'hi': [
    (namesHi as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairHi as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualHi as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsHi as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularHi as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveHi as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryHi as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyHi as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinHi as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'pa': [
    (namesPa as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairPa as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualPa as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsPa as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularPa as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestivePa as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryPa as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyPa as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinPa as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'skr': [
    (namesSkr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairSkr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualSkr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsSkr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularSkr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveSkr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratorySkr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathySkr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinSkr as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'sd': [
    (namesSd as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairSd as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualSd as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsSd as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularSd as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveSd as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratorySd as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathySd as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinSd as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
  'eo': [
    (namesEo as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Names' })),
    (hairEo as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Hair' })),
    (spiritualEo as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Spiritual' })),
    (jointsEo as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Joints' })),
    (cardiovascularEo as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Cardiovascular' })),
    (digestiveEo as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Digestive' })),
    (respiratoryEo as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Respiratory' })),
    (homeopathyEo as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Homeopathy' })),
    (skinEo as readonly RawHealthNote[]).map(note => ({ ...note, category: 'Skin' })),
  ],
};

/** Return normalized topic articles for a supported locale. */
export const getHealthNotes = (locale: string): HealthNote[] => {
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    throw new Error(`Unsupported content locale: ${locale}`);
  }

  const selected = topicSources[locale as SupportedLocale];
  const english = topicSources.en;
  const topics = [
    "names",
    "hair-scalp",
    "spiritual-guidance",
    "joint-care",
    "heart-circulation",
    "digestive-health",
    "respiratory-health",
    "homeopathy",
    "skin-household",
  ];

  return selected.flatMap((records, index) => {
    const topic = topics[index];
    if (records.length !== expectedCounts[topic]) {
      throw new Error(
        `Incomplete ${locale} topic dataset for ${topic}: expected ${expectedCounts[topic]}, received ${records.length}`
      );
    }

    const englishById = new Map(
      english[index].map((record) => [record.id, record])
    );

    return records.map((record) => {
      const reference = englishById.get(record.id);
      if (!reference) {
        throw new Error(`Missing English metadata for ${topic}/${record.id}`);
      }

      const sitting = record.sitting ?? reference.sitting;
      const category = record.category ?? reference.category;

      if (!sitting || !category) {
        throw new Error(`Missing required metadata for ${topic}/${record.id}`);
      }

      return {
        ...reference,
        ...record,
        sitting,
        category,
      };
    });
  });
};
