# La Neta — Creator Survey Form (Design Spec)

**Date:** 2026-04-20
**Source doc:** `La_Neta_Creator_Survey_v3.1_Final.md`
**Working directory:** `C:\crm\formulario`

## Purpose

Build a custom web form for the Creator Services Survey v3.1. Replaces Google Forms / Typeform with a polished, mobile-first experience designed for young content creators. Target: 500+ responses in 2 weeks via WhatsApp distribution (90% mobile traffic).

## Goals

- Completion rate ≥ 70% (survey doc target: 70–85%)
- Thumb-friendly on small screens (primary surface is WhatsApp-opened browser)
- Feels "current" — aesthetically aligned with apps young creators use daily (TikTok, Spotify, Discord)
- Data captured into Google Sheets for easy access by non-technical team (Ana / operations)
- Incentive and social proof visible before any question is asked

## Non-goals

- No auth / user accounts. Each respondent is anonymous unless they opt in at Q11.
- No analytics dashboard inside the app. Google Sheets pivot tables cover this.
- No admin UI. Schema changes happen by editing config files and redeploying.
- No i18n infrastructure. Spanish-only (with one easy hook for future bilingual if needed).

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **React Hook Form** + **Zod** for validation
- **Framer Motion** for transitions (page-to-page, conditional reveals, progress bar)
- **googleapis** (Google Sheets API v4) via Service Account for writes
- **Vercel** for hosting
- Storage: **Google Sheets** (one spreadsheet, one sheet tab for responses, one sheet tab for metadata/audit)

## Architecture

```
[Browser: Next.js client]
  ↓ form state (React Hook Form, in-memory + localStorage draft)
  ↓ POST /api/submit on final step
[Next.js Server Action / API Route]
  ↓ validates (Zod, server-side)
  ↓ appends row via googleapis (service account)
[Google Sheets]
  ↓ headers row matches Zod schema
  ↓ one row per submission, ~40+ columns
```

### Why Server Action instead of client→Sheets direct

- Service account credentials stay server-side (never exposed to browser)
- Single trusted validation point
- Can add rate limiting, spam checks later without redeploying the client

### Data flow boundaries

- **Client:** navigation, in-progress state, draft autosave to `localStorage` under key `laneta-survey-draft-v1` (cleared on successful submit).
- **Server:** validation + Sheets append. Returns `{ ok: true }` or error details.
- **Sheets:** the source of truth. The app does not read back — one-way write.

## Navigation model (hybrid)

Chosen pattern: **hybrid wizard + scroll**. Different sections use different patterns matched to their content shape.

| Section | Content shape | Pattern |
|---|---|---|
| Welcome | Sales message + CTA | Single screen, no form |
| S1 — About you | 6 short questions | Wizard (one question per screen) |
| S2 — Services | Matrix (13 services × 2 questions) | Scroll list of progressive cards |
| S3 — Bundles | Comparison + 3 pricings + preference | Single scroll screen |
| S4 — Final | 3 questions + conditional contact | Wizard (one question per screen) |
| Thank you | Confirmation + share | Single screen |

### URL routing

- `/` → Welcome
- `/s1/[qId]` → Section 1 wizard, `qId` in `[1..6]`
- `/s2` → Section 2 scroll
- `/s3` → Section 3 scroll
- `/s4/[qId]` → Section 4 wizard, `qId` in `[9, 10, 11]` (Q11b/c are a conditional reveal inside the Q11 screen, not separate routes)
- `/thanks` → Thank you

Rationale for URLs: shareable mid-flight (rare but supported), easier dev navigation, browser back button works naturally.

### Progress indicator

Persistent top bar visible on every screen except welcome/thanks. Shows:
- Progress fill (% based on weighted section completion)
- "Sección X de 4 · ~Y min"

Progress weights: S1=20%, S2=40%, S3=20%, S4=20%. Within a section, progress advances proportionally to questions answered.

### Keyboard and touch behavior

