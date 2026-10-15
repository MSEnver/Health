# HealthGuide — Next.js refactor

A reusable, multilingual refactor of the uploaded Health Advice, Homeopathy & Spiritual Guidance archive.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS v4, with centralized CSS theme variables and baseline styles
- `next-intl` for English and Urdu routing and interface translations
- JSON source files for the archive content

## Included

- Three designs selectable from the top-right appearance dropdown: **Clean & Modern**, **Dark & Elegant**, and **Warm & Traditional**.
- English (`/en`) and Urdu (`/ur`) switcher; Urdu document direction is RTL.
- The 56 records represented in the source data are kept in `data/health.en.json` and `data/health.ur.json`, paired by stable IDs.
- Reusable header, selectors, category cards, article cards, search/filter controls, article detail modal, and archive sections.
- Search over content and tags; category and sitting filters; favorites for the current browser session.
- Responsive layouts for desktop and mobile; archive medical-information disclaimer.

## Content structure

- `data/health.en.json` — English content plus linked Urdu note text (`urduText`).
- `data/health.ur.json` — Urdu content plus English description for parity.
- `messages/en.json` and `messages/ur.json` — labels used by the interface, not archive records.

Keep `id` values consistent between the English and Urdu record files. Edit interface wording in `messages/*.json` and content records in `data/*.json`.

## Run locally

Install Node.js 22, then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000/en` or `http://localhost:3000/ur`.

Production build:

```bash
npm run build
npm start
```

## Limitations / review before launch

- The Windows `file:///...` path supplied in chat is local to your PC and cannot be read remotely. The uploaded source HTML in this conversation was used instead.
- The GitHub repository `MSEnver/Health` is currently empty and the connected GitHub App does not yet have access selected for this repository; the prepared ZIP is provided until access is enabled.
- This refactor preserves the archive's existing health and traditional remedy claims; they have not been medically validated. The disclaimer is intentional. Review content before publishing publicly.
- Favorites currently live in React state and are not account-synced or guaranteed to persist after a refresh.
