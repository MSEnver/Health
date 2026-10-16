"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Circle, FileText, FolderPlus, GripVertical, History, Languages, LayoutGrid, List, Plus, Save, Upload, X } from "lucide-react";
import { SUPPORTED_LOCALES } from "@/lib/locale";

type Locale = string;
type TranslationDraft = {
  title: string; description: string; introduction: string; body: string;
  instructions: string; precautions: string; reviewed: boolean; status: string;
};
type DraftTopic = {
  id: string; title: string; categoryId: string; categoryName: string; proposedCategory?: string;
  status: string; sortOrder: number; translations: Record<Locale, TranslationDraft>;
};
type IntakeCategory = { id: string; name: string; slug: string; isNew: boolean; parentId?: string };
type BatchData = { topics: DraftTopic[]; categories: IntakeCategory[]; activeTopicId?: string };
type Batch = { id: string; name: string; sourceFileName?: string | null; sourceText?: string | null; status: string; data: BatchData; createdAt: string; updatedAt: string };
type LiveCategory = { id: string; slug: string; enabled: boolean; sortOrder: number; translations?: { locale: string; name: string }[] };
type Screen = "upload" | "topics" | "categories" | "organize" | "editor" | "review" | "summary" | "history";
type Section = "basic" | "translations" | "references" | "advanced";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", ur: "Urdu", ps: "Pashto", "pa-Arab": "Punjabi (Shahmukhi)",
  hi: "Hindi", pa: "Punjabi (Gurmukhi)", skr: "Saraiki", sd: "Sindhi", eo: "Esperanto",
};
const emptyTranslation = (): TranslationDraft => ({ title: "", description: "", introduction: "", body: "", instructions: "", precautions: "", reviewed: false, status: "NOT_STARTED" });
const newId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function readDocxText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new Error("This does not look like a valid DOCX file.");
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  let xml: string | null = null;
  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    if (name === "word/document.xml") {
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(start, start + compressedSize);
      if (method === 0) xml = new TextDecoder().decode(compressed);
      else if (method === 8) {
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw" as CompressionFormat));
        xml = await new Response(stream).text();
      } else throw new Error("This DOCX compression method is not supported by this browser.");
      break;
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  if (!xml) throw new Error("Could not find the document text in this DOCX.");
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  const paragraphs = Array.from(parsed.getElementsByTagName("w:p"));
  return paragraphs.map((paragraph) => {
    const text = Array.from(paragraph.getElementsByTagName("w:t")).map((node) => node.textContent ?? "").join("");
    const style = paragraph.getElementsByTagName("w:pStyle")[0]?.getAttribute("w:val") ?? "";
    return style.toLowerCase().startsWith("heading") ? `\n## ${text}\n` : text;
  }).filter(Boolean).join("\n").trim();
}

function extractTopics(source: string, liveCategories: LiveCategory[]): DraftTopic[] {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sections: { title: string; body: string[] }[] = [];
  let current: { title: string; body: string[] } | null = null;
  const heading = /^(?:#{1,3}\s+|(?:topic\s+)?\d+[.)]\s+|[A-Z][A-Z0-9 ,:&()/-]{5,})/;
  for (const line of lines) {
    const isHeading = line.startsWith("## ") || (heading.test(line) && line.length < 140);
    if (isHeading) {
      const title = line.replace(/^#+\s*/, "").replace(/^(?:topic\s+)?\d+[.)]\s*/i, "").trim();
      if (title) { current = { title, body: [] }; sections.push(current); continue; }
    }
    if (!current) { current = { title: "Extracted topic 1", body: [] }; sections.push(current); }
    current.body.push(line);
  }
  if (!sections.length) sections.push({ title: "Extracted topic 1", body: lines });
  return sections.map((section, index) => {
    const matched = liveCategories.find((category) => {
      const name = category.translations?.find((translation) => translation.locale === "en")?.name ?? category.slug.replace(/-/g, " ");
      const words = name.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
      return words.some((word) => section.title.toLowerCase().includes(word));
    });
    const translations = Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, {
      ...emptyTranslation(),
      ...(locale === "en" ? { title: section.title, introduction: section.body.join("\n\n"), status: "NEEDS_REVIEW" } : {}),
    }]));
    return { id: newId(), title: section.title, categoryId: matched?.id ?? "", categoryName: matched?.translations?.find((t) => t.locale === "en")?.name ?? "", proposedCategory: matched ? undefined : "Uncategorized", status: "NEEDS_REVIEW", sortOrder: index + 1, translations } as DraftTopic;
  });
}