- Wizard screens: Enter = advance, ArrowLeft = back, digit keys 1-6 = select option
- Auto-advance after single-select in wizards (200ms delay to show selection state)
- All tap targets ≥ 48px height
- No auto-advance in Section 2 cards (user should revisit freely)

## Section 2 service card (progressive disclosure)

The critical UX piece. Each of the 13 services is one card in a vertical scroll list.

### States

1. **Initial** — compact: number (`01 / 13`), service name, one-line description, 3 interest buttons (`🔥 Sí`, `Tal vez`, `No`). Price not shown.
2. **Interested** (Sí or Tal vez tapped) — expands downward with spring animation (~250ms): price row (3 preset prices + "Otro monto" input). Price selection is optional; user can leave unselected and the card keeps the interest answer.
3. **Not interested** (No tapped) — collapses to single-line dimmed state with a "No me interesa" badge. Tapping again re-expands to state 1.

### Data model per service

```ts
{
  serviceId: string           // stable, e.g. "short_clips"
  interest: "very" | "somewhat" | "none" | null
  price: number | null        // null if not selected OR if interest=none
  priceIsCustom: boolean      // true if user used "Otro monto"
}
```

### Service list (13 items)

Each has: `id`, `name` (ES), `description` (ES), `prices: [low, mid, high]`. Kept in a single `services.ts` config file so copy edits don't require code changes.

### Scroll behavior

- No scroll-snap (feels janky when auto-expanding). Natural scroll.
- Floating "Continuar a bundles →" button fixes to bottom once user has scrolled past 50% of the list, for faster exit.

## Section 3 bundles screen

### Comparison presentation

Mobile-first: the comparison table from the source doc is reformatted as **three stacked bundle cards**, not a table. Each card shows:
- Tag label (STARTER / GROWTH / PRO)
- Bundle name (one-line summary of inclusions)
- Inclusions detail
- "Si lo compraras suelto: ~$X" (old price, struck-through)
- "Ahorrás 25-40%" badge (green)
- The 3 price options + "Otro monto" + "No me interesa este bundle"

The **PRO bundle** has a subtle violet accent border/background — signals "most complete" without being pushy.

### Q8 (bundle vs individual)

Rendered below the three bundle cards as a stacked single-select list (not a separate screen).

## Section 4 conditional flow

Q11 is rendered as two large tap targets (Sí / No):
- **Sí** → the card expands inline with slide-down animation to reveal phone (required, WhatsApp-friendly format) + email (optional) + submit button
- **No** → submit button becomes enabled immediately

Submission is a single POST regardless of path.

## Visual style — Dark Creator

### Palette

| Token | Value | Use |
|---|---|---|
| `bg-base` | `#0A0A0F` | Page background |
| `bg-raised` | `rgba(255,255,255,0.02)` | Cards, inputs |
| `bg-raised-selected` | `rgba(255,255,255,0.06)` | Selected state |
| `border-subtle` | `rgba(255,255,255,0.08)` | Card borders |
| `border-strong` | `rgba(255,255,255,0.25)` | Selected card borders |
| `text-primary` | `#FFFFFF` | Headings, primary text |
| `text-secondary` | `rgba(255,255,255,0.70)` | Body |
| `text-tertiary` | `rgba(255,255,255,0.45)` | Labels, metadata |
| `accent-gradient` | `linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)` | CTAs, selected pills, progress fill |
| `accent-violet` | `#A78BFA` | PRO bundle accent |
| `success` | `#9FE899` | "Ahorrás X%" badges |
| `whatsapp-green` | `#25D366` | Share button only |

### Typography

- **Font:** Inter (variable, via `next/font`) as the only family. Weights: 400 (body), 500 (subtitle), 600 (h2/h3), 700 (h1).
- **H1 (welcome/section titles):** 30px, weight 700, letter-spacing -0.02em, with gradient text effect (accent-gradient)
- **H2 (question text in wizard):** 20-22px, weight 500-600, line-height 1.3
- **Body:** 14px, line-height 1.55
- **Labels:** 11px uppercase, letter-spacing 0.08em

### Motion principles (Emil Kowalski–style)

