import { Dashboard } from "@/components/dashboard";
import { getHealthNotesFromDb } from "@/lib/content-db";
import { getLocale } from "next-intl/server";

export default async function HomePage() {
  const locale = await getLocale();
  const notes = await getHealthNotesFromDb(locale);

  return <Dashboard initialNotes={notes} />;
}
