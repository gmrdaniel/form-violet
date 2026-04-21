# La Neta — Creator Services Survey (form-violet)

Next.js 16 + React 19 frontend for the v3.1 Creator Services Questionnaire.
Submissions persist to Supabase via a server-side API route; the canonical
schema lives in the sibling repo
[form-green](https://github.com/gmrdaniel/formulario).

- Public URL: set by Vercel
- Language routes: `/en` and `/es` (via `next-intl` middleware)
- Stack: Next.js 16 App Router, Tailwind 4, Zustand, `react-hook-form`,
  `zod`, `next-intl`, Vitest + Playwright
- Companion project: [form-green](https://github.com/gmrdaniel/formulario)
  (Vite + React) — owns the migrations, shares the same Supabase table

## Architecture

```
Browser
  ↓ fetch POST /api/submit
Next.js API route (Node runtime)
  ↓ SubmissionSchema.safeParse()
  ↓ toResponsesRow(sub, {source:'form-violet'})
  ↓ supabaseAdmin.insert()  ← service_role key, bypasses RLS
Supabase → public.responses (shared with form-green)
```

The `service_role` key stays on the server (no `NEXT_PUBLIC_` prefix) and
never reaches the browser.

## Project layout

```
.
├── app/
│   ├── [locale]/              ← i18n route segment for s1..s4, welcome, thanks
│   ├── api/submit/route.ts    ← Supabase insert endpoint
│   └── layout.tsx
├── components/
│   ├── bundle/, chrome/, fields/, screens/, service/
├── lib/
│   ├── schema.ts              ← SubmissionSchema (zod) — form-violet's internal shape
│   ├── mapToDbRow.ts          ← translates to form-green's canonical row shape
│   ├── supabaseAdmin.ts       ← server-only client (service_role)
│   ├── services.ts, bundles.ts, store.ts
├── messages/en.json, es.json
├── middleware.ts              ← locale detection + redirect
└── vitest.config.ts
```

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in the two Supabase values
npm run dev                    # http://localhost:3000
```

### Required env vars (server-only)

| Variable | Where |
|---|---|
| `SUPABASE_URL` | `.env.local` (dev), Vercel env (prod, Production + Preview) |
| `SUPABASE_SERVICE_ROLE_KEY` | same — never prefix with `NEXT_PUBLIC_` |

Both values live on the server. Next.js only exposes `NEXT_PUBLIC_*` env vars
to the browser bundle; omitting the prefix keeps these safe.

## Scripts

- `npm run dev` — Next.js dev on :3000 (Turbopack)
- `npm run build` — production build
- `npm run start` — production server (after build)
- `npm test` — Vitest run (unit tests for the mapper + snapshots)
- `npm run e2e` — Playwright (end-to-end, requires dev server)

## Persistence pipeline

1. Client submits JSON matching `SubmissionSchema`.
2. Server validates (`SubmissionSchema.safeParse`). On failure returns 400 +
   `issues[]`. On success:
3. Honeypot check (`hp_website`). A bot-filled value returns a fake success
   without inserting.
4. `toResponsesRow(parsed.data, { source: 'form-violet', … })` translates
   the payload: enum values (`lt_1k` → `<1K`, `somewhat` → `kinda`),
   field names (`contact_phone` → `q11b_phone`), numeric prices → tier +
   other encoding. Phone is normalized to strict E.164 and the ISO country
   is derived from the dial prefix.
5. `supabaseAdmin.from('responses').insert(row)`. Because we use
   `service_role`, RLS is bypassed — nothing on the DB side needs to know
   who form-violet is.

### Why the mapper exists

form-violet was built before the DB schema was frozen. Its internal shape
(snake_case enums like `lt_1k`, single numeric prices, services keyed by
`short_clips`) diverges from form-green's, which is what the DB mirrors.
`lib/mapToDbRow.ts` is the single source of translation — all differences
between the two schemas live there. Dashboard queries can stay blissfully
ignorant of the divergence.

## Deployment (Vercel)

1. Import the repo to a fresh Vercel project.
2. Framework preset: Next.js (auto-detected).
3. Environment Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, apply
   to Production + Preview.
4. Custom domain: set independently from form-green's (they live on
   different domains by design).

## Relationship with form-green

- **Schema ownership**: form-green. Any migration runs from there.
- **Source stamp**: every row inserted here carries `source = 'form-violet'`.
- **Shared queries**: `select ... from public.responses where source = ...` or
  group by source for cross-form analytics.
- **Different audiences**: distribute each form's URL to a different segment
  (for example, translate/variant testing).

If you need to change the DB schema, open a PR on form-green first, wait
for the CI migration, then update `lib/mapToDbRow.ts` here to emit the new
shape.
