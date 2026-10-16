import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export function isAdminAuthorized(request: NextRequest): boolean {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return false;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  let decoded: string;
  try { decoded = Buffer.from(header.slice(6), "base64").toString("utf8"); } catch { return false; }
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;
  const suppliedUser = Buffer.from(decoded.slice(0, separator));
  const suppliedPassword = Buffer.from(decoded.slice(separator + 1));
  const expectedUser = Buffer.from(username);
  const expectedPassword = Buffer.from(password);
  const safeEqual = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);
  return safeEqual(suppliedUser, expectedUser) && safeEqual(suppliedPassword, expectedPassword);
}
