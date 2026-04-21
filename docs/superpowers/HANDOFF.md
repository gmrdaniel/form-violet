# Handoff — Creator Survey Form

**Última actualización:** 2026-04-20
**Estado:** Fases 1-3 completadas · 11/30 tasks · tests 15/15 ✓ · build ✓

## Cómo retomar en una sesión nueva

1. Abrir Claude Code en `C:\crm\formulario`
2. Mensaje inicial sugerido:

   > Retomando el proyecto. Estado en `docs/superpowers/HANDOFF.md`.
   > Plan en `docs/superpowers/plans/2026-04-20-creator-survey-form.md`.
   > Spec en `docs/superpowers/specs/2026-04-20-creator-survey-design.md`.
   > Seguí con Tasks 12-18 (Fase 4 — screens).

3. Leer este archivo + los deltas al plan abajo antes de tocar código.

## Lo que está hecho

| Fase | Tasks | Qué |
|---|---|---|
| 1 | 1-6 | Next.js + Tailwind v4 + i18n + schema + configs + messages ES/EN |
| 2 | 7-8 | Zustand store + draft localStorage con tests |
| 3 | 9-11 | UI primitives (9 componentes) |

**Commits en git** (master branch):
- `637f424` chore: bootstrap Next.js project with dependencies
- `5d40931` feat: configure dark creator tailwind v4 theme and inter font
- `(sha)` chore: update gitignore to exclude local tooling files
- `(sha)` feat: i18n routing, schema with tests, services/bundles configs, es/en messages
- `(sha)` feat: zustand store + draft localStorage with tests
- `(sha)` feat: ui primitives

Comando para verificar: `git log --oneline`

## Deltas al plan original (importante — no seguir el plan ciegamente)

### 1. Next.js 16.2.4 (plan dice 15)

Durante bootstrap, el implementer subió a v16 por un CVE (CVE-2025-66478). Compatibilidad App Router idéntica. Nota:
- `middleware.ts` genera warning: "middleware is deprecated, use proxy". Funcionar funciona, pero en v17 hay que renombrar a `proxy.ts`.
- Next 16 requiere **root layout + root page** aunque i18n esté bajo `[locale]`. Resuelto con:
  - `app/layout.tsx` → passthrough que solo retorna `children`
  - `app/page.tsx` → redirect a `/es`
  - `app/[locale]/layout.tsx` → contiene `<html>`, `<body>`, fonts, `NextIntlClientProvider`

### 2. Tailwind v4 (plan dice v3)

Default de `create-next-app` ahora. Diferencias vs plan:
- NO hay `tailwind.config.ts` — eliminado
- Theme en CSS via `@theme { --color-base: ...; }` en `app/globals.css`
- Utility custom en `app/globals.css`: `@utility bg-accent-gradient { ... }`
- Colors usables: `bg-base`, `bg-raised`, `text-violet`, `text-pink`, `text-success`, `text-error`, `bg-whatsapp-green`, `border-border-subtle`, etc.
- `bg-accent-gradient` funciona como utility normal

El plan tiene código con v3 syntax en varias tasks (especialmente Task 2). **Ignorar ese código** — usar lo que ya está en `globals.css`. Las Tasks 12+ siguen siendo válidas porque las clases Tailwind son iguales.

### 3. Vitest 4 localStorage

Vitest 4 + jsdom 29 no trae `localStorage.clear()` funcional por default. Solución en `test-setup.ts` (ya incluido). `vitest.config.ts` apunta a ese setup file.

### 4. Package manager: npm (no pnpm/bun)

Confirmado. No cambiar.

### 5. Clsx

El plan dice instalarlo en Task 10. **Ya está instalado** (`npm install clsx` corrió durante Fase 3).

## Estado de archivos

