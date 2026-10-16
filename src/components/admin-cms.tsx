"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { SUPPORTED_LOCALES } from "@/lib/locale";

type JsonRecord = Record<string, unknown>;
type Translation = JsonRecord & {
  id?: string;
  locale?: string;
  title?: string;
  references?: unknown[];
};
type EditorTranslation = Record<string, string>;
type Category = {
  id: string;
  slug: string;
  enabled: boolean;
  sortOrder: number;
  translations: { locale: string; name: string; description?: string | null }[];
};
type Topic = {
  id: string;
  categoryId: string;
  sitting: string | null;
  date: string | null;
  published: boolean;
  sortOrder: number;
  translations: (Translation & { id: string; locale: string; title: string; references?: unknown[] })[];
};
type Payload = {
  categories: Category[];
  topics: Topic[];
  healthNotice: unknown;
  stats: { categories: number; topics: number; published: number; unpublished: number; translations: number; categoryTranslations: number; locales: string[] };
};
type Section = "content" | "translations" | "references" | "advanced";

const locales = [...SUPPORTED_LOCALES];
const jsonFields = ["contentBlocks", "materials", "instructions", "precautions", "nameDetails", "legacyData", "references"];
const blankTranslation = (): EditorTranslation => ({
  title: "", description: "", introduction: "", body: "", contentBlocks: "[]",
  purpose: "", spiritualGoal: "", materials: "[]", instructions: "[]",
  precautions: "[]", healthNoticeOverride: "", urduText: "", urdu: "",
  englishDescription: "", displayTitle: "", nameDetails: "{}", tags: "",
  legacyData: "{}", references: "[]",
});
const fields: [string, string, boolean?][] = [
  ["title", "Article title", true],
  ["description", "Short description"],
  ["introduction", "Introduction"],
  ["body", "Main body"],
  ["contentBlocks", "Content blocks (JSON)"],
  ["purpose", "Purpose"],
  ["spiritualGoal", "Spiritual goal"],
  ["materials", "Materials (JSON)"],
  ["instructions", "Instructions (JSON)"],
  ["precautions", "Precautions (JSON)"],
  ["healthNoticeOverride", "Article-specific health notice"],
  ["urduText", "Urdu text"],
  ["urdu", "Urdu content"],
  ["englishDescription", "English description"],
  ["displayTitle", "Display title"],
  ["nameDetails", "Name details (JSON)"],
  ["tags", "Tags (comma separated)"],
  ["references", "References (JSON array)"],
  ["legacyData", "Legacy data (JSON)"],
];
const toEditor = (translation?: Translation): EditorTranslation => {
  const result = blankTranslation();
  if (!translation) return result;
  for (const key of Object.keys(result)) {
    const value = translation[key];
    if (jsonFields.includes(key)) {
      if (value != null) result[key] = JSON.stringify(value, null, 2) ?? "";
    } else if (key === "tags") {
      result[key] = Array.isArray(value) ? value.join(", ") : "";
    } else {
      result[key] = typeof value === "string" ? value : "";
    }
  }
  return result;
};
const parseTranslation = (raw: EditorTranslation): JsonRecord => {
  const result: JsonRecord = {
    ...raw,
    tags: raw.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
  };
  for (const key of jsonFields) {
    try {
      result[key] = raw[key]?.trim() ? JSON.parse(raw[key]) : null;
    } catch {
      throw new Error(`Invalid JSON in “${fields.find(([name]) => name === key)?.[1] ?? key}”. Check its syntax before saving.`);
    }
  }
  return result;
};

