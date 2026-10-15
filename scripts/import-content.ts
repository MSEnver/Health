import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();
const root = process.cwd();

const locales = [
  "en", "ur", "ps", "pa-Arab", "hi",
  "pa", "skr", "sd", "eo",
];

type CategorySource = {
  id: string;
  slug: string;
  enabled: boolean;
};

type TopicSource = {
  id: string;
  category?: string;
  title?: string;
  displayTitle?: string;
  sitting?: string;
  date?: string;
  description?: string;
  body?: string;
  spiritualGoal?: string;
  tags?: unknown;
  nameDetails?: unknown;
  urduText?: string;
  urdu?: string;
  englishDescription?: string;
  [key: string]: unknown;
};

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

async function main() {
  const categoryFile = path.join(root, "content/topics.json");
  const categories = readJson<CategorySource[]>(categoryFile);

  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  const allRecords = new Map<string, Map<string, TopicSource[]>>();
  const englishOrder = new Map<string, number>();
  const seenIds = new Set<string>();

  // Validate the complete source before writing anything.
  for (const category of categories) {
    const localeRecords = new Map<string, TopicSource[]>();
    let referenceIds: string[] | null = null;

    for (const locale of locales) {
      const file = path.join(
        root,
        "content/topics",
        category.slug,
        `${locale}.json`,
      );

      if (!fs.existsSync(file)) {
        throw new Error(`Missing source file: ${file}`);
      }

      const records = readJson<TopicSource[]>(file);

      if (!Array.isArray(records)) {
        throw new Error(`Expected a JSON array: ${file}`);
      }

      const ids = records.map((record) => record.id);

      if (ids.some((id) => typeof id !== "string" || !id)) {
        throw new Error(`Missing/invalid topic ID in ${file}`);
      }

      if (new Set(ids).size !== ids.length) {
        throw new Error(`Duplicate topic ID in ${file}`);
      }

      if (referenceIds === null) {
        referenceIds = ids;
      } else {
        const expected = new Set(referenceIds);
        if (
          ids.length !== referenceIds.length ||
          ids.some((id) => !expected.has(id))
        ) {
          throw new Error(`Topic IDs do not match across locales: ${file}`);
        }
      }

      for (const record of records) {
        // The category field may be a translated label in non-English files.
        // Validate the canonical category ID only in the English source.
        if (
          locale === "en" &&
          record.category &&
          record.category !== category.id
        ) {
          throw new Error(
            `English category mismatch for ${record.id} in ${file}: ${record.category}`,
          );
        }

        if (locale === "en") {
          if (!record.title && !record.displayTitle) {
            throw new Error(`Missing English title for ${record.id}`);
          }

          if (seenIds.has(record.id)) {
            throw new Error(`Topic ID occurs in multiple categories: ${record.id}`);
          }

          seenIds.add(record.id);
          englishOrder.set(record.id, englishOrder.size);
        }

        if (typeof record.tags !== "undefined" && !Array.isArray(record.tags)) {
          throw new Error(`Tags must be an array for ${record.id} in ${file}`);
        }

        if (
          Array.isArray(record.tags) &&
          record.tags.some((tag) => typeof tag !== "string")
        ) {
          throw new Error(`Non-string tag for ${record.id} in ${file}`);
        }
      }

      localeRecords.set(locale, records);
    }

    allRecords.set(category.slug, localeRecords);
  }

  const totalTranslations = [...allRecords.values()].reduce(
    (sum, records) =>
      sum + [...records.values()].reduce((n, list) => n + list.length, 0),
    0,
  );

  if (categories.length !== 9 || seenIds.size !== 56 || totalTranslations !== 504) {
    throw new Error(
      `Unexpected source counts: categories=${categories.length}, ` +
      `topics=${seenIds.size}, translations=${totalTranslations}. No data imported.`,
    );
  }

  // Import categories and their existing message-file labels.
  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
    const category = categories[categoryIndex];

    await prisma.category.upsert({
      where: { id: category.id },
      create: {
        id: category.id,
        slug: category.slug,
        enabled: category.enabled,
        sortOrder: categoryIndex,
      },
      update: {
        slug: category.slug,
        enabled: category.enabled,
        sortOrder: categoryIndex,
      },
    });

    for (const locale of locales) {
      const messageFile = path.join(root, "messages", `${locale}.json`);
      if (!fs.existsSync(messageFile)) {
        throw new Error(`Missing locale messages: ${messageFile}`);
      }

      const messages = readJson<Record<string, unknown>>(messageFile);
      const labels = messages.categories as Record<string, unknown> | undefined;
      const label = labels?.[category.id];

      if (typeof label !== "string" || !label.trim()) {
        throw new Error(
          `Missing category label for ${category.id} in ${messageFile}`,
        );
      }

      await prisma.categoryTranslation.upsert({
        where: {
          categoryId_locale: {
            categoryId: category.id,
            locale,
          },
        },
        create: {
          categoryId: category.id,
          locale,
          name: label,
        },
        update: { name: label },
      });
    }
  }

  // Import each topic and its nine localized records.
  for (const category of categories) {
    const recordsByLocale = allRecords.get(category.slug)!;
    const englishRecords = recordsByLocale.get("en")!;

    for (const englishRecord of englishRecords) {
      const id = englishRecord.id;
      const sortOrder = englishOrder.get(id)!;

      await prisma.topic.upsert({
        where: { id },
        create: {
          id,
          categoryId: category.id,
          sitting: optionalString(englishRecord.sitting),
          date: optionalString(englishRecord.date),
          published: true,
          sortOrder,
        },
        update: {
          categoryId: category.id,
          sitting: optionalString(englishRecord.sitting),
          date: optionalString(englishRecord.date),
          sortOrder,
        },
      });

      for (const locale of locales) {
        const record = recordsByLocale
          .get(locale)!
          .find((item) => item.id === id)!;

        const title = record.title ?? record.displayTitle;
        if (!title) {
          throw new Error(`Missing title for ${id} (${locale})`);
        }

        const tags = Array.isArray(record.tags)
          ? record.tags as string[]
          : [];

        const legacyData = JSON.parse(JSON.stringify(record));

        await prisma.topicTranslation.upsert({
          where: {
            topicId_locale: {
              topicId: id,
              locale,
            },
          },
          create: {
            topicId: id,
            locale,
            title,
            description:
              record.description ??
              record.englishDescription ??
              record.urdu ??
              record.urduText ??
              null,
            introduction: optionalString(record.description),
            body: optionalString(record.body),
            spiritualGoal: optionalString(record.spiritualGoal),
            urduText: optionalString(record.urduText),
            urdu: optionalString(record.urdu),
            englishDescription: optionalString(record.englishDescription),
            displayTitle: optionalString(record.displayTitle),
            tags,
            nameDetails: record.nameDetails
              ? legacyData.nameDetails
              : undefined,
            legacyData,
          },
          update: {
            title,
            description:
              record.description ??
              record.englishDescription ??
              record.urdu ??
              record.urduText ??
              null,
            introduction: optionalString(record.description),
            body: optionalString(record.body),
            spiritualGoal: optionalString(record.spiritualGoal),
            urduText: optionalString(record.urduText),
            urdu: optionalString(record.urdu),
            englishDescription: optionalString(record.englishDescription),
            displayTitle: optionalString(record.displayTitle),
            tags,
            nameDetails: record.nameDetails
              ? legacyData.nameDetails
              : undefined,
            legacyData,
          },
        });
      }
    }
  }

  // Report counts so the import can be checked immediately.
  const categoryCount = await prisma.category.count();
  const categoryTranslationCount = await prisma.categoryTranslation.count();
  const topicCount = await prisma.topic.count();
  const topicTranslationCount = await prisma.topicTranslation.count();

  console.log("\nImport completed.");
  console.log({
    categories: categoryCount,
    categoryTranslations: categoryTranslationCount,
    topics: topicCount,
    topicTranslations: topicTranslationCount,
  });

  for (const locale of locales) {
    const count = await prisma.topicTranslation.count({ where: { locale } });
    console.log(`${locale}: ${count} topic translations`);
  }
}

main()
  .catch((error) => {
    console.error("\nImport failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
