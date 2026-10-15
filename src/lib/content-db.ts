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
        include: { references: { orderBy: { sortOrder: "asc" } } },
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
      category: String(englishLegacy.category ?? selectedLegacy.category ?? topic.categoryId),
      title: selected?.title ?? english?.title ?? String(englishLegacy.title ?? topic.id),
      description:
        selected?.description ??
        english?.description ??
        undefined,
      body: selected?.body ?? english?.body ?? undefined,
      introduction: selected?.introduction ?? english?.introduction ?? undefined,
      purpose: selected?.purpose ?? english?.purpose ?? undefined,
      contentBlocks: selected?.contentBlocks ?? english?.contentBlocks ?? undefined,
      materials: selected?.materials ?? english?.materials ?? undefined,
      instructions: selected?.instructions ?? english?.instructions ?? undefined,
      precautions: selected?.precautions ?? english?.precautions ?? undefined,
      healthNoticeOverride: selected?.healthNoticeOverride ?? english?.healthNoticeOverride ?? undefined,
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

export async function getSharedHealthNotice(): Promise<string> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "health_notice" } });
  return typeof setting?.value === "string" ? setting.value : "";
}