const css: Record<string, CSSProperties> = {
  page: { maxWidth: 1440, margin: "0 auto", padding: "28px clamp(16px, 3vw, 36px) 64px", color: "var(--foreground,#17212b)", fontFamily: "Arial, Helvetica, sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 26 },
  eyebrow: { margin: "0 0 8px", color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" },
  h1: { margin: 0, fontSize: 30, lineHeight: 1.2, letterSpacing: "-0.8px" },
  muted: { color: "#64748b", lineHeight: 1.5 },
  button: { border: "1px solid #d5dee8", borderRadius: 9, padding: "10px 14px", background: "#fff", color: "#243447", cursor: "pointer", fontWeight: 650, fontSize: 13 },
  primary: { border: "1px solid #145c8b", borderRadius: 9, padding: "10px 15px", background: "#145c8b", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 },
  danger: { border: "1px solid #fecaca", borderRadius: 9, padding: "9px 12px", background: "#fff", color: "#b91c1c", cursor: "pointer", fontWeight: 650, fontSize: 13 },
  input: { boxSizing: "border-box", width: "100%", minWidth: 0, padding: "11px 12px", border: "1px solid #d5dee8", borderRadius: 8, font: "inherit", fontSize: 14, background: "#fff", color: "#17212b" },
  label: { display: "grid", alignContent: "start", gap: 7, fontSize: 12, fontWeight: 700, color: "#334155", minWidth: 0 },
  card: { border: "1px solid #dce4ec", borderRadius: 13, padding: 18, background: "#fff" },
  pill: { display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, padding: "4px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" },
};
const inputStyle: CSSProperties = css.input;

function Field({ label, value, onChange, disabled = false, required = false, multiline = false, rows = 4, hint }: {
  label: string; value: string; onChange: (value: string) => void; disabled?: boolean; required?: boolean; multiline?: boolean; rows?: number; hint?: string;
}) {
  return <label style={css.label}>{label}{required ? " *" : ""}
    {multiline ? <textarea rows={rows} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.55, minHeight: rows * 25 }} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} /> : <input style={inputStyle} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />}
    {hint && <span style={{ color: "#64748b", fontWeight: 400, fontSize: 11 }}>{hint}</span>}
  </label>;
}
function Status({ published }: { published: boolean }) {
  return <span style={{ ...css.pill, background: published ? "#e8f7ee" : "#fff5df", color: published ? "#17633a" : "#8a5700" }}>{published ? "Published" : "Draft"}</span>;
}

