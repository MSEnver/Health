import type { HealthNote } from './types';
import notesEn from '../../data/health.en.json';
import notesUr from '../../data/health.ur.json';
import NamesEn from '../../content/topics/names/en.json';
import NamesUr from '../../content/topics/names/ur.json';
import HairEn from '../../content/topics/hair-scalp/en.json';
import HairUr from '../../content/topics/hair-scalp/ur.json';
import SpiritualEn from '../../content/topics/spiritual-guidance/en.json';
import SpiritualUr from '../../content/topics/spiritual-guidance/ur.json';
import JointsEn from '../../content/topics/joint-care/en.json';
import JointsUr from '../../content/topics/joint-care/ur.json';
import CardiovascularEn from '../../content/topics/heart-circulation/en.json';
import CardiovascularUr from '../../content/topics/heart-circulation/ur.json';
import DigestiveEn from '../../content/topics/digestive-health/en.json';
import DigestiveUr from '../../content/topics/digestive-health/ur.json';
import RespiratoryEn from '../../content/topics/respiratory-health/en.json';
import RespiratoryUr from '../../content/topics/respiratory-health/ur.json';
import HomeopathyEn from '../../content/topics/homeopathy/en.json';
import HomeopathyUr from '../../content/topics/homeopathy/ur.json';
import SkinEn from '../../content/topics/skin-household/en.json';
import SkinUr from '../../content/topics/skin-household/ur.json';



export const getHealthNotes = (locale: string): HealthNote[] => {
  const isUrdu = locale === 'ur';
  return [
    ...((isUrdu ? NamesUr : NamesEn) as HealthNote[]),
    ...((isUrdu ? HairUr : HairEn) as HealthNote[]),
    ...((isUrdu ? SpiritualUr : SpiritualEn) as HealthNote[]),
    ...((isUrdu ? JointsUr : JointsEn) as HealthNote[]),
    ...((isUrdu ? CardiovascularUr : CardiovascularEn) as HealthNote[]),
    ...((isUrdu ? DigestiveUr : DigestiveEn) as HealthNote[]),
    ...((isUrdu ? RespiratoryUr : RespiratoryEn) as HealthNote[]),
    ...((isUrdu ? HomeopathyUr : HomeopathyEn) as HealthNote[]),
    ...((isUrdu ? SkinUr : SkinEn) as HealthNote[])
  ];
};
