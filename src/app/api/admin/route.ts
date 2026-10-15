import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { SUPPORTED_LOCALES } from "@/lib/locale";

export const runtime = "nodejs";
const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
const obj = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const str = (value: unknown, fallback = "") => typeof value === "string" ? value.trim() : fallback;
const nullable = (value: unknown) => str(value) || null;
const jsonValue = (value: unknown) => value === "" || value === undefined ? null : value;
const locales = new Set<string>(SUPPORTED_LOCALES);

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) return fail("Admin authentication required.", 401);
  const [categories, topics, translations, published, unpublished, categoryTranslations] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { translations: true } }),
    prisma.topic.findMany({ orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { id: "asc" }], include: { translations: { include: { references: { orderBy: { sortOrder: "asc" } } } } } }),
    prisma.topicTranslation.count(),
    prisma.topic.count({ where: { published: true } }),
    prisma.topic.count({ where: { published: false } }),
    prisma.categoryTranslation.count(),
  ]);
  return NextResponse.json({ categories, topics, stats: { categories: categories.length, topics: topics.length, published, unpublished, translations, categoryTranslations, locales: SUPPORTED_LOCALES } });
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) return fail("Admin authentication required.", 401);
  const body = obj(await request.json().catch(() => null));
  const kind = str(body.kind);
  try {
    if (kind === "category") {
      const id = str(body.id);
      const slug = str(body.slug, id).toLowerCase();
      if (!id || !slug) return fail("Category ID and slug are required.");
      const names = obj(body.translations);
      const category = await prisma.category.create({ data: {
        id, slug, enabled: body.enabled !== false, sortOrder: Number(body.sortOrder) || 0,
        translations: { create: Object.entries(names).filter(([locale, value]) => locales.has(locale) && str(obj(value).name)).map(([locale, value]) => ({ locale, name: str(obj(value).name), description: nullable(obj(value).description) })) }
      }, include: { translations: true } });
      await prisma.auditLog.create({ data: { action: "CREATE", entityType: "Category", entityId: id, details: { slug } } });
      return NextResponse.json({ category }, { status: 201 });
    }
    if (kind === "topic") {
      const id = str(body.id);
      const categoryId = str(body.categoryId);
      if (!id || !categoryId) return fail("Topic ID and category are required.");
      const topicTranslations = obj(body.translations);
      const translationsData = Object.entries(topicTranslations).filter(([locale, value]) => locales.has(locale) && str(obj(value).title)).map(([locale, value]) => {
        const t = obj(value);
        return { locale, title: str(t.title), description: nullable(t.description), introduction: nullable(t.introduction), body: nullable(t.body), contentBlocks: jsonValue(t.contentBlocks), purpose: nullable(t.purpose), spiritualGoal: nullable(t.spiritualGoal), materials: jsonValue(t.materials), instructions: jsonValue(t.instructions), precautions: jsonValue(t.precautions), healthNoticeOverride: nullable(t.healthNoticeOverride), urduText: nullable(t.urduText), urdu: nullable(t.urdu), englishDescription: nullable(t.englishDescription), displayTitle: nullable(t.displayTitle), nameDetails: jsonValue(t.nameDetails), tags: Array.isArray(t.tags) ? t.tags.filter((tag): tag is string => typeof tag === "string") : [], legacyData: jsonValue(t.legacyData) };
      });
      if (!translationsData.some(t => t.locale === "en")) return fail("An English title is required before saving an article.");
      const topic = await prisma.topic.create({ data: { id, categoryId, sitting: nullable(body.sitting), date: nullable(body.date), published: body.published === true, sortOrder: Number(body.sortOrder) || 0, translations: { create: translationsData } }, include: { translations: true } });
      await prisma.auditLog.create({ data: { action: "CREATE", entityType: "Topic", entityId: id, details: { categoryId, published: topic.published } } });
      return NextResponse.json({ topic }, { status: 201 });
    }
    return fail("Unknown resource type.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save record.";
    return fail(message.includes("Unique constraint") ? "That ID, slug, or translation already exists." : message, 400);
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthorized(request)) return fail("Admin authentication required.", 401);
  const body = obj(await request.json().catch(() => null));
  const kind = str(body.kind), id = str(body.id);
  if (!id) return fail("ID is required.");
  try {
    if (kind === "category") {
      const translations = obj(body.translations);
      const category = await prisma.category.update({ where: { id }, data: {
        slug: body.slug === undefined ? undefined : str(body.slug).toLowerCase(),
        enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
        sortOrder: body.sortOrder === undefined ? undefined : Number(body.sortOrder) || 0,
      }, include: { translations: true } });
      for (const [locale, raw] of Object.entries(translations)) {
        if (!locales.has(locale)) continue;
        const t = obj(raw), name = str(t.name);
        if (!name) continue;
        await prisma.categoryTranslation.upsert({ where: { categoryId_locale: { categoryId: id, locale } }, create: { categoryId: id, locale, name, description: nullable(t.description) }, update: { name, description: nullable(t.description) } });
      }
      await prisma.auditLog.create({ data: { action: "UPDATE", entityType: "Category", entityId: id } });
      return NextResponse.json({ category: await prisma.category.findUnique({ where: { id }, include: { translations: true } }) });
    }
    if (kind === "topic") {
      const translations = obj(body.translations);
      const updatedTopic = await prisma.topic.update({ where: { id }, data: {
        categoryId: body.categoryId === undefined ? undefined : str(body.categoryId),
        sitting: body.sitting === undefined ? undefined : nullable(body.sitting),
        date: body.date === undefined ? undefined : nullable(body.date),
        published: typeof body.published === "boolean" ? body.published : undefined,
        sortOrder: body.sortOrder === undefined ? undefined : Number(body.sortOrder) || 0,
      } });
      for (const [locale, raw] of Object.entries(translations)) {
        if (!locales.has(locale)) continue;
        const t = obj(raw), title = str(t.title);
        if (!title) continue;
        const existing = await prisma.topicTranslation.findUnique({ where: { topicId_locale: { topicId: id, locale } }, include: { references: true } });
        const data = { title, description: nullable(t.description), introduction: nullable(t.introduction), body: nullable(t.body), contentBlocks: jsonValue(t.contentBlocks), purpose: nullable(t.purpose), spiritualGoal: nullable(t.spiritualGoal), materials: jsonValue(t.materials), instructions: jsonValue(t.instructions), precautions: jsonValue(t.precautions), healthNoticeOverride: nullable(t.healthNoticeOverride), urduText: nullable(t.urduText), urdu: nullable(t.urdu), englishDescription: nullable(t.englishDescription), displayTitle: nullable(t.displayTitle), nameDetails: jsonValue(t.nameDetails), tags: Array.isArray(t.tags) ? t.tags.filter((tag): tag is string => typeof tag === "string") : [], legacyData: jsonValue(t.legacyData) };
        if (existing) {
          await prisma.topicRevision.create({ data: { translationId: existing.id, snapshot: { ...existing, references: existing.references } as object, changeNote: "Admin CMS update" } });
          await prisma.topicTranslation.update({ where: { id: existing.id }, data });
        } else {
          await prisma.topicTranslation.create({ data: { topicId: id, locale, ...data } });
        }
      }
      await prisma.auditLog.create({ data: { action: "UPDATE", entityType: "Topic", entityId: id, details: { published: updatedTopic.published } } });
      return NextResponse.json({ topic: await prisma.topic.findUnique({ where: { id }, include: { translations: true } }) });
    }
    return fail("Unknown resource type.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update record.";
    return fail(message, 400);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminAuthorized(request)) return fail("Admin authentication required.", 401);
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind"), id = searchParams.get("id");
  if (!id) return fail("ID is required.");
  try {
    if (kind !== "topic") return fail("Only articles can be deleted here. Categories with articles are protected.");
    await prisma.topic.delete({ where: { id } });
    await prisma.auditLog.create({ data: { action: "DELETE", entityType: "Topic", entityId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to delete article.", 400);
  }
}