- **Page transitions** (wizard→wizard): fade + horizontal slide 20px, 300ms, ease `[0.32, 0.72, 0, 1]`
- **Conditional reveals** (S2 card expand, Q11 contact reveal): spring, height animate, 250ms
- **Selection feedback:** scale from 1 to 0.98 on tap, spring back
- **Progress bar:** width transitions 400ms with custom easing
- **All interactive elements** have a `:focus-visible` outline using the accent gradient
- **Motion respects `prefers-reduced-motion`** — fallback to instant transitions, no height animations

### Shape language

- Cards: `border-radius: 14px`
- Pills / options: `border-radius: 10-12px`
- CTAs: `border-radius: 999px` (fully rounded) for primary wizard action, `border-radius: 12px` for bundle CTAs
- No hard shadows. Subtle 1px border is the separator.

## Form data schema

Single Zod schema, same source used by client and server. Field names in snake_case to match the Google Sheets header row.

### Fields

| Column | Type | Source | Required |
|---|---|---|---|
| `timestamp` | ISO string | server-generated | yes |
| `submission_id` | UUID | server-generated | yes |
| `name` | string | Q1 | yes |
| `handle` | string | Q2 | yes |
| `platforms` | string (comma-joined) | Q3 | yes |
| `platforms_other` | string | Q3 "other" text | no |
| `follower_range` | enum | Q4 | yes |
| `hours_non_content` | enum | Q5 | yes |
| `does_currently` | string (comma-joined) | Q6 | yes |
| `svc_01_short_clips_interest` | enum(`very` / `somewhat` / `none`) | S2 | yes |
| `svc_01_short_clips_price_monthly` | number \| null | S2 | conditional |
| `svc_01_short_clips_price_setup` | number \| null | S2 | only for services with setup fee (see note) |
| ... (13 services × 2–3 columns) ... | | | |
| `bundle_starter_price` | number \| null | Q7 | no |
| `bundle_growth_price` | number \| null | Q7 | no |
| `bundle_pro_price` | number \| null | Q7 | no |
| `bundle_preference` | enum | Q8 | yes |
| `budget_range` | enum(`lt_50` / `50_100` / `100_200` / `200_400` / `400_plus` / `custom`) | Q9 | yes |
| `budget_custom` | number \| null | Q9 | required if `budget_range=custom` |
| `one_wish` | string | Q10 | yes |
| `contact_consent` | boolean | Q11 | yes |
| `contact_phone` | string | Q11b | conditional |
| `contact_email` | string | Q11c | no |
| `user_agent` | string | server-derived | yes |
| `referrer` | string | server-derived | no |

### Note on compound prices (services 11 and 13)

Most services have a single monthly price. Two services have a setup fee + monthly:
- **S11 — Online course:** options are `$299 setup + $49/mo`, `$499 + $99/mo`, `$999 + $149/mo`
- **S13 — Merch store:** options are `$199 setup + $49/mo`, `$299 + $79/mo`, `$499 + $149/mo`

For these two, the `price_setup` column is populated; for the other 11 services, `price_setup` is always null. The `services.ts` config flags each service with `hasSetupFee: boolean` so the UI and schema branch accordingly.

### Validation rules

- `name`: min 2, max 100 chars, trimmed
- `handle`: trimmed, leading `@` stripped if present, min 2, max 50
- `platforms`: at least one selected from the 5 known platforms OR `platforms_other` non-empty
- `platforms_other`: required only if `platforms` includes `other`
- `does_currently`: array can be empty only if `none_of_above` is selected (the two are mutually exclusive)
- `svc_*_interest` required for all 13 services
- `svc_*_price_monthly` / `svc_*_price_setup`: if `svc_*_interest` is `very` or `somewhat`, price may be null (user skipped intentionally); if `interest=none`, both price fields must be null
- `bundle_*_price`: always optional — a user may decline all bundles
- `budget_range`: required; if `custom`, `budget_custom` must be a positive integer
- `one_wish`: min 3, max 500 chars, trimmed
- `contact_phone`: if `contact_consent=true`, required; basic international format check (`+` prefix optional, min 8 digits after stripping spaces/dashes)
- `contact_email`: if present, valid email format; never required

