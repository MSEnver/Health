
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { SUPPORTED_LOCALES } from "@/lib/locale";

type Translation = Record<string, unknown> & {
  id?: string;
  locale?: string;
  title?: string;
  description?: string;
  references?: unknown[] | string;
  citation?: string;
  url?: string;
  sortOrder?: number;
};

type EditorTranslation = Record<string, string>;

type Category = {
  id: string;
  slug: string;
  enabled: boolean;
  sortOrder: number;
  translations: {
    locale: string;
    name: string;
    description?: string | null;
  }[];
};

type Topic = {
  id: string;
  categoryId: string;
  sitting: string | null;
  date: string | null;
  published: boolean;
  sortOrder: number;
  translations: (Translation & {
    id: string;
    locale: string;
    title: string;
    references?: unknown[];
  })[];
};

type Payload = {
  categories: Category[];
  topics: Topic[];
  healthNotice: unknown;
  stats: {
    categories: number;
    topics: number;
    published: number;
    unpublished: number;
    translations: number;
    categoryTranslations: number;
    locales: string[];
  };
};

const blankTranslation = (): EditorTranslation => ({
  title: "",
  description: "",
  introduction: "",
  body: "",
  contentBlocks: "[]",
  purpose: "",
  spiritualGoal: "",
  materials: "[]",
  instructions: "[]",
  precautions: "[]",
  healthNoticeOverride: "",
  urduText: "",
  urdu: "",
  englishDescription: "",
  displayTitle: "",
  nameDetails: "{}",
  tags: "",
  legacyData: "{}",
  references: "[]",
});

const fields: [string, string, boolean?][] = [
  ["title", "Title", true],
  ["description", "Description"],
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
  ["references", "References (JSON array: title, citation, url, sortOrder)"],
  ["legacyData", "Legacy data (JSON)"],
];

const jsonFields = [
  "contentBlocks",
  "materials",
  "instructions",
  "precautions",
  "nameDetails",
  "legacyData",
  "references",
] as const;

const toEditor = (t?: Translation): EditorTranslation => {
  const out = blankTranslation();

  if (!t) return out;

  for (const key of Object.keys(out)) {
    const value = t[key];

    if ((jsonFields as readonly string[]).includes(key)) {
      if (value != null) {
        let formattedValue: unknown = value;

        if (key === "references" && Array.isArray(value)) {
          formattedValue = value.map((item: unknown) => {
            const reference =
              item !== null && typeof item === "object"
                ? (item as Record<string, unknown>)
                : {};

            return {
              title: reference.title,
              citation: reference.citation,
              url: reference.url,
              sortOrder: reference.sortOrder,
            };
          });
        }

        out[key] = JSON.stringify(formattedValue, null, 2) ?? "";
      }
    } else if (key === "tags") {
      out[key] = Array.isArray(value) ? value.join(", ") : "";
    } else {
      out[key] = typeof value === "string" ? value : "";
    }
  }

  return out;
};

const parseTranslation = (
  raw: EditorTranslation,
): Record<string, unknown> => {
  const parsed: Record<string, unknown> = {
    ...raw,
    tags: String(raw.tags || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };

  for (const key of jsonFields) {
    try {
      parsed[key] = raw[key]?.trim()
        ? JSON.parse(raw[key])
        : null;
    } catch {
      throw new Error(`Invalid JSON in ${key}`);
    }
  }

  return parsed;
};

const styles: Record<string, CSSProperties> = {
  shell: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "32px 20px 64px",
    color: "var(--foreground,#18222c)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 750,
    margin: 0,
  },
  muted: {
    color: "var(--muted-foreground,#687581)",
  },
  button: {
    border: "1px solid #cbd5df",
    borderRadius: 10,
    padding: "10px 14px",
    background: "white",
    color: "#17212b",
    cursor: "pointer",
    fontWeight: 650,
  },
  primary: {
    border: "1px solid #145c8b",
    borderRadius: 10,
    padding: "10px 14px",
    background: "#145c8b",
    color: "white",
    cursor: "pointer",
    fontWeight: 650,
  },
  input: {
    boxSizing: "border-box",
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5df",
    borderRadius: 8,
    font: "inherit",
    background: "white",
    color: "#17212b",
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 13,
    fontWeight: 650,
  },
  card: {
    border: "1px solid #dbe2e8",
    borderRadius: 14,
    padding: 18,
    background: "var(--card,#fff)",
  },
};