export function AdminCms() {
  const [data, setData] = useState<Payload | null>(null);
  const [tab, setTab] = useState<"overview" | "articles" | "categories" | "settings">("articles");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [healthNotice, setHealthNotice] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [topicId, setTopicId] = useState("");
  const [topicMeta, setTopicMeta] = useState({ id: "", categoryId: "", sitting: "", date: "", published: false, sortOrder: 0 });
  const [translations, setTranslations] = useState<Record<string, EditorTranslation>>({});
  const [locale, setLocale] = useState("en");
  const [section, setSection] = useState<Section>("content");
  const [categoryId, setCategoryId] = useState("");
  const [categoryMeta, setCategoryMeta] = useState({ id: "", slug: "", enabled: true, sortOrder: 0 });
  const [categoryTranslations, setCategoryTranslations] = useState<Record<string, { name: string; description: string }>>({});
  const [categoryLocale, setCategoryLocale] = useState("en");
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [view, setView] = useState<"list" | "editor">("list");

  const notify = (text: string, error = false) => { setMessage(text); setMessageError(error); };
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load admin data");
      setData(result as Payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load data");
      setMessageError(true);
    } finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setHealthNotice(typeof data?.healthNotice === "string" ? data.healthNotice : ""); }, [data?.healthNotice]);

  const filteredTopics = useMemo(() => (data?.topics ?? []).filter((topic) =>
    (categoryFilter === "all" || topic.categoryId === categoryFilter) &&
    (statusFilter === "all" || (statusFilter === "published" ? topic.published : !topic.published)) &&
    (topic.id.toLowerCase().includes(search.toLowerCase()) || topic.translations.some((translation) => translation.title?.toLowerCase().includes(search.toLowerCase())))
  ), [data, categoryFilter, statusFilter, search]);
  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageTopics = filteredTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allPageSelected = pageTopics.length > 0 && pageTopics.every((topic) => selectedIds.includes(topic.id));

  const openTopic = (topic?: Topic) => {
    setTopicId(topic?.id ?? "");
    setTopicMeta(topic ? {
      id: topic.id, categoryId: topic.categoryId, sitting: topic.sitting ?? "",
      date: topic.date ?? "", published: topic.published, sortOrder: topic.sortOrder,
    } : {
      id: "", categoryId: data?.categories[0]?.id ?? "", sitting: "", date: "",
      published: false, sortOrder: (data?.topics.length ?? 0) + 1,
    });
    const mapped: Record<string, EditorTranslation> = {};
    for (const language of locales) mapped[language] = toEditor(topic?.translations.find((item) => item.locale === language));
    setTranslations(mapped);
    setLocale("en");
    setSection("content");
    setView("editor");
    notify("");
  };

  const saveTopic = async () => {
    setBusy(true); notify("");
    try {
      const clean: Record<string, JsonRecord> = {};
      for (const [language, raw] of Object.entries(translations)) {
        if (raw.title.trim()) clean[language] = parseTranslation(raw);
      }
      if (!clean.en?.title || typeof clean.en.title !== "string" || !clean.en.title.trim()) throw new Error("Add an English article title before saving.");
      if (!topicMeta.categoryId) throw new Error("Select a category.");
      const payload = { kind: "topic", ...topicMeta, translations: clean };
      const response = await fetch("/api/admin", {
        method: topicId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topicId ? payload : { ...payload, id: topicMeta.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save article.");
      await load();
      setView("list");
      notify("Article saved successfully.");
    } catch (error) { notify(error instanceof Error ? error.message : "Save failed.", true); }
    finally { setBusy(false); }
  };

  const removeTopic = async (topic: Topic) => {
    if (!window.confirm(`Delete “${topic.translations.find((item) => item.locale === "en")?.title || topic.id}” and all its translations? This cannot be undone.`)) return;
    setBusy(true); notify("");
    try {
      const response = await fetch(`/api/admin?kind=topic&id=${encodeURIComponent(topic.id)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Delete failed");
      setSelectedIds((old) => old.filter((id) => id !== topic.id));
      await load(); notify("Article deleted.");
    } catch (error) { notify(error instanceof Error ? error.message : "Delete failed.", true); }
    finally { setBusy(false); }
  };

  const quickPublish = async (topic: Topic, published: boolean) => {
    setBusy(true); notify("");
    try {
      const response = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "topic", id: topic.id, published }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Update failed");
      await load(); notify(published ? "Article published." : "Article unpublished.");
    } catch (error) { notify(error instanceof Error ? error.message : "Update failed.", true); }
    finally { setBusy(false); }
  };

  const bulkUpdate = async (patch: { categoryId?: string; published?: boolean }) => {
    if (!selectedIds.length) return;
    const action = patch.categoryId ? "move selected articles" : patch.published ? "publish selected articles" : "unpublish selected articles";
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    setBusy(true); notify("");
    try {
      for (const id of selectedIds) {
        const response = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "topic", id, ...patch }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Could not update ${id}`);
      }
      setSelectedIds([]); await load(); notify("Selected articles updated.");
    } catch (error) { notify(error instanceof Error ? error.message : "Bulk update failed.", true); }
    finally { setBusy(false); }
  };

  const openCategory = (category?: Category) => {
    setCategoryId(category?.id ?? "");
    setCategoryMeta(category ? { id: category.id, slug: category.slug, enabled: category.enabled, sortOrder: category.sortOrder } : { id: "", slug: "", enabled: true, sortOrder: (data?.categories.length ?? 0) + 1 });
    const mapped: Record<string, { name: string; description: string }> = {};
    for (const language of locales) {
      const translation = category?.translations.find((item) => item.locale === language);
      mapped[language] = { name: translation?.name ?? "", description: translation?.description ?? "" };
    }
    setCategoryTranslations(mapped); setCategoryLocale("en");
    setTab("categories"); setView("list"); setCategoryEditorOpen(true); notify("");
  };

  const saveCategory = async () => {
    setBusy(true); notify("");
    try {
      if (!categoryMeta.id.trim() || !categoryMeta.slug.trim()) throw new Error("Category ID and URL slug are required.");
      if (!categoryTranslations.en?.name.trim()) throw new Error("Add an English category name.");
      const payload = { kind: "category", ...categoryMeta, translations: categoryTranslations };
      const response = await fetch("/api/admin", { method: categoryId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(categoryId ? payload : { ...payload, id: categoryMeta.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save category.");
      setCategoryEditorOpen(false); await load(); notify("Category saved.");
    } catch (error) { notify(error instanceof Error ? error.message : "Save failed.", true); }
    finally { setBusy(false); }
  };

  const updateCategory = async (category: Category, patch: Partial<Category>) => {
    setBusy(true); notify("");
    try {
      const response = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "category", id: category.id, ...patch }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Category update failed");
      await load(); notify("Category updated.");
    } catch (error) { notify(error instanceof Error ? error.message : "Update failed.", true); }
    finally { setBusy(false); }
  };

  const saveHealthNotice = async () => {
    setBusy(true); notify("");
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "setting", value: healthNotice }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save notice.");
      await load(); notify("Shared health notice saved.");
    } catch (error) { notify(error instanceof Error ? error.message : "Save failed.", true); }
    finally { setBusy(false); }
  };

  const setField = (key: string, value: string) => setTranslations((old) => ({ ...old, [locale]: { ...old[locale], [key]: value } }));
  const activeTranslation = translations[locale] ?? blankTranslation();
  const localeHasTitle = (language: string) => Boolean(translations[language]?.title?.trim());
  const navItems: ["overview" | "articles" | "categories" | "settings", string][] = [["overview", "Overview"], ["articles", "Articles"], ["categories", "Categories"], ["settings", "Settings"]];

  const pageHeader = (eyebrow: string, title: string, description: string, action?: ReactNode) => (
    <header style={css.header}><div><p style={css.eyebrow}>{eyebrow}</p><h1 style={css.h1}>{title}</h1><p style={{ ...css.muted, margin: "8px 0 0" }}>{description}</p></div>{action}</header>
  );
  const sectionButton = (key: Section, label: string) => <button key={key} style={{ ...(section === key ? css.primary : css.button), borderRadius: 8 }} onClick={() => setSection(key)}>{label}</button>;

  return <main style={css.page}>
    {view === "editor" ? <>
      {pageHeader("HEALTHGUIDE / ARTICLES", topicId ? "Edit article" : "New article", "Edit content and translations. Changes are saved to the existing database record.", <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button style={css.button} onClick={() => { setView("list"); notify(""); }}>Cancel</button><button style={css.primary} disabled={busy} onClick={() => void saveTopic()}>{busy ? "Saving…" : "Save article"}</button></div>)}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {sectionButton("content", "Basic information & content")}
        {sectionButton("translations", "Translations")}
        {sectionButton("references", "References & tags")}
        {sectionButton("advanced", "Advanced data")}
      </div>
      <section style={css.card}>
        {section === "content" && <>
          <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>Basic information</h2>
          <p style={{ ...css.muted, marginTop: 0 }}>Article identity, placement, and publication settings.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 24 }}>
            <Field label="Article ID" value={topicMeta.id} disabled={Boolean(topicId)} onChange={(value) => setTopicMeta({ ...topicMeta, id: value })} required />
            <label style={css.label}>Category *<select style={inputStyle} value={topicMeta.categoryId} onChange={(event) => setTopicMeta({ ...topicMeta, categoryId: event.target.value })}>{data?.categories.map((category) => <option key={category.id} value={category.id}>{category.translations.find((item) => item.locale === "en")?.name || category.id}{category.enabled ? "" : " (disabled)"}</option>)}</select></label>
            <Field label="Sitting / grouping" value={topicMeta.sitting} onChange={(value) => setTopicMeta({ ...topicMeta, sitting: value })} />
            <Field label="Date label" value={topicMeta.date} onChange={(value) => setTopicMeta({ ...topicMeta, date: value })} hint="Keep the existing display format if this is already used on the site." />
            <Field label="Sort order" value={String(topicMeta.sortOrder)} onChange={(value) => setTopicMeta({ ...topicMeta, sortOrder: Number(value) || 0 })} />
            <label style={css.label}>Publication status<select style={inputStyle} value={topicMeta.published ? "published" : "draft"} onChange={(event) => setTopicMeta({ ...topicMeta, published: event.target.value === "published" })}><option value="draft">Draft / unpublished</option><option value="published">Published</option></select></label>
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>English content</h2>
          <p style={{ ...css.muted, marginTop: 0 }}>English is required. Switch to the Translations section to edit other languages.</p>
          <div style={{ display: "grid", gap: 16 }}>
            <Field label="Title" required value={translations.en?.title ?? ""} onChange={(value) => setTranslations((old) => ({ ...old, en: { ...old.en, title: value } }))} />
            <Field label="Short description" value={translations.en?.description ?? ""} multiline rows={3} onChange={(value) => setTranslations((old) => ({ ...old, en: { ...old.en, description: value } }))} />
            <Field label="Introduction" value={translations.en?.introduction ?? ""} multiline rows={4} onChange={(value) => setTranslations((old) => ({ ...old, en: { ...old.en, introduction: value } }))} />
            <Field label="Main body" value={translations.en?.body ?? ""} multiline rows={10} onChange={(value) => setTranslations((old) => ({ ...old, en: { ...old.en, body: value } }))} />
            <Field label="Purpose" value={translations.en?.purpose ?? ""} multiline rows={4} onChange={(value) => setTranslations((old) => ({ ...old, en: { ...old.en, purpose: value } }))} />
            <Field label="Spiritual goal" value={translations.en?.spiritualGoal ?? ""} multiline rows={4} onChange={(value) => setTranslations((old) => ({ ...old, en: { ...old.en, spiritualGoal: value } }))} />
            <Field label="Article-specific health notice" value={translations.en?.healthNoticeOverride ?? ""} multiline rows={3} onChange={(value) => setTranslations((old) => ({ ...old, en: { ...old.en, healthNoticeOverride: value } }))} />
          </div>
        </>}
        {section === "translations" && <>
          <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>Language translations</h2>
          <p style={{ ...css.muted, marginTop: 0 }}>Choose a language. A dot indicates that a title exists for that language. Saving preserves translations with a title.</p>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
            {locales.map((language) => <button key={language} style={locale === language ? css.primary : css.button} onClick={() => setLocale(language)}>{language} {localeHasTitle(language) ? "●" : "○"}</button>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>{locale.toUpperCase()} translation</h3>
            <span style={{ ...css.pill, background: localeHasTitle(locale) ? "#e8f7ee" : "#f1f5f9", color: localeHasTitle(locale) ? "#17633a" : "#64748b" }}>{localeHasTitle(locale) ? "Title present" : "Not yet translated"}</span>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            <Field label="Title" required={locale === "en"} value={activeTranslation.title} onChange={(value) => setField("title", value)} />
            <Field label="Description" value={activeTranslation.description} multiline rows={3} onChange={(value) => setField("description", value)} />
            <Field label="Introduction" value={activeTranslation.introduction} multiline rows={4} onChange={(value) => setField("introduction", value)} />
            <Field label="Main body" value={activeTranslation.body} multiline rows={10} onChange={(value) => setField("body", value)} />
            <Field label="Purpose" value={activeTranslation.purpose} multiline rows={3} onChange={(value) => setField("purpose", value)} />
            <Field label="Spiritual goal" value={activeTranslation.spiritualGoal} multiline rows={3} onChange={(value) => setField("spiritualGoal", value)} />
            <Field label="Urdu text" value={activeTranslation.urduText} multiline rows={3} onChange={(value) => setField("urduText", value)} />
            <Field label="Urdu content" value={activeTranslation.urdu} multiline rows={4} onChange={(value) => setField("urdu", value)} />
            <Field label="English description" value={activeTranslation.englishDescription} multiline rows={3} onChange={(value) => setField("englishDescription", value)} />
            <Field label="Display title" value={activeTranslation.displayTitle} onChange={(value) => setField("displayTitle", value)} />
            <Field label="Article-specific health notice" value={activeTranslation.healthNoticeOverride} multiline rows={3} onChange={(value) => setField("healthNoticeOverride", value)} />
          </div>
        </>}
        {section === "references" && <>
          <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>References and tags</h2>
          <p style={{ ...css.muted, marginTop: 0 }}>References must be a valid JSON array. Tags are comma-separated.</p>
          <div style={{ display: "grid", gap: 16 }}>
            <Field label="Tags" value={activeTranslation.tags} onChange={(value) => setField("tags", value)} hint="Example: prevention, nutrition, wellness" />
            <Field label="References (JSON)" value={activeTranslation.references} multiline rows={10} onChange={(value) => setField("references", value)} hint={'Example: [{"title":"Source","citation":"Author, year","url":"https://…","sortOrder":0}]'} />
          </div>
        </>}
        {section === "advanced" && <>
          <h2 style={{ margin: "0 0 6px", fontSize: 19 }}>Advanced structured data</h2>
          <p style={{ ...css.muted, marginTop: 0 }}>These fields are stored as JSON. Edit only if you understand the existing structure. Invalid JSON prevents saving.</p>
          <div style={{ display: "grid", gap: 16 }}>
            <Field label="Content blocks (JSON)" value={activeTranslation.contentBlocks} multiline rows={8} onChange={(value) => setField("contentBlocks", value)} />
            <Field label="Materials (JSON)" value={activeTranslation.materials} multiline rows={5} onChange={(value) => setField("materials", value)} />
            <Field label="Instructions (JSON)" value={activeTranslation.instructions} multiline rows={5} onChange={(value) => setField("instructions", value)} />
            <Field label="Precautions (JSON)" value={activeTranslation.precautions} multiline rows={5} onChange={(value) => setField("precautions", value)} />
            <Field label="Name details (JSON)" value={activeTranslation.nameDetails} multiline rows={5} onChange={(value) => setField("nameDetails", value)} />
            <Field label="Legacy data (JSON)" value={activeTranslation.legacyData} multiline rows={10} onChange={(value) => setField("legacyData", value)} hint="Preserved for compatibility with existing content. Do not remove keys unless you have checked how the public site uses them." />
          </div>
        </>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", borderTop: "1px solid #e2e8f0", paddingTop: 18, marginTop: 24 }}>
          <button style={css.button} onClick={() => setView("list")}>← Back to articles</button>
          <div style={{ display: "flex", gap: 8 }}><button style={css.button} onClick={() => { setView("list"); notify(""); }}>Cancel</button><button style={css.primary} disabled={busy} onClick={() => void saveTopic()}>{busy ? "Saving…" : "Save article"}</button></div>
        </div>
      </section>
    </> : <>
      {pageHeader("HEALTHGUIDE / CONTENT MANAGEMENT", "Admin workspace", "Manage articles, translations, categories, and global settings stored in PostgreSQL.", <button style={css.button} disabled={busy} onClick={() => void load()}>{busy ? "Refreshing…" : "↻ Refresh data"}</button>)}
      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 16 }}>
        {navItems.map(([key, label]) => <button key={key} style={tab === key ? css.primary : css.button} onClick={() => { setTab(key); setCategoryEditorOpen(false); }}>{label}</button>)}
      </nav>

      {tab === "overview" && data && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
        {[
          ["Total articles", data.stats.topics, "Across all categories"],
          ["Published", data.stats.published, "Visible if category is enabled"],
          ["Drafts", data.stats.unpublished, "Not visible on public site"],
          ["Categories", data.stats.categories, "Content groups"],
          ["Article translations", data.stats.translations, "Across supported languages"],
          ["Category translations", data.stats.categoryTranslations, "Localized category labels"],
        ].map(([label, value, detail]) => <div key={String(label)} style={css.card}><div style={css.muted}>{label}</div><div style={{ fontSize: 30, fontWeight: 750, margin: "12px 0 4px" }}>{value}</div><div style={{ ...css.muted, fontSize: 12 }}>{detail}</div></div>)}
        <div style={{ ...css.card, gridColumn: "1 / -1" }}><h2 style={{ marginTop: 0, fontSize: 18 }}>Translation coverage</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>{locales.map((language) => { const count = data.topics.filter((topic) => topic.translations.some((translation) => translation.locale === language && translation.title)).length; return <div key={language} style={{ border: "1px solid #e2e8f0", borderRadius: 9, padding: 12 }}><strong>{language}</strong><div style={{ ...css.muted, fontSize: 12, marginTop: 5 }}>{count} / {data.topics.length} articles</div><div style={{ height: 5, background: "#e2e8f0", borderRadius: 99, marginTop: 9, overflow: "hidden" }}><div style={{ height: "100%", width: `${data.topics.length ? count / data.topics.length * 100 : 0}%`, background: "#17618c" }} /></div></div>; })}</div></div>
      </div>}

      {tab === "articles" && data && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 16 }}>
          <Field label="Search articles" value={search} onChange={(value) => { setSearch(value); setPage(1); }} hint="Search by ID or title" />
          <label style={css.label}>Category<select style={inputStyle} value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); setSelectedIds([]); }}><option value="all">All categories ({data.topics.length})</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.translations.find((item) => item.locale === "en")?.name || category.id} ({data.topics.filter((topic) => topic.categoryId === category.id).length}){category.enabled ? "" : " — disabled"}</option>)}</select></label>
          <label style={css.label}>Publication status<select style={inputStyle} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1); setSelectedIds([]); }}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft / unpublished</option></select></label>
          <div style={{ display: "flex", alignItems: "end" }}><button style={{ ...css.primary, width: "100%", padding: 12 }} onClick={() => openTopic()}>＋ New article</button></div>
        </div>

        {selectedIds.length > 0 && <div style={{ ...css.card, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14, padding: 12 }}>
          <strong>{selectedIds.length} selected</strong>
          <label style={{ ...css.label, minWidth: 190, flex: "1 1 190px" }}><span>Move to category</span><select id="bulk-category-target" style={inputStyle} defaultValue=""><option value="">Choose category…</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.translations.find((item) => item.locale === "en")?.name || category.id}</option>)}</select></label>
          <button style={css.button} disabled={busy} onClick={() => { const element = document.getElementById("bulk-category-target") as HTMLSelectElement | null; if (element?.value) void bulkUpdate({ categoryId: element.value }); }}>Move</button>
          <button style={css.button} disabled={busy} onClick={() => void bulkUpdate({ published: true })}>Publish</button>
          <button style={css.button} disabled={busy} onClick={() => void bulkUpdate({ published: false })}>Unpublish</button>
          <button style={css.button} onClick={() => setSelectedIds([])}>Clear selection</button>
        </div>}

        <div style={{ ...css.card, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", borderBottom: "1px solid #e2e8f0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 650 }}><input type="checkbox" checked={allPageSelected} onChange={(event) => setSelectedIds((old) => event.target.checked ? [...new Set([...old, ...pageTopics.map((topic) => topic.id)])] : old.filter((id) => !pageTopics.some((topic) => topic.id === id)))} /> Select page</label>
            <span style={{ ...css.muted, fontSize: 12 }}>Showing {filteredTopics.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredTopics.length)} of {filteredTopics.length} matching articles</span>
          </div>
          {pageTopics.length === 0 ? <div style={{ padding: 36, textAlign: "center" }}><h3 style={{ margin: "0 0 8px" }}>No articles found</h3><p style={{ ...css.muted, margin: 0 }}>Try another search term or change the filters.</p></div> : <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 760 }}>
              <thead><tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>{["", "Article", "Category", "Translations", "Status", "Actions"].map((label, index) => <th key={label || index} style={{ padding: "12px 13px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</th>)}</tr></thead>
              <tbody>{pageTopics.map((topic) => {
                const title = topic.translations.find((translation) => translation.locale === "en")?.title || topic.id;
                const category = data.categories.find((item) => item.id === topic.categoryId);
                const categoryName = category?.translations.find((item) => item.locale === "en")?.name || category?.id || topic.categoryId;
                const count = topic.translations.filter((translation) => Boolean(translation.title)).length;
                return <tr key={topic.id}>
                  <td style={{ padding: "15px 13px", borderBottom: "1px solid #edf2f7" }}><input type="checkbox" aria-label={`Select ${title}`} checked={selectedIds.includes(topic.id)} onChange={(event) => setSelectedIds((old) => event.target.checked ? [...new Set([...old, topic.id])] : old.filter((id) => id !== topic.id))} /></td>
                  <td style={{ padding: "15px 13px", borderBottom: "1px solid #edf2f7", minWidth: 260 }}><button style={{ border: 0, padding: 0, background: "none", color: "#145c8b", cursor: "pointer", textAlign: "left", fontWeight: 750, fontSize: 13 }} onClick={() => openTopic(topic)}>{title}</button><div style={{ ...css.muted, fontSize: 11, marginTop: 5 }}>{topic.id}{topic.sitting ? ` · ${topic.sitting}` : ""}</div></td>
                  <td style={{ padding: "15px 13px", borderBottom: "1px solid #edf2f7", minWidth: 140 }}>{categoryName}{category?.enabled === false && <div style={{ color: "#b45309", fontSize: 11 }}>Category disabled</div>}</td>
                  <td style={{ padding: "15px 13px", borderBottom: "1px solid #edf2f7", minWidth: 135 }}><strong>{count}/{locales.length}</strong><div style={{ height: 4, background: "#e2e8f0", borderRadius: 99, overflow: "hidden", marginTop: 6 }}><div style={{ height: "100%", background: "#17618c", width: `${count / locales.length * 100}%` }} /></div></td>
                  <td style={{ padding: "15px 13px", borderBottom: "1px solid #edf2f7" }}><Status published={topic.published} /></td>
                  <td style={{ padding: "15px 13px", borderBottom: "1px solid #edf2f7" }}><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button style={{ ...css.button, padding: "7px 10px" }} onClick={() => openTopic(topic)}>Edit</button><button style={{ ...css.button, padding: "7px 10px" }} disabled={busy} onClick={() => void quickPublish(topic, !topic.published)}>{topic.published ? "Unpublish" : "Publish"}</button><button style={{ ...css.danger, padding: "7px 10px" }} disabled={busy} onClick={() => void removeTopic(topic)}>Delete</button></div></td>
                </tr>;
              })}</tbody>
            </table>
          </div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: 13, borderTop: "1px solid #e2e8f0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>Rows per page <select style={{ ...inputStyle, width: 75, padding: "7px 8px" }} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={10}>10</option><option value={15}>15</option><option value={25}>25</option><option value={50}>50</option></select></label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ ...css.muted, fontSize: 12 }}>Page {currentPage} of {totalPages}</span><button style={css.button} disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Previous</button><button style={css.button} disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next →</button></div>
          </div>
        </div>
      </>}

      {tab === "categories" && data && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}><div><h2 style={{ margin: 0, fontSize: 20 }}>Categories</h2><p style={{ ...css.muted, margin: "6px 0 0" }}>Organize articles and manage localized category names.</p></div><button style={css.primary} onClick={() => openCategory()}>＋ New category</button></div>
        {categoryEditorOpen && <section style={{ ...css.card, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}><h3 style={{ margin: 0 }}>{categoryId ? "Edit category" : "Create category"}</h3><button style={css.button} onClick={() => setCategoryEditorOpen(false)}>Close</button></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 18 }}>
            <Field label="Category ID" required value={categoryMeta.id} disabled={Boolean(categoryId)} onChange={(value) => setCategoryMeta({ ...categoryMeta, id: value })} />
            <Field label="URL slug" required value={categoryMeta.slug} onChange={(value) => setCategoryMeta({ ...categoryMeta, slug: value })} />
            <Field label="Sort order" value={String(categoryMeta.sortOrder)} onChange={(value) => setCategoryMeta({ ...categoryMeta, sortOrder: Number(value) || 0 })} />
            <label style={css.label}>Status<select style={inputStyle} value={categoryMeta.enabled ? "enabled" : "disabled"} onChange={(event) => setCategoryMeta({ ...categoryMeta, enabled: event.target.value === "enabled" })}><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>{locales.map((language) => <button key={language} style={categoryLocale === language ? css.primary : css.button} onClick={() => setCategoryLocale(language)}>{language} {categoryTranslations[language]?.name ? "●" : "○"}</button>)}</div>
          <div style={{ display: "grid", gap: 14 }}><Field label={`${categoryLocale.toUpperCase()} category name`} required={categoryLocale === "en"} value={categoryTranslations[categoryLocale]?.name ?? ""} onChange={(value) => setCategoryTranslations((old) => ({ ...old, [categoryLocale]: { ...old[categoryLocale], name: value } }))} /><Field label="Description" value={categoryTranslations[categoryLocale]?.description ?? ""} multiline rows={3} onChange={(value) => setCategoryTranslations((old) => ({ ...old, [categoryLocale]: { ...old[categoryLocale], description: value } }))} /></div>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}><button style={css.primary} disabled={busy} onClick={() => void saveCategory()}>{busy ? "Saving…" : "Save category"}</button><button style={css.button} onClick={() => setCategoryEditorOpen(false)}>Cancel</button></div>
        </section>}
        <div style={{ ...css.card, padding: 0, overflow: "hidden" }}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 650, borderCollapse: "collapse", fontSize: 13 }}><thead><tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>{["Category", "Articles", "Translations", "Status", "Actions"].map((label) => <th key={label} style={{ padding: 13, borderBottom: "1px solid #e2e8f0" }}>{label}</th>)}</tr></thead><tbody>{data.categories.map((category) => <tr key={category.id}><td style={{ padding: 14, borderBottom: "1px solid #edf2f7" }}><strong>{category.translations.find((item) => item.locale === "en")?.name || category.id}</strong><div style={{ ...css.muted, fontSize: 11, marginTop: 4 }}>{category.id} · {category.slug} · order {category.sortOrder}</div></td><td style={{ padding: 14, borderBottom: "1px solid #edf2f7" }}>{data.topics.filter((topic) => topic.categoryId === category.id).length}</td><td style={{ padding: 14, borderBottom: "1px solid #edf2f7" }}>{category.translations.length}/{locales.length}</td><td style={{ padding: 14, borderBottom: "1px solid #edf2f7" }}><span style={{ ...css.pill, background: category.enabled ? "#e8f7ee" : "#f1f5f9", color: category.enabled ? "#17633a" : "#64748b" }}>{category.enabled ? "Enabled" : "Disabled"}</span></td><td style={{ padding: 14, borderBottom: "1px solid #edf2f7" }}><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button style={{ ...css.button, padding: "7px 10px" }} onClick={() => openCategory(category)}>Edit</button><button style={{ ...css.button, padding: "7px 10px" }} disabled={busy} onClick={() => void updateCategory(category, { sortOrder: category.sortOrder - 1 })}>↑</button><button style={{ ...css.button, padding: "7px 10px" }} disabled={busy} onClick={() => void updateCategory(category, { sortOrder: category.sortOrder + 1 })}>↓</button><button style={{ ...css.button, padding: "7px 10px" }} disabled={busy} onClick={() => void updateCategory(category, { enabled: !category.enabled })}>{category.enabled ? "Disable" : "Enable"}</button></div></td></tr>)}</tbody></table></div></div>
      </>}

      {tab === "settings" && <section style={css.card}><h2 style={{ margin: "0 0 6px", fontSize: 20 }}>Site settings</h2><p style={{ ...css.muted, marginTop: 0 }}>Manage the shared health information notice shown across the site.</p><Field label="Shared health notice" value={healthNotice} multiline rows={7} onChange={setHealthNotice} hint="This is shared site-wide. Article-specific notices are edited in each article's content section." /><div style={{ marginTop: 14 }}><button style={css.primary} disabled={busy} onClick={() => void saveHealthNotice()}>{busy ? "Saving…" : "Save settings"}</button></div></section>}
    </>}

    {message && <div role="status" style={{ position: "fixed", right: 20, bottom: 20, zIndex: 20, maxWidth: 520, padding: "13px 17px", borderRadius: 10, border: `1px solid ${messageError ? "#fecaca" : "#bbf7d0"}`, background: messageError ? "#fff1f2" : "#f0fdf4", color: messageError ? "#9f1239" : "#166534", boxShadow: "0 8px 30px #0f172a18", fontSize: 13, fontWeight: 650 }}>{message}<button aria-label="Dismiss message" style={{ marginLeft: 12, border: 0, background: "transparent", color: "inherit", cursor: "pointer" }} onClick={() => notify("")}>×</button></div>}
    {busy && <div style={{ position: "fixed", left: 0, bottom: 0, height: 3, width: "100%", background: "#dbeafe", zIndex: 30 }}><div style={{ width: "40%", height: "100%", background: "#17618c" }} /></div>}
  </main>;
}