```
C:\crm\formulario\
├─ app\
│  ├─ layout.tsx                 ✓ passthrough
│  ├─ page.tsx                   ✓ redirect a /es
│  ├─ [locale]\
│  │  ├─ layout.tsx              ✓ html/body + NextIntlClientProvider
│  │  └─ page.tsx                ⚠️ placeholder — reemplazar en Task 12
│  └─ globals.css                ✓ theme Dark Creator completo
├─ components\
│  ├─ chrome\                    ✓ Container, ProgressBar, LangSelector, WizardNav
│  └─ fields\                    ✓ Pill, PriceRow, TextInput, TextArea, YesNo
├─ i18n\
│  ├─ routing.ts                 ✓
│  └─ request.ts                 ✓
├─ lib\
│  ├─ schema.ts                  ✓ + schema.test.ts (9 tests)
│  ├─ services.ts                ✓ 13 servicios
│  ├─ bundles.ts                 ✓ 3 bundles
│  ├─ store.ts                   ✓ Zustand
│  └─ draft.ts                   ✓ + draft.test.ts (6 tests)
├─ messages\
│  ├─ es.json                    ✓ completo
│  └─ en.json                    ✓ completo
├─ middleware.ts                 ✓ next-intl
├─ next.config.ts                ✓ con plugin next-intl
├─ vitest.config.ts              ✓
├─ test-setup.ts                 ✓
└─ docs\superpowers\
   ├─ HANDOFF.md                 ← este archivo
   ├─ plans\
   │  └─ 2026-04-20-creator-survey-form.md
   └─ specs\
      ├─ 2026-04-20-creator-survey-design.md     (ES canónico)
      └─ 2026-04-20-creator-survey-design-en.md
```

## Qué viene

### Fase 4 (Tasks 12-18): Screens

Orden sugerido y dependencias:

1. **Task 12** — `components/screens/Welcome.tsx` + `components/chrome/ResumeBanner.tsx`, y actualizar `app/[locale]/page.tsx` para usar `Welcome`
2. **Task 13** — `components/screens/S1Wizard.tsx` + `app/[locale]/s1/[qId]/page.tsx`
3. **Task 14** — `components/service/ServiceCard.tsx` (con fix de re-expansión ya incluido en el plan)
4. **Task 15** — `components/screens/S2List.tsx` + `app/[locale]/s2/page.tsx`
5. **Task 16** — `components/bundle/BundleCard.tsx` + `components/screens/S3Bundles.tsx` + `app/[locale]/s3/page.tsx`
6. **Task 17** — `components/screens/S4Wizard.tsx` + `app/[locale]/s4/[qId]/page.tsx`
7. **Task 18** — `components/screens/Thanks.tsx` + `app/[locale]/thanks/page.tsx`

Checkpoint sugerido al final de Fase 4: `npm run dev`, walkthrough completo welcome→thanks para verificar.

### Fase 5 (Tasks 19-22): Server

Implementa `lib/sheets.ts`, `lib/rate-limit.ts` (con tests), `lib/email.ts`, y `app/api/submit/route.ts`.

### Fase 6 (Tasks 23-27): Polish
Autosave UI, Privacy, OG image, PostHog, test mode.

### Fase 7 (Tasks 28-30): Testing + docs
Playwright E2E, .env.example, setup.md.

## Caveats y gotchas

1. **CRLF warnings** — ignorar. Windows + git default. No afecta nada.

2. **Middleware deprecated warning** — ignorar por ahora. Migrar a `proxy.ts` es una línea de cambio cuando Next 17 salga.

3. **`any` types en S1Wizard/S4Wizard** — el plan usa `any` en los sub-componentes Q1..Q11 para brevedad. Si querés tipar bien, usa `FormState & FormActions` (exportar desde `lib/store.ts`).

4. **i18n v1 alcance** — solo ES tiene mensajes "reales" copiados del doc. EN traducido de forma mínima. Si llega a lanzarse EN v1.1, revisar copias en `messages/en.json`.

5. **Tailwind v4 `@utility`** — si necesitás más utilities custom después del lanzamiento, van en `app/globals.css`. No crear `tailwind.config.ts`.

6. **Preguntas abiertas del spec** (resolver antes de deploy):
   - `hola@laneta.com` y `privacy@laneta.com` → confirmar con equipo La Neta
   - Logo SVG oficial → reemplazar `app/icon.svg` cuando llegue
   - PostHog región US vs EU

## Preguntas a respondedor para continuar

Ninguna — el spec y plan cubren todo. Avanzar directo con Task 12.