## Code organization

```
C:\crm\formulario\
├─ app\
│  ├─ layout.tsx                 # root layout, fonts, global CSS
│  ├─ page.tsx                   # welcome screen
│  ├─ s1\[qId]\page.tsx          # section 1 wizard question
│  ├─ s2\page.tsx                # section 2 service list
│  ├─ s3\page.tsx                # section 3 bundles
│  ├─ s4\[qId]\page.tsx          # section 4 wizard question
│  ├─ thanks\page.tsx            # thank you screen
│  └─ api\submit\route.ts        # POST endpoint → Google Sheets
├─ components\
│  ├─ chrome\ProgressBar.tsx
│  ├─ chrome\WizardNav.tsx
│  ├─ chrome\PhoneFrame.tsx      # mobile-width container
│  ├─ fields\Pill.tsx            # option button (wizard pills)
│  ├─ fields\PriceRow.tsx        # 3-price grid + other input
│  ├─ fields\YesNo.tsx           # Q11 style
│  ├─ fields\TextInput.tsx
│  ├─ fields\TextArea.tsx
│  ├─ service\ServiceCard.tsx    # section 2 progressive card
│  ├─ bundle\BundleCard.tsx      # section 3 bundle card
│  └─ screens\Welcome.tsx
├─ lib\
│  ├─ schema.ts                  # Zod schema (shared client+server)
│  ├─ services.ts                # 13 services config
│  ├─ bundles.ts                 # 3 bundles config
│  ├─ store.ts                   # Zustand or React context for form state
│  ├─ draft.ts                   # localStorage draft save/load
│  └─ sheets.ts                  # Google Sheets client (server-only)
├─ docs\superpowers\
│  └─ specs\2026-04-20-creator-survey-design.md
└─ .env.local                    # GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID
```

## Unit boundaries

Each component has one clear purpose:
- `ServiceCard` owns its own interest + price state, emits `onChange(ServiceAnswer)`; it does not know about other services or the global store.
- `WizardNav` is a pure dumb component — receives `onBack`, `onNext`, `canAdvance`.
- `sheets.ts` is the only file that touches Google's SDK; the rest of the app calls one function: `appendSubmission(data)`.
- `schema.ts` has no imports from other app files — it's the shared contract.

## Error handling

- **Network failure on submit:** show inline retry UI with "Guardamos tu progreso — intentalo de nuevo". The draft is still in localStorage.
- **Sheets API failure:** server returns 500 with an ID; the client shows a generic error + "Escribinos a [contacto]" fallback.
- **Validation failure on submit:** should be impossible (client validates first) but if it happens, return 400 with field errors and navigate the user to the offending field.
- **localStorage unavailable** (private mode): draft save is silently no-op; form still works session-long.

## Testing

- **Unit:** Zod schema (happy path + conditional rules). `ServiceCard` state transitions.
- **Integration:** API route with mocked `sheets.ts` — verifies correct row mapping.
- **E2E (one path):** Playwright on mobile viewport (390×844 iPhone 13 size), full happy path welcome → submit → thanks. Verify localStorage cleared after success.

## Deployment

- Environment variables in Vercel: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (base64-encoded in env, decoded at runtime), `GOOGLE_SHEET_ID`.
- Google Sheet setup: create sheet with header row matching schema column names; share with service account email as Editor.
- Pre-launch checklist: test on real mobile (iOS Safari + Android Chrome) via tunnel (ngrok/Vercel preview), verify WhatsApp link preview renders welcome image.

## Out of scope (explicitly)

- Multi-language (Spanish only for v1)
- Admin dashboard
- Email confirmations to respondents
- Save-and-resume across devices (only same-browser draft)
- A/B testing of copy or prices
- Referral attribution tracking (the share link is plain, no UTM)

## Open questions (to resolve before implementation plan)

None — all decisions made. If anything surfaces in implementation, add here and flag to user.