export function ContentIntake() {
  const [screen, setScreen] = useState<Screen>("upload");
  const [section, setSection] = useState<Section>("translations");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [liveCategories, setLiveCategories] = useState<LiveCategory[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [batchName, setBatchName] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [locale, setLocale] = useState("en");
  const [search, setSearch] = useState("");
  const [categoryDraftName, setCategoryDraftName] = useState("");
  const [dragTopicId, setDragTopicId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBatches = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/intake", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load intake batches.");
      setBatches(result.batches ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load intake batches."); }
  }, []);

  useEffect(() => {
    void loadBatches();
    fetch("/api/admin", { cache: "no-store" }).then((response) => response.json()).then((result) => setLiveCategories(result.categories ?? [])).catch(() => undefined);
  }, [loadBatches]);

  const topics = batch?.data.topics ?? [];
  const categories = batch?.data.categories ?? [];
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? topics[0] ?? null;
  const readyCount = topics.filter((topic) => topic.status === "REVIEWED" && SUPPORTED_LOCALES.every((l) => topic.translations[l]?.reviewed)).length;
  const needsReviewCount = topics.filter((topic) => topic.status !== "REVIEWED" || !SUPPORTED_LOCALES.every((l) => topic.translations[l]?.reviewed)).length;
  const filteredTopics = useMemo(() => topics.filter((topic) => topic.title.toLowerCase().includes(search.toLowerCase()) || topic.categoryName.toLowerCase().includes(search.toLowerCase())), [topics, search]);

  const persist = async (next: Batch, successMessage = "Draft batch saved.") => {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/intake", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: next.id, name: next.name, sourceText: next.sourceText ?? "", sourceFileName: next.sourceFileName ?? null, status: next.status, data: next.data }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save the batch.");
      setBatch(result.batch); setBatches((old) => [result.batch, ...old.filter((item) => item.id !== result.batch.id)]); setMessage(successMessage);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the batch."); }
    finally { setBusy(false); }
  };

  const createBatch = async () => {
    setBusy(true); setError(""); setMessage("");
    try {
      let sourceText = transcript.trim();
      if (file) {
        if (file.name.toLowerCase().endsWith(".docx")) sourceText = await readDocxText(file);
        else sourceText = await file.text();
      }
      if (!sourceText) throw new Error("Choose a DOCX/text file or paste transcript text.");
      const extracted = extractTopics(sourceText, liveCategories);
      const categoryRows: IntakeCategory[] = liveCategories.map((category) => ({
        id: category.id, name: category.translations?.find((translation) => translation.locale === "en")?.name ?? category.slug,
        slug: category.slug, isNew: false,
      }));
      const payload = { name: batchName.trim() || file?.name.replace(/\.[^.]+$/, "") || "Untitled transcript", sourceFileName: file?.name ?? null, sourceText, data: { topics: extracted, categories: categoryRows } };
      const response = await fetch("/api/admin/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create the draft batch.");
      setBatch(result.batch); setBatches((old) => [result.batch, ...old]); setSelectedTopicId(extracted[0]?.id ?? ""); setScreen("topics");
      setMessage(`Draft batch created with ${extracted.length} extracted topic(s). Review the extracted titles and category assignments before importing.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Transcript processing failed."); }
    finally { setBusy(false); }
  };

  const updateTopic = (id: string, patch: Partial<DraftTopic>) => {
    if (!batch) return;
    setBatch({ ...batch, data: { ...batch.data, topics: batch.data.topics.map((topic) => topic.id === id ? { ...topic, ...patch } : topic) } });
  };
  const updateTranslation = (id: string, language: string, patch: Partial<TranslationDraft>) => {
    const topic = topics.find((item) => item.id === id);
    if (!topic) return;
    updateTopic(id, { translations: { ...topic.translations, [language]: { ...topic.translations[language], ...patch, status: patch.reviewed ? "REVIEWED" : (patch.status ?? "IN_PROGRESS") } } });
  };
  const addCategory = () => {
    if (!batch || !categoryDraftName.trim()) return;
    const name = categoryDraftName.trim();
    const category: IntakeCategory = { id: `draft-category-${newId()}`, name, slug: slugify(name), isNew: true };
    setBatch({ ...batch, data: { ...batch.data, categories: [...categories, category] } });
    setCategoryDraftName(""); setMessage(`“${name}” added as a draft category. It will not be created in the live category table until commit.`);
  };
  const moveTopic = (topicId: string, category: IntakeCategory | LiveCategory) => {
    const name = "name" in category ? category.name : category.translations?.find((translation) => translation.locale === "en")?.name ?? category.slug;
    updateTopic(topicId, { categoryId: category.id, categoryName: name, proposedCategory: undefined });
    setDragTopicId("");
  };
  const deleteBatch = async (id: string) => {
    if (!window.confirm("Delete this staging batch? Live articles and categories are not affected.")) return;
    const response = await fetch(`/api/admin/intake?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) { setError("Could not delete the staging batch."); return; }
    setBatches((old) => old.filter((item) => item.id !== id)); if (batch?.id === id) setBatch(null);
  };
  const openBatch = (item: Batch, nextScreen: Screen = "topics") => { setBatch(item); setSelectedTopicId(item.data.topics[0]?.id ?? ""); setScreen(nextScreen); setSearch(""); };

  const nav: { id: Screen; label: string; icon: React.ReactNode }[] = [
    { id: "upload", label: "Upload transcript", icon: <Upload size={16}/> },
    { id: "topics", label: "Extracted topics", icon: <FileText size={16}/> },
    { id: "categories", label: "Categories", icon: <FolderPlus size={16}/> },
    { id: "organize", label: "Organize topics", icon: <LayoutGrid size={16}/> },
    { id: "review", label: "Batch review", icon: <Languages size={16}/> },
    { id: "summary", label: "Batch summary & import", icon: <CheckCircle2 size={16}/> },
  ];
  const goEditor = (topicId: string) => { setSelectedTopicId(topicId); setLocale("en"); setSection("translations"); setScreen("editor"); };

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white px-5 py-4 md:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div><div className="text-xs font-bold uppercase tracking-[.22em] text-slate-500">HealthGuide / Admin</div><h1 className="mt-1 text-2xl font-bold">Content Intake</h1><p className="mt-1 text-sm text-slate-500">Stage transcript topics, organize categories, review translations, then import approved content.</p></div>
        <div className="flex gap-2"><Link href="/admin" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">Back to CMS</Link>{batch && <button onClick={() => void persist(batch)} disabled={busy} className="rounded-lg bg-sky-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save className="mr-2 inline" size={15}/>Save batch</button>}</div>
      </div>
    </header>
    <div className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 md:grid-cols-[230px_minmax(0,1fr)] md:px-8">
      <aside className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Workflow</div>
        <nav className="space-y-1">{nav.map((item) => <button key={item.id} onClick={() => setScreen(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${screen === item.id ? "bg-sky-800 text-white" : "text-slate-700 hover:bg-slate-100"}`}>{item.icon}{item.label}</button>)}</nav>
        <div className="mt-5 border-t border-slate-100 pt-4"><div className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Current batch</div>{batch ? <button onClick={() => setScreen("topics")} className="mt-2 w-full rounded-lg bg-slate-50 p-3 text-left"><div className="truncate text-sm font-semibold">{batch.name}</div><div className="mt-1 text-xs text-slate-500">{topics.length} topics · {batch.status}</div></button> : <p className="px-3 py-2 text-sm text-slate-500">No batch selected</p>}</div>
      </aside>
      <section className="min-w-0 space-y-4">
        {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

        {screen === "upload" && <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-7">
          <h2 className="text-xl font-bold">Upload a transcript</h2><p className="mt-1 text-sm text-slate-500">A transcript becomes a staging batch. Nothing is written to the live article library at this step.</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-6 text-center">
              <FileText className="mx-auto text-sky-800" size={42}/><h3 className="mt-3 font-semibold">Choose a Word document (.docx) or text file</h3><p className="mt-1 text-sm text-slate-500">DOCX text is extracted in your browser; source text is retained in the draft batch.</p>
              <input type="file" accept=".docx,.txt,.md,.text" onChange={(event) => { const next = event.target.files?.[0] ?? null; setFile(next); if (next && !batchName) setBatchName(next.name.replace(/\.[^.]+$/, "")); }} className="mx-auto mt-4 block max-w-full text-sm"/>
              {file && <div className="mt-3 text-sm font-semibold text-sky-900">{file.name} · {(file.size / 1024).toFixed(0)} KB</div>}
            </div>
            <div className="rounded-xl bg-slate-50 p-5"><h3 className="font-semibold">What happens next?</h3><ol className="mt-3 space-y-3 text-sm text-slate-600">{["Extract topic headings and body text","Match topics to existing categories or propose new ones","Review each topic and edit its nine language versions","Approve only the topics that are ready","Commit approved topics to the live content database"].map((text, index) => <li key={text} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-700 text-xs font-bold text-white">{index + 1}</span><span>{text}</span></li>)}</ol></div>
          </div>
          <div className="mt-5"><label className="mb-1 block text-sm font-semibold">Batch name</label><input value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. Respiratory Health Talk — October 2026" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-700"/></div>
          <div className="mt-4"><label className="mb-1 block text-sm font-semibold">Or paste transcript text</label><textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={7} placeholder={"Paste transcript text. Use Heading 1/2 styles in DOCX or lines such as “1. Topic title” to separate topics."} className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-sky-700"/></div>
          <div className="mt-5 flex justify-end"><button onClick={() => void createBatch()} disabled={busy || (!file && !transcript.trim())} className="rounded-lg bg-sky-800 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Processing…" : "Extract topics and create draft batch"}</button></div>
        </div>}

        {screen === "topics" && <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Extracted topics</h2><p className="mt-1 text-sm text-slate-500">{batch ? `Batch: ${batch.name} · ${topics.length} detected topics` : "Choose a batch from Import history or upload a transcript."}</p></div>{batch && <div className="flex gap-2"><button onClick={() => setScreen("organize")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Organize categories</button><button onClick={() => void persist(batch)} className="rounded-lg bg-sky-800 px-3 py-2 text-sm font-semibold text-white">Save batch</button></div>}</div>
          {batch && <><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold">All topics ({topics.length})</span><span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900">Needs review ({topics.filter(t => t.status !== "REVIEWED").length})</span><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900">Reviewed ({topics.filter(t => t.status === "REVIEWED").length})</span><span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-900">New categories ({categories.filter(c => c.isNew).length})</span></div>
            <div className="mt-4 flex flex-wrap gap-2"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topics…" className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"/><button onClick={() => setScreen("categories")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Manage categories</button></div>
            <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Topic title","Current category","Suggested category","Languages","Review status",""].map(label => <th key={label} className="px-3 py-3">{label}</th>)}</tr></thead><tbody>{filteredTopics.map(topic => <tr key={topic.id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{topic.title}</td><td className="px-3 py-3">{topic.categoryName || "Uncategorized"}</td><td className="px-3 py-3">{topic.proposedCategory || topic.categoryName || "Choose category"}</td><td className="px-3 py-3">{SUPPORTED_LOCALES.filter(l => topic.translations[l]?.title).length}/9</td><td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${topic.status === "REVIEWED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{topic.status === "REVIEWED" ? "Reviewed" : "Needs review"}</span></td><td className="px-3 py-3"><button onClick={() => goEditor(topic.id)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold">Review</button></td></tr>)}</tbody></table></div>
            <div className="mt-4 flex justify-end gap-2"><button onClick={() => setScreen("review")} className="rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-bold text-white">Continue to batch review</button></div></>}
          {!batch && <div className="mt-5 rounded-lg bg-slate-50 p-8 text-center text-slate-500">No batch selected. Upload a transcript or open a saved batch from Import history.</div>}
        </div>}

        {screen === "categories" && <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Category management</h2><p className="mt-1 text-sm text-slate-500">Live categories are read-only here. New categories remain drafts until an approved import.</p></div><button onClick={addCategory} className="rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-bold text-white"><Plus className="mr-1 inline" size={15}/>Add category</button></div>
          <div className="mt-4 flex gap-2"><input value={categoryDraftName} onChange={(e) => setCategoryDraftName(e.target.value)} placeholder="New category name (English)" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5"/><button onClick={addCategory} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold">Create draft</button></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Category</th><th className="px-3 py-3">Slug</th><th className="px-3 py-3">Topics in batch</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th></tr></thead><tbody>{categories.map(category => <tr key={category.id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{category.name}</td><td className="px-3 py-3 text-slate-500">{category.slug}</td><td className="px-3 py-3">{topics.filter(t => t.categoryId === category.id).length}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs ${category.isNew ? "bg-violet-100 text-violet-800" : "bg-emerald-100 text-emerald-800"}`}>{category.isNew ? "Draft category" : "Existing"}</span></td><td className="px-3 py-3">{category.isNew ? <button onClick={() => { if (!batch) return; setBatch({ ...batch, data: { ...batch.data, categories: categories.filter(c => c.id !== category.id), topics: topics.map(t => t.categoryId === category.id ? { ...t, categoryId: "", categoryName: "", proposedCategory: "Uncategorized" } : t) } }); }} className="text-red-700">Remove draft</button> : <span className="text-slate-400">Live category unchanged</span>}</td></tr>)}</tbody></table></div>
          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">To move a topic, use Organize Topics. Assignments made there are staged and do not change live content.</div></div>}

        {screen === "organize" && <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Organize topics by category</h2><p className="mt-1 text-sm text-slate-500">Drag a topic card into another category. These changes remain in the staging batch.</p></div><div className="flex gap-2"><button onClick={() => setScreen("categories")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Manage categories</button><button onClick={() => void persist(batch!)} disabled={!batch || busy} className="rounded-lg bg-sky-800 px-3 py-2 text-sm font-semibold text-white">Save assignments</button></div></div>
          {!batch ? <p className="mt-6 text-slate-500">Open a batch first.</p> : <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[...categories, { id: "__uncategorized", name: "Uncategorized", slug: "uncategorized", isNew: true }].map(category => <div key={category.id} onDragOver={(event) => event.preventDefault()} onDrop={() => dragTopicId && (category.id === "__uncategorized" ? updateTopic(dragTopicId, { categoryId: "", categoryName: "", proposedCategory: "Uncategorized" }) : moveTopic(dragTopicId, category))} className="min-h-48 rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2"><div className="font-bold">{category.name}</div><span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">{topics.filter(t => category.id === "__uncategorized" ? !t.categoryId : t.categoryId === category.id).length}</span></div><div className="mt-3 space-y-2">{topics.filter(t => category.id === "__uncategorized" ? !t.categoryId : t.categoryId === category.id).map(topic => <div key={topic.id} draggable onDragStart={() => setDragTopicId(topic.id)} className="flex cursor-grab items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm"><GripVertical size={15} className="shrink-0 text-slate-400"/><span className="min-w-0 flex-1">{topic.title}</span><button title="Edit topic" onClick={() => goEditor(topic.id)} className="text-sky-800">Edit</button></div>)}</div><div className="mt-2 text-center text-xs text-slate-400">Drop topic here</div></div>)}</div>}</div>}

        {screen === "editor" && selectedTopic && batch && <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5"><div><button onClick={() => setScreen("topics")} className="mb-2 text-sm font-semibold text-sky-800"><ArrowLeft className="mr-1 inline" size={15}/>Back to topics</button><div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-bold">Edit topic draft</h2><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{selectedTopic.status === "REVIEWED" ? "Reviewed" : "Needs review"}</span></div><p className="mt-1 text-sm text-slate-500">Topic {topics.findIndex(t => t.id === selectedTopic.id) + 1} of {topics.length} · Batch: {batch.name}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => { const index = topics.findIndex(t => t.id === selectedTopic.id); const previous = topics[Math.max(0, index - 1)]; if (previous) setSelectedTopicId(previous.id); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"><ChevronLeft className="inline" size={15}/> Previous</button><button onClick={() => { const index = topics.findIndex(t => t.id === selectedTopic.id); const next = topics[Math.min(topics.length - 1, index + 1)]; if (next) setSelectedTopicId(next.id); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Next <ChevronRight className="inline" size={15}/></button><button onClick={() => void persist(batch, "Topic draft saved.")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Save draft</button><button onClick={() => { updateTopic(selectedTopic.id, { status: "REVIEWED" }); setMessage("Topic marked reviewed. Save the batch to persist this status."); }} className="rounded-lg bg-sky-800 px-4 py-2 text-sm font-bold text-white">Mark as reviewed</button></div></div>
          <div className="flex flex-wrap gap-2">{([{ id: "basic", label: "Basic information & content" }, { id: "translations", label: "Translations" }, { id: "references", label: "References & tags" }, { id: "advanced", label: "Advanced data" }] as { id: Section; label: string }[]).map(item => <button key={item.id} onClick={() => setSection(item.id)} className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${section === item.id ? "border-sky-900 bg-sky-800 text-white" : "border-slate-300 bg-white text-slate-800"}`}>{item.label}</button>)}</div>
          {section === "basic" && <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-bold">Basic information</h3><p className="mt-1 text-sm text-slate-500">Article identity, category placement, and publication settings.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Topic title<input value={selectedTopic.title} onChange={(e) => updateTopic(selectedTopic.id, { title: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/></label><label className="text-sm font-semibold">Category<select value={selectedTopic.categoryId} onChange={(e) => { const cat = [...categories, ...liveCategories.map(c => ({ id: c.id, name: c.translations?.find(t => t.locale === "en")?.name ?? c.slug, slug: c.slug, isNew: false }))].find(c => c.id === e.target.value); updateTopic(selectedTopic.id, { categoryId: e.target.value, categoryName: cat?.name ?? "", proposedCategory: undefined }); }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal"><option value="">Uncategorized / choose later</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}{c.isNew ? " (draft)" : ""}</option>)}{liveCategories.filter(c => !categories.some(d => d.id === c.id)).map(c => <option key={c.id} value={c.id}>{c.translations?.find(t => t.locale === "en")?.name ?? c.slug}</option>)}</select></label></div><div className="mt-4"><label className="text-sm font-semibold">English title<input value={selectedTopic.translations.en?.title ?? ""} onChange={(e) => updateTranslation(selectedTopic.id, "en", { title: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/></label></div></div>}
          {section === "translations" && <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6"><h3 className="text-xl font-bold">Language translations</h3><p className="mt-1 text-sm text-slate-500">Choose a language. A dot indicates that a title exists for that language. Mark each language reviewed independently, then save all translations together.</p>
            <div className="mt-5 flex flex-wrap gap-1.5 border-b border-slate-200">{SUPPORTED_LOCALES.map(language => { const translation = selectedTopic.translations[language] ?? emptyTranslation(); const hasTitle = Boolean(translation.title.trim()); return <button key={language} onClick={() => setLocale(language)} className={`inline-flex items-center gap-2 rounded-t-lg border border-b-0 px-3 py-2.5 text-sm font-semibold ${locale === language ? "border-sky-800 bg-sky-800 text-white" : "border-slate-200 bg-slate-50 text-slate-800"}`}>{LANGUAGE_NAMES[language] ?? language}<span className={`h-2 w-2 rounded-full ${translation.reviewed ? "bg-emerald-400" : hasTitle ? "bg-amber-400" : locale === language ? "bg-white/70" : "bg-slate-300"}`}/></button>; })}</div>
            {(() => { const translation = selectedTopic.translations[locale] ?? emptyTranslation(); return <div className="rounded-b-xl rounded-tr-xl border border-slate-200 p-4 md:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h4 className="text-lg font-bold">{LANGUAGE_NAMES[locale]} translation</h4><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${translation.title.trim() ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{translation.title.trim() ? "Title present" : "Title missing"}</span><button onClick={() => { if (!translation.reviewed && !translation.title.trim()) { setError(`Add a ${LANGUAGE_NAMES[locale]} title before marking this translation reviewed.`); return; } setError(""); updateTranslation(selectedTopic.id, locale, { reviewed: !translation.reviewed, status: translation.reviewed ? "IN_PROGRESS" : "REVIEWED" }); }} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${translation.reviewed ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-sky-700 text-sky-800"}`}>{translation.reviewed ? <><CheckCircle2 className="mr-1 inline" size={15}/>Reviewed</> : "Mark this language reviewed"}</button></div></div>
              <div className="mt-4 space-y-4"><label className="block text-sm font-semibold">Title {locale === "en" && <span className="text-red-600">*</span>}<input value={translation.title} onChange={(e) => updateTranslation(selectedTopic.id, locale, { title: e.target.value, reviewed: false })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3 text-base font-normal outline-none focus:border-sky-700"/></label><label className="block text-sm font-semibold">Description<textarea rows={3} value={translation.description} onChange={(e) => updateTranslation(selectedTopic.id, locale, { description: e.target.value, reviewed: false })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3 text-base font-normal outline-none focus:border-sky-700"/></label><label className="block text-sm font-semibold">Introduction<textarea rows={5} value={translation.introduction} onChange={(e) => updateTranslation(selectedTopic.id, locale, { introduction: e.target.value, reviewed: false })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3 text-base font-normal outline-none focus:border-sky-700"/></label><label className="block text-sm font-semibold">Main content<textarea rows={6} value={translation.body} onChange={(e) => updateTranslation(selectedTopic.id, locale, { body: e.target.value, reviewed: false })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3 text-base font-normal outline-none focus:border-sky-700"/></label><div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-semibold">Instructions<textarea rows={3} value={translation.instructions} onChange={(e) => updateTranslation(selectedTopic.id, locale, { instructions: e.target.value, reviewed: false })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3 font-normal"/></label><label className="block text-sm font-semibold">Precautions<textarea rows={3} value={translation.precautions} onChange={(e) => updateTranslation(selectedTopic.id, locale, { precautions: e.target.value, reviewed: false })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3 font-normal"/></label></div></div>
              <div className="mt-5 flex justify-end"><button onClick={() => void persist(batch, "All translations saved for this topic.")} disabled={busy} className="rounded-lg bg-sky-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save className="mr-2 inline" size={16}/>Save all translations</button></div>
            </div>; })()}
          </div>}
          {section === "references" && <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-bold">References & tags</h3><p className="mt-1 text-sm text-slate-500">Reference and tag drafts will be staged with this topic. The source transcript is preserved in the batch.</p><div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Use Advanced data to inspect the extracted source text and current draft status.</div></div>}
          {section === "advanced" && <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-bold">Advanced data</h3><dl className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs uppercase text-slate-500">Draft ID</dt><dd className="mt-1 break-all text-sm">{selectedTopic.id}</dd></div><div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs uppercase text-slate-500">Batch source</dt><dd className="mt-1 text-sm">{batch.sourceFileName || "Pasted transcript"}</dd></div></dl><label className="mt-4 block text-sm font-semibold">Original extracted transcript<textarea readOnly value={batch.sourceText ?? ""} rows={9} className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 font-normal"/></label></div>}
        </div>}

        {screen === "review" && <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Batch review</h2><p className="mt-1 text-sm text-slate-500">Review topic and translation statuses before committing anything to live content.</p></div><button onClick={() => batch && void persist({ ...batch, status: readyCount === topics.length && topics.length ? "READY" : "IN_REVIEW" }, "Batch review status saved.")} disabled={!batch || busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Save review status</button></div>
          {batch && <><div className="mt-5 grid gap-3 sm:grid-cols-4">{[{ label: "Total topics", value: topics.length, color: "bg-slate-50" }, { label: "Ready to import", value: readyCount, color: "bg-emerald-50" }, { label: "Needs review", value: needsReviewCount, color: "bg-amber-50" }, { label: "Draft categories", value: categories.filter(c => c.isNew).length, color: "bg-violet-50" }].map(item => <div key={item.label} className={`rounded-xl p-4 ${item.color}`}><div className="text-sm text-slate-500">{item.label}</div><div className="mt-1 text-3xl font-bold">{item.value}</div></div>)}</div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Topic</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Languages reviewed</th><th className="px-3 py-3">Topic review</th><th className="px-3 py-3">Action</th></tr></thead><tbody>{topics.map(topic => <tr key={topic.id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{topic.title}</td><td className="px-3 py-3">{topic.categoryName || "Uncategorized"}</td><td className="px-3 py-3">{SUPPORTED_LOCALES.filter(l => topic.translations[l]?.reviewed).length}/9</td><td className="px-3 py-3">{topic.status === "REVIEWED" ? "Reviewed" : "Needs review"}</td><td className="px-3 py-3"><button onClick={() => goEditor(topic.id)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold">Review</button></td></tr>)}</tbody></table></div><div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Live import is intentionally gated.</strong> This staging implementation saves and reviews drafts separately. The final database commit action is not enabled until category creation, translation validation, and the live-record mapping are verified.</div></>}
        </div>}

        {screen === "summary" && <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Batch summary &amp; import</h2><p className="mt-1 text-sm text-slate-500">Final readiness check before anything enters the live content database.</p></div><button onClick={() => setScreen("history")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"><History className="mr-1 inline" size={15}/>Past batches</button></div>
          {batch ? <><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{label:"Total topics",value:topics.length,style:"bg-slate-50"},{label:"Ready to import",value:readyCount,style:"bg-emerald-50"},{label:"Needs review",value:needsReviewCount,style:"bg-amber-50"},{label:"Errors",value:0,style:"bg-red-50"}].map(item=><div key={item.label} className={`rounded-xl p-4 ${item.style}`}><div className="text-sm text-slate-500">{item.label}</div><div className="mt-1 text-3xl font-bold">{item.value}</div></div>)}</div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Topic</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Languages</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Next action</th></tr></thead><tbody>{topics.map(topic=><tr key={topic.id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{topic.title}</td><td className="px-3 py-3">{topic.categoryName || "Uncategorized"}</td><td className="px-3 py-3">{SUPPORTED_LOCALES.filter(l=>topic.translations[l]?.title).length}/9 titled · {SUPPORTED_LOCALES.filter(l=>topic.translations[l]?.reviewed).length}/9 reviewed</td><td className="px-3 py-3">{topic.status === "REVIEWED" && SUPPORTED_LOCALES.every(l=>topic.translations[l]?.reviewed) ? "Ready" : "Needs review"}</td><td className="px-3 py-3"><button onClick={()=>goEditor(topic.id)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold">Review topic</button></td></tr>)}</tbody></table></div>
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><div className="font-bold">Live import is not enabled yet</div><p className="mt-1">Draft storage, topic organization, and review are isolated from live articles. The final import action stays disabled until the mapping of all nine translations and draft categories to the live Prisma records is validated. This prevents incomplete translations or new categories from being published accidentally.</p></div><div className="mt-4 flex flex-wrap justify-end gap-2"><button onClick={()=>void persist({...batch,status:readyCount===topics.length && topics.length ? "READY" : "IN_REVIEW"},"Batch summary saved.")} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">Save batch status</button><button disabled className="cursor-not-allowed rounded-lg bg-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600">Import selected topics to database</button></div></> : <div className="py-10 text-center text-slate-500">Open a staging batch from Import history first.</div>}</div>}

        {screen === "history" && <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Import history</h2><p className="mt-1 text-sm text-slate-500">Open, review, or remove staging batches. Deleting a batch never deletes live articles.</p></div><button onClick={() => setScreen("upload")} className="rounded-lg bg-sky-800 px-4 py-2.5 text-sm font-bold text-white"><Plus className="mr-1 inline" size={15}/>New batch</button></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Batch / source</th><th className="px-3 py-3">Topics</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{batches.map(item => <tr key={item.id} className="border-t border-slate-100"><td className="whitespace-nowrap px-3 py-3">{new Date(item.updatedAt).toLocaleString()}</td><td className="px-3 py-3"><div className="font-semibold">{item.name}</div><div className="text-xs text-slate-500">{item.sourceFileName || "Pasted transcript"}</div></td><td className="px-3 py-3">{item.data?.topics?.length ?? 0}</td><td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{item.status}</span></td><td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => openBatch(item)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold">Open</button><button onClick={() => void deleteBatch(item.id)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700"><X size={13}/></button></div></td></tr>)}</tbody></table>{!batches.length && <div className="py-10 text-center text-slate-500">No intake batches yet.</div>}</div></div>}
      </section>
    </div>
  </main>;
}
