import "server-only";

import { prisma } from "@/lib/prisma";
import { SUPPORTED_LOCALES } from "@/lib/locale";
import type { HealthNote } from "@/lib/types";

type LegacyRecord = Record<string, unknown>;

function legacyRecord(value: unknown): LegacyRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as LegacyRecord;
  }

  return {};
}

export async function getHealthNotesFromDb(
  locale: string,
): Promise<HealthNote[]> {
  if (!SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) {
    throw new Error(`Unsupported content locale: ${locale}`);
  }

  const topics = await prisma.topic.findMany({
    where: { published: true, category: { enabled: true } },
    orderBy: [
      { category: { sortOrder: "asc" } },
      { sortOrder: "asc" },
    ],
    include: {
      translations: {
        where: { locale: { in: locale === "en" ? ["en"] : [locale, "en"] } },
      },
    },
  });

  return topics.map((topic) => {
    const english = topic.translations.find((item) => item.locale === "en");
    const selected = topic.translations.find((item) => item.locale === locale);

    if (!selected && !english) {
      throw new Error(`No translation found for topic ${topic.id}`);
    }

    const englishLegacy = legacyRecord(english?.legacyData);
    const selectedLegacy = legacyRecord(selected?.legacyData);

    const note = {
      ...englishLegacy,
      ...selectedLegacy,
      id: topic.id,
      sitting: topic.sitting ?? "Sitting",
      date: topic.date ?? undefined,
      category: topic.categoryId,
      title: selected?.title ?? english?.title ?? String(englishLegacy.title ?? topic.id),
      description:
        selected?.description ??
        english?.description ??
        undefined,
      body: selected?.body ?? english?.body ?? undefined,
      spiritualGoal:
        selected?.spiritualGoal ??
        english?.spiritualGoal ??
        undefined,
      urduText: selected?.urduText ?? english?.urduText ?? undefined,
      urdu: selected?.urdu ?? english?.urdu ?? undefined,
      englishDescription:
        selected?.englishDescription ??
        english?.englishDescription ??
        undefined,
      displayTitle:
        selected?.displayTitle ??
        english?.displayTitle ??
        undefined,
      tags: selected?.tags ?? english?.tags ?? [],
      nameDetails:
        selected?.nameDetails ?? english?.nameDetails ?? undefined,
    };

    return note as unknown as HealthNote;
  });
}
