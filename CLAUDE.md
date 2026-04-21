# Claude Code guide for form-violet

Non-obvious invariants for this codebase. Read before touching
`/api/submit`, the Supabase client, or anything that crosses into
form-green's territory.

## The two-repo system

Two frontends write to the same Supabase project
`fzbenzbpybyzqtcxklnx`, table `public.responses`.

| Repo | Path | Framework | Auth to Supabase |
|---|---|---|---|
| **form-green** | `C:\Users\PC\Documents\cuestionario-diseño` | Vite + React 18 | browser, anon key |
| **form-violet** | `C:\crm\formulario` (this one) | Next.js 16 + React 19 | server-side API route, service_role key |

Every row carries `source = 'form-green' | 'form-violet'`.

**Migrations live only in form-green.** This repo does not run
`supabase db push`. If you need a schema change, open it there first,
let CI apply it, then update `lib/mapToDbRow.ts` here to emit the new
column.

## Persistence pipeline (this repo)

```
Browser POST /api/submit (JSON body)
  → app/api/submit/route.ts
      SubmissionSchema.safeParse(body)
      honeypot check hp_website
      toResponsesRow(data, { source: 'form-violet', … })
      supabaseAdmin.from('responses').insert(row)
  → 200 { ok: true, submissionId }
    or 400 (validation) / 500 (Supabase error)
```

### Non-obvious rules

1. **`supabaseAdmin` uses `service_role`** and bypasses RLS. This is the
   whole reason we can insert via a Next.js API route. Never expose the
   client anywhere that reaches the browser.

2. **Env vars have NO `NEXT_PUBLIC_` prefix.** That prefix would leak the
   key to the client bundle. If you ever need a browser-side Supabase call
   here, add a new *anon* key under `NEXT_PUBLIC_SUPABASE_ANON_KEY` — don't
   reuse the service_role key.

3. **`toResponsesRow` is the only translation surface** between
   form-violet's internal schema and the DB shape. If you change an enum
   value in `lib/schema.ts`, update the corresponding map in
   `lib/mapToDbRow.ts`. `lib/mapToDbRow.test.ts` snapshots catch drift.

4. **Phone is normalized server-side**, not client-side. The client can
   send `"+52 55 1234 5678"`; `normalizePhone()` strips whitespace /
   parens / dashes. `derivePhoneCountry()` reads the dial prefix and
   returns the ISO-2 code. The DB gets strict E.164 and a country so
   analytics can group by `q11b_phone_country`.

5. **`submission_id` is generated on the server** (via `crypto.randomUUID`
   from `node:crypto`), not by the DB. form-green does the same client-side.

6. **Honeypot `hp_website` returns a fake success** — do NOT insert the row.
   The bot gets a 200 and thinks it worked.

## Schema bridge (form-violet ↔ form-green)

These are the mappings that matter. All live in `lib/mapToDbRow.ts`.

| form-violet | form-green / DB |
|---|---|
| `follower_range: 'lt_1k' \| '1k_10k' \| …` | `q4_followers: '<1K' \| '1K-10K' \| …` |
| `hours_non_content: 'lt_2' \| '2_5' \| …` | `q5_hours_non_content: '<2h' \| '2-5h' \| …` |
| `platforms: ['twitter']` | `q3_platforms: ['x']` |
| `does_currently: ['design_thumbnails', 'merchandise', 'none_of_above']` | `q6_current_tasks: ['design_thumbs', 'merch', 'none']` |
| `interest: 'somewhat' \| 'none'` | `s{NN}_{key}_interest: 'kinda' \| 'nope'` |
| `budget_range: 'lt_50' \| 'custom' \| …` | `q9_monthly_budget: '<50' \| 'other' \| …` |
| `contact_consent: boolean` | `q11_can_contact: 'yes' \| 'no'` |
| `contact_phone: string` (loose format) | `q11b_phone: string` (strict E.164) + `q11b_phone_country: 'MX' \| 'US' \| …` |
| `services[].priceMonthly: number` | `s{NN}_{key}_price: 'low' \| 'mid' \| 'high' \| 'other' \| 'not_interested'` + `s{NN}_{key}_price_other: number \| null` |
| `bundle_{id}_price: number` | `bundle_{id}_price: tier` + `bundle_{id}_price_other: number \| null` |

form-violet service IDs → form-green service keys (prefix `s01`..`s13` in
the DB):

| form-violet | form-green |
|---|---|
| `short_clips` | `short_form_clips` (s01) |
| `thumbnail_design` | `thumbnail_cover_design` (s02) |
| `ai_dubbing` | `ai_dubbing_translation` (s03) |
| `content_seo` | `content_seo_hashtags` (s04) |
| `performance_dashboard` | `weekly_dashboard` (s05) |
| `media_kit` | `dynamic_media_kit` (s06) |
| `ai_coach` | `elevn_ai_coach` (s07) |
| `we_post_for_you` | `we_post_for_you` (s08) |
| `paid_community` | `paid_community` (s09) |
| `newsletter` | `newsletter` (s10) |
| `online_course` | `online_course` (s11) |
| `podcast` | `podcast` (s12) |
| `merch_store` | `merch_store` (s13) |

## Adding a new service

If form-green adds a 14th service, the order of operations here:

1. Wait for the migration (it'll add three new columns `s14_<key>_*`).
2. Add the catalog entry to `lib/services.ts` and `messages/{en,es}.json`.
3. Add the id mapping in `lib/mapToDbRow.ts::SERVICE_ID_MAP` and the key in
   `SERVICE_ORDER`.
4. Re-record the snapshot test: `npm test -- -u` then eyeball the diff.
5. Deploy.

## Common tasks and where they land

| Task | Where |
|---|---|
| Tweak copy | `messages/en.json` / `messages/es.json` |
| Change validation | `lib/schema.ts` (zod). If enum vocabulary changes, also update `lib/mapToDbRow.ts` |
| Update the mapping | `lib/mapToDbRow.ts` + snapshot |
| Update the API contract | `app/api/submit/route.ts` |
| Add a UI screen | `components/screens/*` + the locale route segments in `app/[locale]/` |

## What NOT to do

- **Do not** add a row to `public.responses` whose columns don't exist
  because the migration hasn't run. Push to form-green first.
- **Do not** expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Never
  import `lib/supabaseAdmin.ts` from a client component; it should only
  be reached from `/api/*` routes.
- **Do not** bypass the mapper. Even a one-off "just insert this field
  directly" breaks the invariant that the DB shape only changes through
  one place.
- **Do not** rely on RLS policies for form-violet. We use service_role
  precisely because the API route is the trust boundary.

## Quick debugging

- **400 on submit** → validation failed. Check the Vercel Function Logs
  for `[submit] validation failed. issues=` — the `issues[]` tells you
  exactly which field tripped zod.
- **500 "server not configured"** → `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
  not set in Vercel, or typo.
- **500 with Postgres error in logs** → most likely the DB column doesn't
  exist (form-green migration pending) or a CHECK constraint rejected a
  value (new enum value the mapper added without the migration).
- **Tests pass locally but snapshot diffs look wrong** → someone renamed a
  column or changed a mapping. Inspect the diff before running `-u`.

## Reference

- Companion repo with migrations: `C:\Users\PC\Documents\cuestionario-diseño`
  (git remote `gmrdaniel/formulario`).
- Source survey doc: `La_Neta_Creator_Survey_v3.1_Final.md` in this repo.
- Supabase project: `fzbenzbpybyzqtcxklnx`.
