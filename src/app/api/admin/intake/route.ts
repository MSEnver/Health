import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const clean = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

function serialize(batch: {
  id: string; name: string; sourceFileName: string | null; sourceText: string | null;
  status: string; data: Prisma.JsonValue; createdAt: Date; updatedAt: Date;
}) {
  return { ...batch, data: batch.data, createdAt: batch.createdAt.toISOString(), updatedAt: batch.updatedAt.toISOString() };
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) return fail("Unauthorized", 401);
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const batch = await prisma.intakeBatch.findUnique({ where: { id } });
      if (!batch) return fail("Intake batch not found", 404);
      return NextResponse.json({ batch: serialize(batch) });
    }
    const batches = await prisma.intakeBatch.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return NextResponse.json({ batches: batches.map(serialize) });
  } catch (error) {
    console.error("Unable to load intake batches", error);
    return fail("Unable to load intake batches", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) return fail("Unauthorized", 401);
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) return fail("Invalid request body");
    const name = clean(body.name);
    if (!name) return fail("Batch name is required");
    const data = isRecord(body.data) ? body.data : { topics: [], categories: [] };
    const batch = await prisma.intakeBatch.create({
      data: {
        name,
        sourceFileName: clean(body.sourceFileName) || null,
        sourceText: typeof body.sourceText === "string" ? body.sourceText : null,
        status: "DRAFT",
        data: data as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ batch: serialize(batch) }, { status: 201 });
  } catch (error) {
    console.error("Unable to create intake batch", error);
    return fail("Unable to create intake batch", 500);
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthorized(request)) return fail("Unauthorized", 401);
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) return fail("Invalid request body");
    const id = clean(body.id);
    if (!id) return fail("Batch id is required");
    const current = await prisma.intakeBatch.findUnique({ where: { id } });
    if (!current) return fail("Intake batch not found", 404);

    const update: Prisma.IntakeBatchUpdateInput = {};
    if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
    if (typeof body.sourceText === "string") update.sourceText = body.sourceText;
    if (typeof body.sourceFileName === "string" || body.sourceFileName === null) update.sourceFileName = body.sourceFileName;
    if (typeof body.status === "string" && ["DRAFT", "IN_REVIEW", "READY", "PARTIAL", "COMPLETED"].includes(body.status)) update.status = body.status;
    if (isRecord(body.data)) update.data = body.data as Prisma.InputJsonValue;

    const batch = await prisma.intakeBatch.update({ where: { id }, data: update });
    return NextResponse.json({ batch: serialize(batch) });
  } catch (error) {
    console.error("Unable to update intake batch", error);
    return fail("Unable to update intake batch", 500);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminAuthorized(request)) return fail("Unauthorized", 401);
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return fail("Batch id is required");
    await prisma.intakeBatch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete intake batch", error);
    return fail("Unable to delete intake batch", 500);
  }
}
