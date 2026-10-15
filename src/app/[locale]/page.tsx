import { Dashboard } from "@/components/dashboard";
import { getHealthNotesFromDb, getSharedHealthNotice } from "@/lib/content-db";
import { getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const [notes, healthNotice] = await Promise.all([
    getHealthNotesFromDb(locale),
    getSharedHealthNotice(),
  ]);
  return <Dashboard initialNotes={notes} healthNotice={healthNotice} />;
}