export function AdminCms() {
  const [data, setData] = useState<Payload | null>(null);
  const [tab, setTab] = useState<"overview" | "articles" | "categories">(
    "overview",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [healthNotice, setHealthNotice] = useState("");

  const [search, setSearch] = useState("");
  const [articleCategoryFilter, setArticleCategoryFilter] = useState("all");
  const [articleStatusFilter, setArticleStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  const [topicId, setTopicId] = useState("");
  const [topicMeta, setTopicMeta] = useState({
    id: "",
    categoryId: "",
    sitting: "Sitting 1",
    date: "",
    published: false,
    sortOrder: 0,
  });

  const [translationLocale, setTranslationLocale] = useState("en");
  const [translations, setTranslations] = useState<
    Record<string, EditorTranslation>
  >({});

  const [categoryId, setCategoryId] = useState("");
  const [categoryMeta, setCategoryMeta] = useState({
    id: "",
    slug: "",
    enabled: true,
    sortOrder: 0,
  });
  const [categoryTranslations, setCategoryTranslations] = useState<
    Record<string, { name: string; description: string }>
  >({});

  const [editor, setEditor] = useState(false);
  const [categoryEditor, setCategoryEditor] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);

    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load admin data");
      }

      setData(result as Payload);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setHealthNotice(
      typeof data?.healthNotice === "string" ? data.healthNotice : "",
    );
  }, [data?.healthNotice]);

  const filteredTopics = useMemo(
    () =>
      data?.topics.filter(
        (topic) =>
          (articleCategoryFilter === "all" ||
            topic.categoryId === articleCategoryFilter) &&
          (articleStatusFilter === "all" ||
            (articleStatusFilter === "published"
              ? topic.published
              : !topic.published)) &&
          (topic.id.toLowerCase().includes(search.toLowerCase()) ||
            topic.translations.some((translation) =>
              translation.title?.toLowerCase().includes(search.toLowerCase()),
            )),
      ) ?? [],
    [data, search, articleCategoryFilter, articleStatusFilter],
  );

  const toggleTopicSelection = (id: string, checked: boolean) => {
    setSelectedTopicIds((old) =>
      checked
        ? [...new Set([...old, id])]
        : old.filter((selectedId) => selectedId !== id),
    );
  };

  const bulkUpdateTopics = async (patch: {
    categoryId?: string;
    published?: boolean;
  }) => {
    if (!selectedTopicIds.length) return;

    const action = patch.categoryId
      ? `Move ${selectedTopicIds.length} article(s) to the selected category`
      : patch.published
        ? `Publish ${selectedTopicIds.length} article(s)`
        : `Unpublish ${selectedTopicIds.length} article(s)`;

    if (!window.confirm(`${action}?`)) return;

    setBusy(true);
    setMessage("");

    try {
      for (const id of selectedTopicIds) {
        const response = await fetch("/api/admin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "topic", id, ...patch }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Update failed for ${id}`);
        }
      }

      setSelectedTopicIds([]);
      setMessage(`${action} completed.`);
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Bulk update failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const openTopic = (topic?: Topic) => {
    setTopicId(topic?.id || "");

    setTopicMeta(
      topic
        ? {
            id: topic.id,
            categoryId: topic.categoryId,
            sitting: topic.sitting || "",
            date: topic.date || "",
            published: topic.published,
            sortOrder: topic.sortOrder,
          }
        : {
            id: "",
            categoryId: data?.categories[0]?.id || "",
            sitting: "Sitting 1",
            date: "",
            published: false,
            sortOrder: (data?.topics.length || 0) + 1,
          },
    );

    const mapped: Record<string, EditorTranslation> = {};

    for (const locale of SUPPORTED_LOCALES) {
      const found = topic?.translations.find(
        (translation) => translation.locale === locale,
      );

      mapped[locale] = toEditor(found);
    }

    setTranslations(mapped);
    setTranslationLocale("en");
    setEditor(true);
    setMessage("");
  };

  const saveTopic = async () => {
    setBusy(true);
    setMessage("");

    try {
      const clean: Record<string, Record<string, unknown>> = {};

      for (const [locale, translation] of Object.entries(translations)) {
        if (String(translation.title || "").trim()) {
          clean[locale] = parseTranslation(translation);
        }
      }

      if (!String(clean.en?.title || "").trim()) {
        throw new Error("English title is required.");
      }

      const body = {
        kind: "topic",
        ...topicMeta,
        translations: clean,
      };

      const response = await fetch("/api/admin", {
        method: topicId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          topicId ? body : { ...body, id: topicMeta.id },
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Save failed");
      }

      setEditor(false);
      setMessage("Article saved.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const removeTopic = async (topic: Topic) => {
    if (
      !window.confirm(
        `Delete article "${topic.id}" and all its translations? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        `/api/admin?kind=topic&id=${encodeURIComponent(topic.id)}`,
        { method: "DELETE" },
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Delete failed");
      }

      setMessage("Article deleted.");
      setSelectedTopicIds((old) => old.filter((id) => id !== topic.id));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const openCategory = (category?: Category) => {
    setCategoryId(category?.id || "");

    setCategoryMeta(
      category
        ? {
            id: category.id,
            slug: category.slug,
            enabled: category.enabled,
            sortOrder: category.sortOrder,
          }
        : {
            id: "",
            slug: "",
            enabled: true,
            sortOrder: (data?.categories.length || 0) + 1,
          },
    );

    const mapped: Record<string, { name: string; description: string }> = {};

    for (const locale of SUPPORTED_LOCALES) {
      const translation = category?.translations.find(
        (item) => item.locale === locale,
      );

      mapped[locale] = {
        name: translation?.name || "",
        description: translation?.description || "",
      };
    }

    setCategoryTranslations(mapped);
    setCategoryEditor(true);
    setMessage("");
  };

  const saveCategory = async () => {
    setBusy(true);
    setMessage("");

    try {
      const body = {
        kind: "category",
        ...categoryMeta,
        translations: categoryTranslations,
      };

      const response = await fetch("/api/admin", {
        method: categoryId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          categoryId ? body : { ...body, id: categoryMeta.id },
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Save failed");
      }

      setCategoryEditor(false);
      setMessage("Category saved.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const saveHealthNotice = async () => {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "setting", value: healthNotice }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Save failed");
      }

      setMessage("Shared health notice saved.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const updateCategory = async (
    category: Category,
    patch: Partial<Category>,
  ) => {
    setBusy(true);

    try {
      const response = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "category",
          id: category.id,
          ...patch,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Update failed");
      }

      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const quickPublish = async (topic: Topic, published: boolean) => {
    setBusy(true);

    try {
      const response = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "topic",
          id: topic.id,
          published,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Update failed");
      }

      setMessage(published ? "Article published." : "Article unpublished.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const field = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    disabled = false,
  ) => (
    <label style={styles.label} key={label}>
      {label}
      <input
        style={styles.input}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );

  const area = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    rows = 4,
  ) => (
    <label style={styles.label} key={label}>
      {label}
      <textarea
        style={{
          ...styles.input,
          minHeight: rows * 24,
          resize: "vertical",
        }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
      />
    </label>
  );

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div>
          <p
            style={{
              ...styles.muted,
              margin: "0 0 6px",
              letterSpacing: 2,
              fontSize: 12,
            }}
          >
            HEALTHGUIDE / CONTENT MANAGEMENT
          </p>
          <h1 style={styles.title}>Admin workspace</h1>
          <p style={styles.muted}>
            Manage articles, translations, and categories stored in PostgreSQL.
          </p>
        </div>

        <button
          style={styles.button}
          onClick={() => void load()}
          disabled={busy}
        >
          {busy ? "Working…" : "Refresh data"}
        </button>
      </header>

      <nav
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        {(["overview", "articles", "categories"] as const).map((item) => (
          <button
            key={item}
            style={tab === item ? styles.primary : styles.button}
            onClick={() => {
              setTab(item);
              setEditor(false);
              setCategoryEditor(false);
            }}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      {message && (
        <p role="status" style={{ ...styles.card, marginBottom: 16 }}>
          {message}
        </p>
      )}

      {busy && !data ? (
        <p>Loading database records…</p>
      ) : !data ? (
        <div style={styles.card}>
          No data loaded. Check the admin credentials, database connection, and
          server logs.
        </div>
      ) : null}

      {data && tab === "overview" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 14,
              marginBottom: 22,
            }}
          >
            {[
              ["Articles", data.stats.topics],
              ["Published", data.stats.published],
              ["Drafts", data.stats.unpublished],
              ["Categories", data.stats.categories],
              ["Article translations", data.stats.translations],
              ["Category translations", data.stats.categoryTranslations],
            ].map(([label, value]) => (
              <div key={String(label)} style={styles.card}>
                <div style={styles.muted}>{label}</div>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 750,
                    marginTop: 8,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...styles.card, marginBottom: 18 }}>
            <h2 style={{ marginTop: 0 }}>Shared health notice</h2>
            <p style={styles.muted}>
              This notice is stored in SiteSetting as health_notice.
              Article-specific overrides remain in each translation.
            </p>
            <textarea
              style={{ ...styles.input, minHeight: 100 }}
              value={healthNotice}
              onChange={(event) => setHealthNotice(event.target.value)}
              placeholder="Enter the site-wide health information notice…"
            />
            <div style={{ marginTop: 10 }}>
              <button
                style={styles.primary}
                disabled={busy}
                onClick={() => void saveHealthNotice()}
              >
                {busy ? "Saving…" : "Save shared notice"}
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={{ marginTop: 0 }}>Translation coverage</h2>
            <p style={styles.muted}>
              Supported languages: {SUPPORTED_LOCALES.join(", ")}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
                gap: 8,
              }}
            >
              {SUPPORTED_LOCALES.map((locale) => (
                <div
                  key={locale}
                  style={{
                    padding: 10,
                    border: "1px solid #dbe2e8",
                    borderRadius: 8,
                  }}
                >
                  <strong>{locale}</strong>
                  <div>
                    {
                      data.topics.filter((topic) =>
                        topic.translations.some(
                          (translation) =>
                            translation.locale === locale &&
                            translation.title,
                        ),
                      ).length
                    }{" "}
                    / {data.topics.length} articles
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {data && tab === "articles" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <label style={styles.label}>
              Category
              <select
                style={styles.input}
                value={articleCategoryFilter}
                onChange={(event) => {
                  setArticleCategoryFilter(event.target.value);
                  setSelectedTopicIds([]);
                }}
              >
                <option value="all">All categories ({data.topics.length})</option>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.translations.find((item) => item.locale === "en")
                      ?.name || category.id}{" "}
                    (
                    {
                      data.topics.filter(
                        (topic) => topic.categoryId === category.id,
                      ).length
                    }
                    ){category.enabled ? "" : " — disabled"}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Publication status
              <select
                style={styles.input}
                value={articleStatusFilter}
                onChange={(event) => {
                  setArticleStatusFilter(
                    event.target.value as typeof articleStatusFilter,
                  );
                  setSelectedTopicIds([]);
                }}
              >
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft / unpublished</option>
              </select>
            </label>

            <label style={styles.label}>
              Search articles
              <input
                style={styles.input}
                placeholder="Search article ID or title…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                style={styles.primary}
                onClick={() => openTopic()}
                disabled={busy}
              >
                + New article
              </button>
            </div>
          </div>

          {editor && (
            <section style={{ ...styles.card, marginBottom: 20 }}>
              <div style={styles.header}>
                <h2 style={{ margin: 0 }}>
                  {topicId ? "Edit article" : "Create article"}
                </h2>
                <button
                  style={styles.button}
                  onClick={() => setEditor(false)}
                >
                  Close editor
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                {field(
                  "Article ID",
                  topicMeta.id,
                  (value) => setTopicMeta({ ...topicMeta, id: value }),
                  !!topicId,
                )}

                <label style={styles.label}>
                  Category
                  <select
                    style={styles.input}
                    value={topicMeta.categoryId}
                    onChange={(event) =>
                      setTopicMeta({
                        ...topicMeta,
                        categoryId: event.target.value,
                      })
                    }
                  >
                    {data.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.id}
                      </option>
                    ))}
                  </select>
                </label>

                {field("Sitting", topicMeta.sitting, (value) =>
                  setTopicMeta({ ...topicMeta, sitting: value }),
                )}

                {field("Date", topicMeta.date, (value) =>
                  setTopicMeta({ ...topicMeta, date: value }),
                )}

                {field(
                  "Sort order",
                  String(topicMeta.sortOrder),
                  (value) =>
                    setTopicMeta({
                      ...topicMeta,
                      sortOrder: Number(value) || 0,
                    }),
                )}

                <label style={styles.label}>
                  Publication
                  <select
                    style={styles.input}
                    value={topicMeta.published ? "published" : "draft"}
                    onChange={(event) =>
                      setTopicMeta({
                        ...topicMeta,
                        published: event.target.value === "published",
                      })
                    }
                  >
                    <option value="draft">Draft / unpublished</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                {SUPPORTED_LOCALES.map((locale) => (
                  <button
                    key={locale}
                    style={
                      translationLocale === locale
                        ? styles.primary
                        : styles.button
                    }
                    onClick={() => setTranslationLocale(locale)}
                  >
                    {locale}
                    {translations[locale]?.title ? " •" : ""}
                  </button>
                ))}
              </div>

              <p style={styles.muted}>
                Fields marked with JSON expect valid JSON arrays or objects.
                Leave untranslated locales empty; English is required.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                  gap: 14,
                }}
              >
                {fields.map(([key, label, required]) => {
                  const value = translations[translationLocale]?.[key] ?? "";

                  const set = (nextValue: string) =>
                    setTranslations((old) => ({
                      ...old,
                      [translationLocale]: {
                        ...old[translationLocale],
                        [key]: nextValue,
                      },
                    }));

                  const displayLabel = label + (required ? " *" : "");

                  return key === "body" ||
                    key === "introduction" ||
                    key === "description" ||
                    key === "contentBlocks" ||
                    key === "materials" ||
                    key === "instructions" ||
                    key === "precautions" ||
                    key === "purpose" ||
                    key === "spiritualGoal" ||
                    key === "healthNoticeOverride" ||
                    key === "legacyData" ||
                    key === "references" ? (
                    area(
                      displayLabel,
                      value,
                      set,
                      key === "body" ? 9 : 4,
                    )
                  ) : (
                    field(displayLabel, value, set)
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button
                  style={styles.primary}
                  disabled={busy}
                  onClick={() => void saveTopic()}
                >
                  {busy ? "Saving…" : "Save article"}
                </button>
                <button
                  style={styles.button}
                  onClick={() => setEditor(false)}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          <div
            style={{
              ...styles.card,
              marginBottom: 10,
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 650,
              }}
            >
              <input
                type="checkbox"
                checked={
                  filteredTopics.length > 0 &&
                  filteredTopics.every((topic) =>
                    selectedTopicIds.includes(topic.id),
                  )
                }
                onChange={(event) =>
                  setSelectedTopicIds(
                    event.target.checked
                      ? Array.from(
                          new Set([
                            ...selectedTopicIds,
                            ...filteredTopics.map((topic) => topic.id),
                          ]),
                        )
                      : selectedTopicIds.filter(
                          (id) => !filteredTopics.some((topic) => topic.id === id),
                        ),
                  )
                }
              />
              Select all {filteredTopics.length} shown
            </label>

            <span style={styles.muted}>
              {selectedTopicIds.length} selected
            </span>

            {selectedTopicIds.length > 0 && (
              <>
                <select
                  aria-label="Move selected articles to category"
                  style={{
                    ...styles.input,
                    width: "auto",
                    minWidth: 190,
                  }}
                  id="bulk-category-target"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Move to category…
                  </option>
                  {data.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.translations.find(
                        (item) => item.locale === "en",
                      )?.name || category.id}
                    </option>
                  ))}
                </select>

                <button
                  style={styles.button}
                  disabled={busy}
                  onClick={() => {
                    const element = document.getElementById(
                      "bulk-category-target",
                    ) as HTMLSelectElement | null;

                    if (element?.value) {
                      void bulkUpdateTopics({ categoryId: element.value });
                    }
                  }}
                >
                  Move
                </button>

                <button
                  style={styles.button}
                  disabled={busy}
                  onClick={() => void bulkUpdateTopics({ published: true })}
                >
                  Publish selected
                </button>

                <button
                  style={styles.button}
                  disabled={busy}
                  onClick={() => void bulkUpdateTopics({ published: false })}
                >
                  Unpublish selected
                </button>

                <button
                  style={styles.button}
                  onClick={() => setSelectedTopicIds([])}
                >
                  Clear selection
                </button>
              </>
            )}
          </div>

          <p style={styles.muted}>
            Showing {filteredTopics.length} of {data.topics.length} articles.
            Unpublishing hides an article from the public site without deleting
            its content.
          </p>

          <div style={{ display: "grid", gap: 10 }}>
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                style={{
                  ...styles.card,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    flex: "1 1 300px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTopicIds.includes(topic.id)}
                    onChange={(event) =>
                      toggleTopicSelection(topic.id, event.target.checked)
                    }
                    style={{ marginTop: 4 }}
                  />

                  <span>
                    <strong>
                      {topic.translations.find(
                        (translation) => translation.locale === "en",
                      )?.title || topic.id}
                    </strong>
                    <span
                      style={{
                        ...styles.muted,
                        display: "block",
                        marginTop: 4,
                      }}
                    >
                      {topic.id} ·{" "}
                      {data.categories.find(
                        (category) => category.id === topic.categoryId,
                      )?.translations.find((item) => item.locale === "en")
                        ?.name || topic.categoryId}{" "}
                      · {topic.translations.length}/{SUPPORTED_LOCALES.length}{" "}
                      translations ·{" "}
                      {topic.published ? "Published" : "Draft / unpublished"}
                    </span>
                  </span>
                </label>

                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  <button
                    style={styles.button}
                    onClick={() => openTopic(topic)}
                  >
                    Edit
                  </button>
                  <button
                    style={styles.button}
                    disabled={busy}
                    onClick={() => void quickPublish(topic, !topic.published)}
                  >
                    {topic.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    style={styles.button}
                    disabled={busy}
                    onClick={() => void removeTopic(topic)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {data && tab === "categories" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <p style={styles.muted}>
              Enable/disable, reorder, or edit localized category labels.
            </p>
            <button
              style={styles.primary}
              onClick={() => openCategory()}
              disabled={busy}
            >
              + New category
            </button>
          </div>

          {categoryEditor && (
            <section style={{ ...styles.card, marginBottom: 18 }}>
              <div style={styles.header}>
                <h2 style={{ margin: 0 }}>
                  {categoryId ? "Edit category" : "Create category"}
                </h2>
                <button
                  style={styles.button}
                  onClick={() => setCategoryEditor(false)}
                >
                  Close editor
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {field(
                  "Category ID",
                  categoryMeta.id,
                  (value) => setCategoryMeta({ ...categoryMeta, id: value }),
                  !!categoryId,
                )}

                {field("URL slug", categoryMeta.slug, (value) =>
                  setCategoryMeta({ ...categoryMeta, slug: value }),
                )}

                {field(
                  "Sort order",
                  String(categoryMeta.sortOrder),
                  (value) =>
                    setCategoryMeta({
                      ...categoryMeta,
                      sortOrder: Number(value) || 0,
                    }),
                )}

                <label style={styles.label}>
                  Status
                  <select
                    style={styles.input}
                    value={categoryMeta.enabled ? "enabled" : "disabled"}
                    onChange={(event) =>
                      setCategoryMeta({
                        ...categoryMeta,
                        enabled: event.target.value === "enabled",
                      })
                    }
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                  gap: 12,
                }}
              >
                {SUPPORTED_LOCALES.map((locale) => (
                  <div
                    key={locale}
                    style={{
                      border: "1px solid #dbe2e8",
                      borderRadius: 10,
                      padding: 12,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <strong>{locale}</strong>

                    {field(
                      "Name",
                      categoryTranslations[locale]?.name || "",
                      (value) =>
                        setCategoryTranslations((old) => ({
                          ...old,
                          [locale]: {
                            ...old[locale],
                            name: value,
                          },
                        })),
                    )}

                    {field(
                      "Description",
                      categoryTranslations[locale]?.description || "",
                      (value) =>
                        setCategoryTranslations((old) => ({
                          ...old,
                          [locale]: {
                            ...old[locale],
                            description: value,
                          },
                        })),
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  style={styles.primary}
                  disabled={busy}
                  onClick={() => void saveCategory()}
                >
                  {busy ? "Saving…" : "Save category"}
                </button>
                <button
                  style={styles.button}
                  onClick={() => setCategoryEditor(false)}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          <div style={{ display: "grid", gap: 10 }}>
            {data.categories.map((category) => (
              <div
                key={category.id}
                style={{
                  ...styles.card,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>
                    {category.translations.find(
                      (translation) => translation.locale === "en",
                    )?.name || category.id}
                  </strong>
                  <div style={styles.muted}>
                    {category.id} · {category.slug} · order{" "}
                    {category.sortOrder} · {category.translations.length}/
                    {SUPPORTED_LOCALES.length} languages ·{" "}
                    {category.enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  <button
                    style={styles.button}
                    onClick={() => openCategory(category)}
                  >
                    Edit
                  </button>
                  <button
                    style={styles.button}
                    disabled={busy}
                    onClick={() =>
                      void updateCategory(category, {
                        sortOrder: category.sortOrder - 1,
                      })
                    }
                  >
                    Move up
                  </button>
                  <button
                    style={styles.button}
                    disabled={busy}
                    onClick={() =>
                      void updateCategory(category, {
                        sortOrder: category.sortOrder + 1,
                      })
                    }
                  >
                    Move down
                  </button>
                  <button
                    style={styles.button}
                    disabled={busy}
                    onClick={() =>
                      void updateCategory(category, {
                        enabled: !category.enabled,
                      })
                    }
                  >
                    {category.enabled ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
