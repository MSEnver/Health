# HealthGuide Admin CMS

## Included in this branch

- Admin overview: counts for articles, publication state, categories, and translation coverage.
- Article editor: create, edit, preview via saved data, publish/unpublish, delete, and manage localized fields.
- Translation editor for all locales configured in `src/lib/locale.ts`.
- Structured fields for introduction, content blocks, purpose, materials, instructions, precautions, article-specific health notice, references-compatible schema fields, and preserved legacy JSON.
- Category editor: add/edit localized names and descriptions, reorder, enable/disable.
- Shared health notice stored in `SiteSetting` under `health_notice`.
- Topic revisions and audit log entries on CMS writes.
- Basic authentication for the admin page and API.

## Configure admin credentials

Add these variables to your local, git-ignored `.env` file:

```dotenv
ADMIN_USERNAME=choose-a-unique-admin-user
ADMIN_PASSWORD=use-a-long-random-password
```

Restart Next.js after changing environment variables. Do not commit `.env`. Deployments must set the same variables in their environment configuration. The admin route is not usable until both values are configured.

Open `/admin` on the same origin as the site. The browser will request HTTP Basic credentials. API routes also check the authorization header.

## Run and validate

```bash
npx prisma generate
npm run build
npm run dev
```

Then test `/admin` and verify that article/category create, edit, publication, translation, and category-enable changes are reflected in PostgreSQL and the public site. Run these checks against a non-production database first.

## Data notes

- Public article reads continue to use the PostgreSQL-backed reader. Unpublished articles and articles belonging to disabled categories are not shown publicly.
- The interface itself continues to use the existing `messages/*.json` translations.
- Article translations with an empty title are not saved, to avoid creating blank language versions.
- Deleting an article removes its translations and dependent references/revisions through the schema's cascade rules. Category deletion is intentionally not exposed in this first admin version.
- The schema has reference records, but this initial editor does not yet provide a dedicated references editor; it preserves existing references when editing other translation fields.
- Before production, consider replacing Basic authentication with a full user/session system, HTTPS-only access, and role-based authorization.
