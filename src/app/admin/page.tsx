import { AdminCms } from "@/components/admin-cms";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <><div className="border-b border-slate-200 bg-white px-6 py-3"><Link href="/admin/intake" className="inline-flex items-center rounded-lg bg-sky-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-900">Open Content Intake &amp; Review</Link></div><AdminCms /></>;
}
