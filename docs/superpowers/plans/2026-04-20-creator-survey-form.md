# La Neta Creator Survey Form — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, dark-mode web survey form for La Neta creators, writing submissions to Google Sheets, with i18n (ES/EN), autosave, analytics, and email confirmation.

**Architecture:** Next.js 15 App Router with `[locale]` segment. Server Actions write to Google Sheets via service account. Client-side state with Zustand + localStorage draft. Framer Motion for transitions. Dark Creator visual system (black + violet/pink gradient).

**Tech Stack:** Next.js 15, TypeScript, Tailwind, React Hook Form, Zod, Zustand, Framer Motion, next-intl, googleapis, Resend, PostHog, Playwright.

**Spec reference:** `docs/superpowers/specs/2026-04-20-creator-survey-design.md`

---

## Phase 1 — Foundation

### Task 1: Bootstrap Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Create Next.js app**

Run (from `C:\crm\formulario`):
```bash
npx --yes create-next-app@latest . --ts --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint --use-npm --yes
```

Expected: scaffolds `app/`, `package.json`, `tailwind.config.ts`, `tsconfig.json`, `next.config.ts`.

Notes for implementer:
- If `--yes` flag is not recognized, retry without it — create-next-app will use defaults for any missing flags
- If the scaffold puts files in a `formulario/` subdirectory instead of the current dir, pass `.` explicitly as target
- If Turbopack prompt appears, pick yes
- If it complains that the directory isn't empty, it's because of the existing `.superpowers/`, `docs/`, `La_Neta_*.md`, `skills-lock.json` — that's fine, pass `--yes` or answer "yes" to "use existing directory"

- [ ] **Step 2: Install core runtime deps**

```bash
npm install zod react-hook-form @hookform/resolvers zustand framer-motion next-intl uuid
```

- [ ] **Step 3: Install server-side deps**

```bash
npm install googleapis resend posthog-js posthog-node
```

- [ ] **Step 4: Install dev deps**

```bash
npm install -D @types/uuid @playwright/test vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 5: Verify dev server boots**

```bash
npm run dev
```

Expected: server starts on port 3000 with default Next.js page.

Stop with Ctrl+C after confirming.

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: bootstrap Next.js project with dependencies"
```

---

### Task 2: Configure Tailwind theme (Dark Creator palette)

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace tailwind.config.ts**

Write this content to `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A0A0F",
        raised: "rgba(255,255,255,0.02)",
        "raised-selected": "rgba(255,255,255,0.06)",
        "border-subtle": "rgba(255,255,255,0.08)",
        "border-strong": "rgba(255,255,255,0.25)",
        violet: "#A78BFA",
        pink: "#EC4899",
        success: "#9FE899",
        "whatsapp-green": "#25D366",
        error: "#F87171",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        "emil": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Replace app/globals.css**

Write this content to `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

html, body {
  background: #0A0A0F;
  color: white;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

@media (min-width: 768px) {
  body {
    background:
      radial-gradient(ellipse 800px 400px at 50% 0%, rgba(167,139,250,0.06), transparent),
      radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px) 0 0 / 24px 24px,
      #0A0A0F;
  }
}

.gradient-text {
  background: linear-gradient(135deg, #FFFFFF 0%, #A78BFA 70%, #EC4899 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

:focus-visible {
  outline: 2px solid #A78BFA;
  outline-offset: 2px;
  border-radius: 4px;
}
```

- [ ] **Step 3: Add Inter font to root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "La Neta",
  description: "Creator Survey",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Replace app/page.tsx with placeholder**

```tsx
export default function Home() {
  return <div className="p-8 text-white">La Neta — coming soon</div>;
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: builds successfully.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: configure dark creator tailwind theme and inter font"
```

---

### Task 3: Set up next-intl with locale routing

**Files:**
- Create: `i18n/request.ts`
- Create: `i18n/routing.ts`
- Create: `middleware.ts`
- Create: `messages/es.json`, `messages/en.json`
- Modify: `next.config.ts`
- Move: `app/layout.tsx` → `app/[locale]/layout.tsx`
- Move: `app/page.tsx` → `app/[locale]/page.tsx`
- Delete: `app/layout.tsx`, `app/page.tsx` (after moving)

- [ ] **Step 1: Create i18n routing config**

Create `i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
});
```

- [ ] **Step 2: Create i18n request config**

Create `i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "es" | "en")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Create middleware**

Create `middleware.ts` (at project root):

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(es|en)/:path*"],
};
```

- [ ] **Step 4: Update next.config.ts**

Replace `next.config.ts`:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 5: Create empty message files**

Create `messages/es.json`:
```json
{ "welcome": { "title": "La Neta" } }
```

Create `messages/en.json`:
```json
{ "welcome": { "title": "La Neta" } }
```

- [ ] **Step 6: Move layout and page into [locale] route group**

Create directory `app/[locale]/`.

Create `app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "La Neta — Queremos escucharte",
  description: "3 minutos. Ayudanos a diseñar nuevos servicios para creadores.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "es" | "en")) notFound();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

Create `app/[locale]/page.tsx`:

```tsx
import { useTranslations } from "next-intl";

export default function WelcomePage() {
  const t = useTranslations("welcome");
  return <div className="p-8">{t("title")}</div>;
}
```

Delete `app/layout.tsx` and `app/page.tsx`.

- [ ] **Step 7: Verify routing works**

```bash
npm run dev
```

Visit `http://localhost:3000` → should redirect to `/es`.
Visit `http://localhost:3000/en` → should render "La Neta".

Stop server with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: set up next-intl with es/en locale routing"
```

---

### Task 4: Define Zod schema (shared contract)

**Files:**
- Create: `lib/schema.ts`
- Create: `lib/schema.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

Add test script to `package.json` "scripts":

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Write failing tests for schema**

Create `lib/schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { SubmissionSchema } from "./schema";

const validSubmission = {
  locale: "es",
  name: "Ana López",
  handle: "analopez",
  platforms: ["youtube", "tiktok"],
  platforms_other: null,
  follower_range: "10k_50k",
  hours_non_content: "5_10",
  does_currently: ["cut_clips"],
  services: Array.from({ length: 13 }, (_, i) => ({
    serviceId: `svc_${i + 1}`,
    interest: "none",
    priceMonthly: null,
    priceSetup: null,
  })),
  bundle_starter_price: null,
  bundle_growth_price: null,
  bundle_pro_price: null,
  bundle_preference: "bundle",
  budget_range: "100_200",
  budget_custom: null,
  one_wish: "Necesito ayuda con thumbnails",
  contact_consent: false,
  contact_phone: null,
  contact_email: null,
  hp_website: "",
  is_test: false,
};

describe("SubmissionSchema", () => {
  it("accepts a valid submission", () => {
    const result = SubmissionSchema.safeParse(validSubmission);
    expect(result.success).toBe(true);
  });

  it("rejects name that is too short", () => {
    const result = SubmissionSchema.safeParse({ ...validSubmission, name: "A" });
    expect(result.success).toBe(false);
  });

  it("strips @ from handle", () => {
    const result = SubmissionSchema.safeParse({ ...validSubmission, handle: "@analopez" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.handle).toBe("analopez");
  });

  it("requires phone if contact_consent is true", () => {
    const result = SubmissionSchema.safeParse({
      ...validSubmission,
      contact_consent: true,
      contact_phone: null,
    });
    expect(result.success).toBe(false);
  });

  it("requires budget_custom when budget_range is custom", () => {
    const result = SubmissionSchema.safeParse({
      ...validSubmission,
      budget_range: "custom",
      budget_custom: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects svc with interest=very but no price null is ok", () => {
    const services = [...validSubmission.services];
    services[0] = { ...services[0], interest: "very" };
    const result = SubmissionSchema.safeParse({ ...validSubmission, services });
    expect(result.success).toBe(true);
  });

  it("rejects svc with interest=none but price set", () => {
    const services = [...validSubmission.services];
    services[0] = { ...services[0], interest: "none", priceMonthly: 29 };
    const result = SubmissionSchema.safeParse({ ...validSubmission, services });
    expect(result.success).toBe(false);
  });

  it("rejects platforms empty and platforms_other empty", () => {
    const result = SubmissionSchema.safeParse({ ...validSubmission, platforms: [] });
    expect(result.success).toBe(false);
  });

  it("accepts platforms empty when platforms_other is set", () => {
    const result = SubmissionSchema.safeParse({
      ...validSubmission,
      platforms: [],
      platforms_other: "Threads",
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL with "Cannot find module './schema'" or similar.

- [ ] **Step 4: Implement schema**

Create `lib/schema.ts`:

```ts
import { z } from "zod";

export const FOLLOWER_RANGES = ["lt_1k", "1k_10k", "10k_50k", "50k_100k", "100k_500k", "500k_plus"] as const;
export const HOURS_RANGES = ["lt_2", "2_5", "5_10", "10_plus"] as const;
export const PLATFORMS = ["youtube", "tiktok", "instagram", "facebook", "twitter", "other"] as const;
export const DOES_CURRENTLY = [
  "cut_clips", "design_thumbnails", "optimize_seo", "translate_content",
  "manage_schedule", "newsletter", "paid_community", "online_course",
  "podcast", "merchandise", "none_of_above",
] as const;
export const INTEREST = ["very", "somewhat", "none"] as const;
export const BUDGET_RANGES = ["lt_50", "50_100", "100_200", "200_400", "400_plus", "custom"] as const;
export const BUNDLE_PREFERENCE = ["bundle", "individual", "depends", "not_sure"] as const;

export const ServiceAnswerSchema = z.object({
  serviceId: z.string(),
  interest: z.enum(INTEREST),
  priceMonthly: z.number().int().positive().nullable(),
  priceSetup: z.number().int().positive().nullable(),
}).refine(
  (v) => v.interest !== "none" || (v.priceMonthly === null && v.priceSetup === null),
  { message: "price must be null when interest is none" }
);

export const SubmissionSchema = z.object({
  locale: z.enum(["es", "en"]),
  name: z.string().trim().min(2).max(100),
  handle: z.string().trim().transform((v) => v.replace(/^@+/, "")).pipe(z.string().min(2).max(50)),
  platforms: z.array(z.enum(PLATFORMS)),
  platforms_other: z.string().trim().max(100).nullable(),
  follower_range: z.enum(FOLLOWER_RANGES),
  hours_non_content: z.enum(HOURS_RANGES),
  does_currently: z.array(z.enum(DOES_CURRENTLY)).min(1),
  services: z.array(ServiceAnswerSchema).length(13),
  bundle_starter_price: z.number().int().positive().nullable(),
  bundle_growth_price: z.number().int().positive().nullable(),
  bundle_pro_price: z.number().int().positive().nullable(),
  bundle_preference: z.enum(BUNDLE_PREFERENCE),
  budget_range: z.enum(BUDGET_RANGES),
  budget_custom: z.number().int().positive().nullable(),
  one_wish: z.string().trim().min(3).max(500),
  contact_consent: z.boolean(),
  contact_phone: z.string().trim().nullable(),
  contact_email: z.string().trim().email().nullable(),
  hp_website: z.string(), // honeypot — enforced empty at API level
  is_test: z.boolean(),
}).refine(
  (v) => v.platforms.length > 0 || (v.platforms_other && v.platforms_other.length > 0),
  { message: "platforms or platforms_other required", path: ["platforms"] }
).refine(
  (v) => v.budget_range !== "custom" || (v.budget_custom !== null && v.budget_custom > 0),
  { message: "budget_custom required when range is custom", path: ["budget_custom"] }
).refine(
  (v) => !v.contact_consent || (v.contact_phone !== null && /^\+?[\d\s-]{8,}$/.test(v.contact_phone)),
  { message: "valid contact_phone required when consent is true", path: ["contact_phone"] }
).refine(
  (v) => {
    const hasNone = v.does_currently.includes("none_of_above");
    return !hasNone || v.does_currently.length === 1;
  },
  { message: "none_of_above must be alone", path: ["does_currently"] }
);

export type Submission = z.infer<typeof SubmissionSchema>;
export type ServiceAnswer = z.infer<typeof ServiceAnswerSchema>;
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test
```

Expected: all 9 tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add zod submission schema with validation tests"
```

---

### Task 5: Services and bundles config

**Files:**
- Create: `lib/services.ts`
- Create: `lib/bundles.ts`

- [ ] **Step 1: Create services config**

Create `lib/services.ts`:

```ts
export type ServiceConfig = {
  id: string;
  nameKey: string;
  descriptionKey: string;
  prices: [number, number, number];
  priceSetup?: [number, number, number];
  hasSetupFee: boolean;
};

export const SERVICES: ServiceConfig[] = [
  { id: "short_clips", nameKey: "services.short_clips.name", descriptionKey: "services.short_clips.description", prices: [29, 59, 99], hasSetupFee: false },
  { id: "thumbnail_design", nameKey: "services.thumbnail_design.name", descriptionKey: "services.thumbnail_design.description", prices: [19, 49, 79], hasSetupFee: false },
  { id: "ai_dubbing", nameKey: "services.ai_dubbing.name", descriptionKey: "services.ai_dubbing.description", prices: [49, 89, 149], hasSetupFee: false },
  { id: "content_seo", nameKey: "services.content_seo.name", descriptionKey: "services.content_seo.description", prices: [29, 59, 99], hasSetupFee: false },
  { id: "performance_dashboard", nameKey: "services.performance_dashboard.name", descriptionKey: "services.performance_dashboard.description", prices: [19, 39, 69], hasSetupFee: false },
  { id: "media_kit", nameKey: "services.media_kit.name", descriptionKey: "services.media_kit.description", prices: [19, 39, 69], hasSetupFee: false },
  { id: "ai_coach", nameKey: "services.ai_coach.name", descriptionKey: "services.ai_coach.description", prices: [29, 59, 99], hasSetupFee: false },
  { id: "we_post_for_you", nameKey: "services.we_post_for_you.name", descriptionKey: "services.we_post_for_you.description", prices: [29, 59, 99], hasSetupFee: false },
  { id: "paid_community", nameKey: "services.paid_community.name", descriptionKey: "services.paid_community.description", prices: [99, 199, 299], hasSetupFee: false },
  { id: "newsletter", nameKey: "services.newsletter.name", descriptionKey: "services.newsletter.description", prices: [79, 129, 199], hasSetupFee: false },
  { id: "online_course", nameKey: "services.online_course.name", descriptionKey: "services.online_course.description", prices: [49, 99, 149], priceSetup: [299, 499, 999], hasSetupFee: true },
  { id: "podcast", nameKey: "services.podcast.name", descriptionKey: "services.podcast.description", prices: [49, 79, 149], hasSetupFee: false },
  { id: "merch_store", nameKey: "services.merch_store.name", descriptionKey: "services.merch_store.description", prices: [49, 79, 149], priceSetup: [199, 299, 499], hasSetupFee: true },
];
```

- [ ] **Step 2: Create bundles config**

Create `lib/bundles.ts`:

```ts
export type BundleConfig = {
  id: string;
  tagKey: string;
  nameKey: string;
  includesKey: string;
  prices: [number, number, number];
  standalonePriceRange: string;
  savingsLabel: string;
  isHighlighted: boolean;
};

export const BUNDLES: BundleConfig[] = [
  { id: "starter", tagKey: "bundles.starter.tag", nameKey: "bundles.starter.name", includesKey: "bundles.starter.includes", prices: [79, 99, 129], standalonePriceRange: "$100-200/mo", savingsLabel: "25-40%", isHighlighted: false },
  { id: "growth", tagKey: "bundles.growth.tag", nameKey: "bundles.growth.name", includesKey: "bundles.growth.includes", prices: [149, 199, 249], standalonePriceRange: "$250-450/mo", savingsLabel: "30-45%", isHighlighted: false },
  { id: "pro", tagKey: "bundles.pro.tag", nameKey: "bundles.pro.name", includesKey: "bundles.pro.includes", prices: [249, 329, 399], standalonePriceRange: "$400-700/mo", savingsLabel: "35-50%", isHighlighted: true },
];
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add services and bundles config"
```

---

### Task 6: Populate Spanish messages (textual from source doc)

**Files:**
- Modify: `messages/es.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Replace messages/es.json**

Write complete Spanish messages (text copied from `La_Neta_Creator_Survey_v3.1_Final.md`):

```json
{
  "welcome": {
    "brand": "LA NETA",
    "title": "Queremos escucharte",
    "intro1": "La Neta es una empresa que apoya a creadores de contenido a crecer más rápido, llegar a audiencias globales y construir negocios reales con sus videos. Trabajamos con más de 50,000 creadores en América.",
    "intro2": "Estamos diseñando nuevos servicios pensados específicamente para creadores como vos, y queremos hacerlo bien.",
    "intro3": "Esta encuesta dura 3 minutos. Tus respuestas son confidenciales y van a dar forma directa a lo que construyamos.",
    "gift": "🎁 Completá esta encuesta y sé de los primeros en recibir estos servicios GRATIS o con un descuento fuerte cuando lancemos.",
    "cta": "Empecemos",
    "timeEstimate": "3 min",
    "privacyNotice": "Al continuar aceptás nuestro",
    "privacyLink": "aviso de privacidad",
    "resumeTitle": "Tenés una encuesta sin terminar",
    "resumeContinue": "Continuar →",
    "resumeRestart": "Empezar de cero"
  },
  "progress": {
    "sectionOf": "Sección {current} de {total}",
    "minsLeft": "~{mins} min",
    "lastQuestion": "Última pregunta"
  },
  "nav": {
    "back": "← Atrás",
    "next": "Siguiente →",
    "submit": "Enviar respuestas ✓",
    "submitting": "Enviando..."
  },
  "save": {
    "saved": "✓ Guardado"
  },
  "s1": {
    "sectionTitle": "Sobre vos",
    "q1": { "text": "¿Cómo te llamás?", "placeholder": "Tu nombre" },
    "q2": { "text": "¿Cuál es tu handle en redes?", "placeholder": "@tuhandle" },
    "q3": {
      "text": "¿En qué plataformas creás contenido?",
      "hint": "Seleccioná todas las que apliquen",
      "youtube": "YouTube",
      "tiktok": "TikTok",
      "instagram": "Instagram",
      "facebook": "Facebook",
      "twitter": "Twitter / X",
      "other": "Otra",
      "otherPlaceholder": "¿Cuál?"
    },
    "q4": {
      "text": "¿Cuántos seguidores tenés en total en todas tus plataformas?",
      "lt_1k": "Menos de 1,000",
      "1k_10k": "1,000 – 10,000",
      "10k_50k": "10,000 – 50,000",
      "50k_100k": "50,000 – 100,000",
      "100k_500k": "100,000 – 500,000",
      "500k_plus": "500,000+"
    },
    "q5": {
      "text": "¿Cuántas horas por semana pasás en tareas que NO son crear tu contenido principal?",
      "hint": "Editar clips, hacer thumbnails, postear en redes, contestar DMs, SEO, emails, etc.",
      "lt_2": "Menos de 2 horas",
      "2_5": "2-5 horas",
      "5_10": "5-10 horas",
      "10_plus": "10+ horas"
    },
    "q6": {
      "text": "¿Cuáles de estas cosas hacés actualmente?",
      "hint": "Seleccioná todas las que apliquen",
      "cut_clips": "Corto clips/shorts de mi contenido",
      "design_thumbnails": "Diseño mis propios thumbnails o covers",
      "optimize_seo": "Optimizo mis títulos, descripciones, tags o hashtags",
      "translate_content": "Traduzco o dobleo mi contenido a otros idiomas",
      "manage_schedule": "Manejo mi propio calendario de posteo multi-plataforma",
      "newsletter": "Tengo un newsletter",
      "paid_community": "Tengo una comunidad paga",
      "online_course": "Vendo un curso online",
      "podcast": "Tengo un podcast",
      "merchandise": "Vendo merchandising",
      "none_of_above": "Nada de lo anterior"
    }
  },
  "s2": {
    "sectionTitle": "Servicios que estamos considerando",
    "intro": "Abajo hay 13 servicios que podríamos ofrecer. Para cada uno decinos si te interesa y cuánto pagarías.",
    "counter": "{n} / 13",
    "interest": {
      "label": "¿Te interesa?",
      "very": "🔥 Sí",
      "somewhat": "Tal vez",
      "none": "No"
    },
    "price": {
      "label": "¿Cuánto pagarías por mes?",
      "labelSetup": "Setup + mes",
      "other": "Otro monto",
      "otherPlaceholder": "$___",
      "notInterestedBadge": "No me interesa"
    },
    "continueCta": "Continuar a bundles →"
  },
  "s3": {
    "sectionTitle": "Bundles con descuento",
    "intro": "En vez de comprar servicios uno por uno, podríamos ofrecer bundles con descuento. Mirá la comparación y decinos cuánto pagarías.",
    "standaloneLabel": "Si los compraras sueltos:",
    "savingsLabel": "Ahorrás {amount}",
    "priceQuestion": "¿Cuánto pagarías por mes?",
    "notInterestedBundle": "No me interesa este bundle",
    "q8": {
      "text": "¿Preferís comprar servicios individuales o un bundle?",
      "bundle": "Bundle — un precio por todo, más fácil de manejar",
      "individual": "Individual — solo quiero servicios específicos",
      "depends": "Depende de cuánto ahorre con el bundle",
      "not_sure": "No estoy seguro/a todavía"
    }
  },
  "s4": {
    "sectionTitle": "Últimas preguntas",
    "q9": {
      "text": "¿Cuánto invertirías en TOTAL por mes en hacer crecer tu contenido y marca?",
      "hint": "Incluyendo cualquier herramienta o servicio que ya pagás o considerarías pagar.",
      "lt_50": "Menos de $50/mes",
      "50_100": "$50-100/mes",
      "100_200": "$100-200/mes",
      "200_400": "$200-400/mes",
      "400_plus": "$400+/mes",
      "custom": "Otro monto",
      "customPlaceholder": "$___"
    },
    "q10": {
      "text": "¿Con qué cosa te gustaría más que te ayudemos ahora mismo?",
      "placeholder": "Contame lo que se te ocurra — 2 o 3 líneas alcanza..."
    },
    "q11": {
      "text": "¿Podemos contactarte para compartirte novedades y darte acceso anticipado cuando lancemos?",
      "yes": "Sí 🎁",
      "no": "No",
      "phoneLabel": "Tu número (WhatsApp)",
      "phonePlaceholder": "+52 55 1234 5678",
      "emailLabel": "Tu email (backup, opcional)",
      "emailPlaceholder": "tu@email.com"
    }
  },
  "thanks": {
    "title": "¡Gracias!",
    "body": "Tus respuestas ya están guardadas. Cada una ayuda a construir mejores herramientas para creadores como vos.",
    "gift": "🎁 Ya estás en la lista de early access. Vas a ser de los primeros en probar gratis o con descuento cuando lancemos.",
    "closingLine": "Te agradecemos. Seguí creando — nosotros nos ocupamos del resto.",
    "shareTitle": "¿Conocés otro creador que debería responder?",
    "shareWhatsapp": "📲 Compartir por WhatsApp",
    "shareCopy": "Copiar link",
    "shareCopied": "✓ Link copiado"
  },
  "errors": {
    "required": "Este campo es obligatorio",
    "emailInvalid": "Email inválido",
    "phoneInvalid": "Teléfono inválido",
    "nameShort": "Mínimo 2 caracteres",
    "nameLong": "Máximo 100 caracteres",
    "wishShort": "Contanos un poco más (mínimo 3 caracteres)",
    "submitNetwork": "No pudimos guardar tu respuesta. Tu progreso está seguro.",
    "submitServer": "Algo falló de nuestro lado. Intentalo en unos segundos.",
    "submitRateLimit": "Muchos intentos seguidos. Probá en 1 hora.",
    "retry": "Intentar de nuevo"
  },
  "services": {
    "short_clips": { "name": "Short-form clips", "description": "Convertimos tu contenido en clips listos para postear en TikTok, Reels y Shorts. Con captions, formato y branding incluidos. Vos solo posteás." },
    "thumbnail_design": { "name": "Thumbnail + cover design", "description": "Thumbnails o covers profesionales con 2-3 variantes para testear cuál recibe más clics. Más títulos optimizados con datos de búsqueda de tu nicho." },
    "ai_dubbing": { "name": "AI dubbing / traducción", "description": "Dobleamos tus videos a otros idiomas con IA que suena igual que vos. O traducimos tus captions y overlays para posts multilingües." },
    "content_seo": { "name": "Content SEO + hashtags", "description": "Optimizamos cada post y video para ser encontrado: keywords, hashtags, descripciones, tags. Y arreglamos tu contenido viejo que está invisible en búsquedas." },
    "performance_dashboard": { "name": "Dashboard semanal de performance", "description": "Reporte visual semanal mostrando qué está funcionando, qué no, y 3-5 cosas específicas para hacer la próxima semana para crecer más rápido." },
    "media_kit": { "name": "Media kit dinámico", "description": "Un media kit siempre actualizado con tus stats reales. Le mandás un link a las marcas. Siempre al día, sin PDFs viejos. Se actualiza solo." },
    "ai_coach": { "name": "ELEVN AI Coach", "description": "Un asistente IA entrenado con TU data. Preguntale lo que quieras: ideas de contenido, por qué algo rindió mal, mejores horarios de posteo. Respuestas personalizadas 24/7." },
    "we_post_for_you": { "name": "Posteamos por vos", "description": "No solo creamos tu contenido. Lo posteamos en todas tus redes en los mejores horarios con los hashtags correctos. Tus redes corren en autopilot." },
    "paid_community": { "name": "Comunidad paga (manejada por nosotros)", "description": "Construimos y manejamos una comunidad paga para tus fans más grandes: posts diarios, onboarding de miembros, moderación y crecimiento. Vos aparecés 30 min/semana para una sesión en vivo." },
    "newsletter": { "name": "Newsletter (escrito y enviado por nosotros)", "description": "Escribimos y enviamos un newsletter semanal por email a partir de tu contenido. Vos nos das bullets o una nota de voz. Nosotros lo hacemos profesional y lo mandamos a tu lista." },
    "online_course": { "name": "Curso online (armado por nosotros)", "description": "Armamos un curso completo con tu expertise: currículo, sales page, checkout, emails de lanzamiento. Vos grabás los videos. El curso se vende solo." },
    "podcast": { "name": "Podcast (a partir de tu contenido existente)", "description": "Convertimos tus videos en un podcast profesional. No grabás nada extra. Nosotros limpiamos el audio, hacemos show notes y distribuimos en Spotify y Apple." },
    "merch_store": { "name": "Tienda de merch (diseñada y manejada)", "description": "Diseñamos merchandise con tu marca y construimos tu tienda online. Un partner maneja manufactura, impresión y envío. Cero inventario para vos. Solo promocionás." }
  },
  "bundles": {
    "starter": {
      "tag": "STARTER",
      "name": "Clips + thumbnails + reporte mensual",
      "includes": "Short-form clips, diseño de thumbnails/covers, reporte mensual de performance."
    },
    "growth": {
      "tag": "GROWTH",
      "name": "Starter + dubbing + SEO + AI Coach",
      "includes": "Todo lo de Starter más AI dubbing/traducción, content SEO y ELEVN AI Coach."
    },
    "pro": {
      "tag": "PRO · más completo",
      "name": "Growth + dashboard + media kit + posteo + estrategia",
      "includes": "Todo lo de Growth más dashboard semanal, media kit dinámico, 'posteamos por vos' y call mensual de estrategia de 30 min."
    }
  },
  "privacy": {
    "title": "Aviso de Privacidad",
    "body": "**Global Media Review / La Neta** (\"nosotros\") opera esta encuesta.\n\n## Qué datos recolectamos\n- **Siempre:** respuestas a las preguntas, user-agent del navegador.\n- **Si consentís (Q11):** tu número de WhatsApp y opcionalmente email.\n- **Nunca:** datos bancarios, passwords, tu ubicación GPS.\n\n## Para qué los usamos\n- **Todas las respuestas:** diseñar nuevos servicios para creadores y medir interés.\n- **Teléfono y email (si lo diste):** contactarte con novedades sobre el lanzamiento y darte early access. No lo compartimos con terceros.\n\n## Cuánto tiempo los guardamos\n- 24 meses desde la fecha de envío, o hasta que pidas que los borremos.\n\n## Cómo borrar tus datos\nEscribinos a **privacy@laneta.com** con el asunto \"Borrar mis datos\" desde el email que diste. En 30 días borramos todo lo asociado.\n\n## Seguridad\nTus respuestas se guardan en sistemas privados, accesibles solo por el equipo de La Neta.\n\n---\nÚltima actualización: 20 de abril, 2026"
  },
  "langSwitcher": { "label": "Idioma" }
}
```

- [ ] **Step 2: Create English placeholder messages**

Write complete English messages (using text from the source doc's English sections):

Due to length, create `messages/en.json` with the same key structure as Spanish, translating strings. For v1 it can be mostly a copy of Spanish keys; the ES version is canonical. Copy the ES file and translate the titles/CTAs minimally. Full EN translation is deferred to v1.1.

Minimal EN template:

```json
{
  "welcome": {
    "brand": "LA NETA",
    "title": "We want to hear from you",
    "intro1": "La Neta is a creator-first company that partners with platforms like YouTube, TikTok, Instagram and Pinterest to help content creators grow faster, reach global audiences, and build real businesses. We work with over 50,000 creators across the Americas.",
    "intro2": "We're building new services designed specifically for creators like you, and we want to get it right.",
    "intro3": "This quick survey takes about 3 minutes. Your answers are confidential and will directly shape what we build.",
    "gift": "🎁 Complete this survey and you'll be among the first to receive these services FREE or at a heavy discount when we launch.",
    "cta": "Let's go",
    "timeEstimate": "3 min",
    "privacyNotice": "By continuing you accept our",
    "privacyLink": "privacy notice",
    "resumeTitle": "You have an unfinished survey",
    "resumeContinue": "Continue →",
    "resumeRestart": "Start over"
  },
  "progress": { "sectionOf": "Section {current} of {total}", "minsLeft": "~{mins} min", "lastQuestion": "Last question" },
  "nav": { "back": "← Back", "next": "Next →", "submit": "Submit ✓", "submitting": "Sending..." },
  "save": { "saved": "✓ Saved" }
}
```

Full EN translation can be completed later — v1 ships in ES.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add es and en message files with survey copy"
```

---

## Phase 2 — State & persistence

### Task 7: Zustand store for form state

**Files:**
- Create: `lib/store.ts`

- [ ] **Step 1: Create store**

Create `lib/store.ts`:

```ts
import { create } from "zustand";
import type { Submission, ServiceAnswer } from "./schema";

type FormState = Partial<Omit<Submission, "services" | "hp_website" | "is_test">> & {
  services: Record<string, Partial<ServiceAnswer>>;
  is_test: boolean;
};

type FormActions = {
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  setService: (serviceId: string, patch: Partial<ServiceAnswer>) => void;
  reset: () => void;
  hydrate: (partial: Partial<FormState>) => void;
};

const initial: FormState = {
  services: {},
  is_test: false,
};

export const useFormStore = create<FormState & FormActions>((set) => ({
  ...initial,
  set: (key, value) => set((s) => ({ ...s, [key]: value })),
  setService: (serviceId, patch) =>
    set((s) => ({
      services: {
        ...s.services,
        [serviceId]: { ...s.services[serviceId], serviceId, ...patch },
      },
    })),
  reset: () => set(initial),
  hydrate: (partial) => set((s) => ({ ...s, ...partial })),
}));
```

- [ ] **Step 2: Commit**

```bash
git add lib/store.ts
git commit -m "feat: add zustand form store"
```

---

### Task 8: Draft persistence with tests

**Files:**
- Create: `lib/draft.ts`
- Create: `lib/draft.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/draft.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveDraft, loadDraft, clearDraft, DRAFT_KEY } from "./draft";

describe("draft storage", () => {
  beforeEach(() => { localStorage.clear(); });

  it("saves and loads a draft", () => {
    saveDraft({ answers: { name: "Ana" }, route: "/es/s1/2" });
    const loaded = loadDraft();
    expect(loaded?.answers.name).toBe("Ana");
    expect(loaded?.route).toBe("/es/s1/2");
  });

  it("returns null when no draft exists", () => {
    expect(loadDraft()).toBeNull();
  });

  it("returns null when draft is older than 7 days", () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      version: 1, timestamp: eightDaysAgo, answers: {}, route: "/es",
    }));
    expect(loadDraft()).toBeNull();
  });

  it("returns null when version mismatches", () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      version: 999, timestamp: Date.now(), answers: {}, route: "/es",
    }));
    expect(loadDraft()).toBeNull();
  });

  it("clears draft", () => {
    saveDraft({ answers: { name: "Ana" }, route: "/es/s1/2" });
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("silently no-ops when localStorage throws", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => { throw new Error("QuotaExceeded"); });
    expect(() => saveDraft({ answers: {}, route: "/es" })).not.toThrow();
    Storage.prototype.setItem = original;
  });
});
```

- [ ] **Step 2: Run tests to confirm fail**

```bash
npm test
```

Expected: FAIL with "Cannot find module './draft'".

- [ ] **Step 3: Implement draft module**

Create `lib/draft.ts`:

```ts
export const DRAFT_KEY = "laneta-survey-draft-v1";
const SCHEMA_VERSION = 1;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type DraftPayload = {
  version: number;
  timestamp: number;
  answers: Record<string, unknown>;
  route: string;
};

export function saveDraft({ answers, route }: { answers: Record<string, unknown>; route: string }): void {
  try {
    const payload: DraftPayload = { version: SCHEMA_VERSION, timestamp: Date.now(), answers, route };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be disabled or full — silently no-op
  }
}

export function loadDraft(): { answers: Record<string, unknown>; route: string } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    if (parsed.version !== SCHEMA_VERSION) return null;
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) return null;
    return { answers: parsed.answers, route: parsed.route };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add draft persistence with expiry and versioning"
```

---

## Phase 3 — UI primitives

### Task 9: Container + ProgressBar + LangSelector

**Files:**
- Create: `components/chrome/Container.tsx`
- Create: `components/chrome/ProgressBar.tsx`
- Create: `components/chrome/LangSelector.tsx`

- [ ] **Step 1: Create Container**

Create `components/chrome/Container.tsx`:

```tsx
export function Container({
  children,
  variant = "wizard",
}: {
  children: React.ReactNode;
  variant?: "wizard" | "scroll";
}) {
  const maxW = variant === "wizard" ? "max-w-[440px]" : "max-w-[560px]";
  return (
    <div className={`w-full mx-auto ${maxW} px-4 md:px-0 py-8`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create ProgressBar**

Create `components/chrome/ProgressBar.tsx`:

```tsx
"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function ProgressBar({
  section,
  percent,
  minsLeft,
  isLastQuestion = false,
}: {
  section: 1 | 2 | 3 | 4;
  percent: number;
  minsLeft: number;
  isLastQuestion?: boolean;
}) {
  const t = useTranslations("progress");
  return (
    <div className="mb-7">
      <div className="h-[3px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden mb-1.5">
        <motion.div
          className="h-full bg-accent-gradient"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-white/55">
        <span>{t("sectionOf", { current: section, total: 4 })}</span>
        <span>{isLastQuestion ? t("lastQuestion") : t("minsLeft", { mins: minsLeft })}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create LangSelector**

Create `components/chrome/LangSelector.tsx`:

```tsx
"use client";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

export function LangSelector() {
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "es" ? "en" : "es";
  const newPath = pathname.replace(/^\/(es|en)/, `/${other}`);
  return (
    <Link
      href={newPath}
      className="fixed top-5 right-5 text-[11px] tracking-widest text-white/55 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:text-white transition-colors"
    >
      🌐 {locale.toUpperCase()} · {other.toUpperCase()}
    </Link>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add container, progress bar, and lang selector components"
```

---

### Task 10: Pill and PriceRow field components

**Files:**
- Create: `components/fields/Pill.tsx`
- Create: `components/fields/PriceRow.tsx`

- [ ] **Step 1: Create Pill**

Create `components/fields/Pill.tsx`:

```tsx
"use client";
import { motion } from "framer-motion";
import clsx from "clsx";

export function Pill({
  children,
  selected = false,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  variant?: "default" | "small";
}) {
  const base = variant === "small"
    ? "px-3 py-2.5 text-xs"
    : "px-4 py-3.5 text-sm";
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={clsx(
        "w-full text-left rounded-xl border transition-colors",
        base,
        selected
          ? "bg-accent-gradient border-transparent text-white font-medium"
          : "bg-raised border-[rgba(255,255,255,0.12)] text-white hover:bg-raised-selected"
      )}
    >
      {children}
    </motion.button>
  );
}
```

- [ ] **Step 2: Install clsx**

```bash
npm install clsx
```

- [ ] **Step 3: Create PriceRow**

Create `components/fields/PriceRow.tsx`:

```tsx
"use client";
import { useState } from "react";
import { Pill } from "./Pill";

export function PriceRow({
  prices,
  value,
  onChange,
}: {
  prices: readonly [number, number, number];
  value: number | null;
  onChange: (v: number | null, isCustom: boolean) => void;
}) {
  const [custom, setCustom] = useState<string>("");
  const isPreset = value !== null && prices.includes(value as (typeof prices)[number]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {prices.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => { setCustom(""); onChange(p, false); }}
            className={`py-2.5 rounded-[10px] text-sm font-semibold transition-colors ${
              value === p
                ? "bg-accent-gradient text-white"
                : "bg-raised border border-[rgba(255,255,255,0.12)]"
            }`}
          >
            ${p}
          </button>
        ))}
      </div>
      <input
        type="number"
        inputMode="decimal"
        value={custom}
        placeholder="Otro monto"
        onChange={(e) => {
          setCustom(e.target.value);
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) && n > 0 ? n : null, true);
        }}
        className={`w-full px-3 py-2.5 text-sm rounded-[10px] bg-raised border text-center transition-colors ${
          value !== null && !isPreset
            ? "border-violet"
            : "border-dashed border-[rgba(255,255,255,0.2)]"
        } focus:outline-none focus:border-violet`}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add pill and price row field components"
```

---

### Task 11: TextInput, TextArea, YesNo, WizardNav

**Files:**
- Create: `components/fields/TextInput.tsx`
- Create: `components/fields/TextArea.tsx`
- Create: `components/fields/YesNo.tsx`
- Create: `components/chrome/WizardNav.tsx`

- [ ] **Step 1: Create TextInput**

Create `components/fields/TextInput.tsx`:

```tsx
"use client";
import clsx from "clsx";

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  autoFocus = false,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  error?: string | null;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) { e.preventDefault(); onEnter(); }
        }}
        aria-invalid={!!error}
        className={clsx(
          "w-full px-4 py-3.5 text-sm rounded-xl bg-raised border transition-colors focus:outline-none",
          error
            ? "border-error focus:border-error"
            : "border-[rgba(255,255,255,0.12)] focus:border-white/40"
        )}
      />
      {error && <p className="text-[12px] text-error">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Create TextArea**

Create `components/fields/TextArea.tsx`:

```tsx
"use client";
import clsx from "clsx";

export function TextArea({
  value,
  onChange,
  placeholder,
  maxLength = 500,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        aria-invalid={!!error}
        className={clsx(
          "w-full px-4 py-3 text-sm rounded-xl bg-raised border transition-colors focus:outline-none resize-none",
          error ? "border-error" : "border-[rgba(255,255,255,0.12)] focus:border-white/40"
        )}
      />
      <div className="flex justify-between text-[11px]">
        <span className="text-error">{error || ""}</span>
        <span className="text-white/40">{value.length} / {maxLength}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create YesNo**

Create `components/fields/YesNo.tsx`:

```tsx
"use client";
import { motion } from "framer-motion";
import clsx from "clsx";

export function YesNo({
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="flex gap-2">
      {[
        { v: true, label: yesLabel },
        { v: false, label: noLabel },
      ].map((opt) => (
        <motion.button
          key={String(opt.v)}
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(opt.v)}
          className={clsx(
            "flex-1 py-4 rounded-xl border text-sm font-semibold transition-colors",
            value === opt.v
              ? "bg-accent-gradient border-transparent text-white"
              : "bg-raised border-[rgba(255,255,255,0.15)]"
          )}
        >
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create WizardNav**

Create `components/chrome/WizardNav.tsx`:

```tsx
"use client";
import { useTranslations } from "next-intl";
import clsx from "clsx";

export function WizardNav({
  onBack,
  onNext,
  canGoBack = true,
  canAdvance = true,
  nextLabel,
}: {
  onBack?: () => void;
  onNext: () => void;
  canGoBack?: boolean;
  canAdvance?: boolean;
  nextLabel?: string;
}) {
  const t = useTranslations("nav");
  return (
    <div className="flex justify-between mt-8 text-sm">
      {canGoBack ? (
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          {t("back")}
        </button>
      ) : <div />}
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance}
        className={clsx(
          "px-5 py-2.5 rounded-full font-semibold transition-opacity",
          canAdvance
            ? "bg-white text-black hover:opacity-90"
            : "bg-white/20 text-white/50 cursor-not-allowed"
        )}
      >
        {nextLabel || t("next")}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add text input, textarea, yes/no and wizard nav components"
```

---

## Phase 4 — Screens

### Task 12: Welcome screen with resume banner

**Files:**
- Create: `components/screens/Welcome.tsx`
- Create: `components/chrome/ResumeBanner.tsx`
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Create ResumeBanner**

Create `components/chrome/ResumeBanner.tsx`:

```tsx
"use client";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export function ResumeBanner({
  onContinue,
  onRestart,
}: {
  onContinue: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations("welcome");
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 p-3.5 rounded-xl flex justify-between items-center gap-3 text-sm"
      style={{
        background: "linear-gradient(90deg, rgba(167,139,250,0.12), rgba(236,72,153,0.08))",
        border: "1px solid rgba(167,139,250,0.25)",
      }}
    >
      <span className="flex-1">{t("resumeTitle")}</span>
      <div className="flex gap-2">
        <button
          onClick={onRestart}
          className="text-[11px] px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20"
        >
          {t("resumeRestart")}
        </button>
        <button
          onClick={onContinue}
          className="text-[11px] px-2.5 py-1.5 rounded-full bg-white text-black font-semibold"
        >
          {t("resumeContinue")}
        </button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Create Welcome component**

Create `components/screens/Welcome.tsx`:

```tsx
"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/chrome/Container";
import { ResumeBanner } from "@/components/chrome/ResumeBanner";
import { LangSelector } from "@/components/chrome/LangSelector";
import { loadDraft, clearDraft } from "@/lib/draft";
import { useFormStore } from "@/lib/store";

export function Welcome() {
  const t = useTranslations("welcome");
  const locale = useLocale();
  const router = useRouter();
  const [draft, setDraft] = useState<ReturnType<typeof loadDraft>>(null);
  const hydrate = useFormStore((s) => s.hydrate);

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  const start = () => {
    clearDraft();
    useFormStore.getState().reset();
    router.push(`/${locale}/s1/1`);
  };

  const resume = () => {
    if (!draft) return;
    hydrate(draft.answers as Parameters<typeof hydrate>[0]);
    router.push(draft.route);
  };

  return (
    <>
      <LangSelector />
      <Container variant="wizard">
        {draft && <ResumeBanner onContinue={resume} onRestart={start} />}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="text-center text-[11px] tracking-widest text-white/60 mb-4">
            {t("brand")}
          </div>
          <h1 className="text-[30px] md:text-[34px] font-bold leading-[1.1] tracking-tight gradient-text text-center mb-4">
            {t("title")}
          </h1>
          <p className="text-sm text-white/70 leading-relaxed mb-3">{t("intro1")}</p>
          <p className="text-sm text-white/70 leading-relaxed mb-3">{t("intro2")}</p>
          <p className="text-sm text-white/70 leading-relaxed mb-4">{t("intro3")}</p>

          <div
            className="rounded-xl px-3.5 py-3 text-[13px] leading-snug mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(236,72,153,0.1))",
              border: "1px solid rgba(167,139,250,0.3)",
            }}
          >
            {t("gift")}
          </div>

          <button
            onClick={start}
            className="block w-full py-3.5 rounded-full bg-accent-gradient text-white font-semibold text-sm"
          >
            {t("cta")} →
          </button>

          <p className="text-[10px] text-white/45 text-center mt-3.5">
            {t("privacyNotice")}{" "}
            <a href={`/${locale}/privacy`} className="underline">
              {t("privacyLink")}
            </a>
            .
          </p>
        </motion.div>
      </Container>
    </>
  );
}
```

- [ ] **Step 3: Update app/[locale]/page.tsx**

Replace `app/[locale]/page.tsx`:

```tsx
import { Welcome } from "@/components/screens/Welcome";

export default function WelcomePage() {
  return <Welcome />;
}
```

- [ ] **Step 4: Verify welcome renders**

```bash
npm run dev
```

Visit `http://localhost:3000/es`. Expected: welcome screen renders with gradient title, body, gift box, CTA, privacy link, and lang selector in corner.

Stop server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: welcome screen with resume banner"
```

---

### Task 13: S1 wizard (6 questions)

**Files:**
- Create: `app/[locale]/s1/[qId]/page.tsx`
- Create: `components/screens/S1Wizard.tsx`

- [ ] **Step 1: Create S1Wizard component**

Create `components/screens/S1Wizard.tsx`:

```tsx
"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { Container } from "@/components/chrome/Container";
import { ProgressBar } from "@/components/chrome/ProgressBar";
import { LangSelector } from "@/components/chrome/LangSelector";
import { WizardNav } from "@/components/chrome/WizardNav";
import { Pill } from "@/components/fields/Pill";
import { TextInput } from "@/components/fields/TextInput";
import { useFormStore } from "@/lib/store";
import { saveDraft } from "@/lib/draft";
import { FOLLOWER_RANGES, HOURS_RANGES, PLATFORMS, DOES_CURRENTLY } from "@/lib/schema";

const TOTAL_S1 = 6;

export function S1Wizard({ qId }: { qId: number }) {
  const t = useTranslations("s1");
  const locale = useLocale();
  const router = useRouter();
  const store = useFormStore();
  const percent = ((qId - 1) / (4 * 4)) * 20 + 0;
  // S1 is 20% of total; within-section progress is (qId-1)/6 of 20%.
  const s1Percent = ((qId - 1) / TOTAL_S1) * 20;

  const goNext = () => {
    const route = qId < TOTAL_S1 ? `/${locale}/s1/${qId + 1}` : `/${locale}/s2`;
    saveDraft({ answers: { ...store, set: undefined, setService: undefined, reset: undefined, hydrate: undefined } as Record<string, unknown>, route });
    router.push(route);
  };
  const goBack = () => {
    if (qId > 1) router.push(`/${locale}/s1/${qId - 1}`);
    else router.push(`/${locale}`);
  };

  return (
    <>
      <LangSelector />
      <Container variant="wizard">
        <ProgressBar section={1} percent={s1Percent} minsLeft={3} />
        <AnimatePresence mode="wait">
          <motion.div
            key={qId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="text-[11px] tracking-wider text-white/45 mb-2">
              PREGUNTA {qId} / 11
            </p>

            {qId === 1 && <Q1 t={t} store={store} onEnter={goNext} />}
            {qId === 2 && <Q2 t={t} store={store} onEnter={goNext} />}
            {qId === 3 && <Q3 t={t} store={store} />}
            {qId === 4 && <Q4 t={t} store={store} goNext={goNext} />}
            {qId === 5 && <Q5 t={t} store={store} goNext={goNext} />}
            {qId === 6 && <Q6 t={t} store={store} />}

            <WizardNav
              onBack={goBack}
              onNext={goNext}
              canAdvance={canAdvance(qId, store)}
            />
          </motion.div>
        </AnimatePresence>
      </Container>
    </>
  );
}

function canAdvance(qId: number, s: ReturnType<typeof useFormStore.getState>): boolean {
  if (qId === 1) return !!s.name && s.name.trim().length >= 2;
  if (qId === 2) return !!s.handle && s.handle.trim().length >= 2;
  if (qId === 3) return (s.platforms?.length ?? 0) > 0 || !!(s.platforms_other && s.platforms_other.length > 0);
  if (qId === 4) return !!s.follower_range;
  if (qId === 5) return !!s.hours_non_content;
  if (qId === 6) return (s.does_currently?.length ?? 0) > 0;
  return false;
}

function Q1({ t, store, onEnter }: any) {
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-5">{t("q1.text")}</h2>
      <TextInput
        value={store.name || ""}
        onChange={(v) => store.set("name", v)}
        placeholder={t("q1.placeholder")}
        autoFocus
        onEnter={onEnter}
      />
    </>
  );
}

function Q2({ t, store, onEnter }: any) {
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-5">{t("q2.text")}</h2>
      <TextInput
        value={store.handle || ""}
        onChange={(v) => store.set("handle", v)}
        placeholder={t("q2.placeholder")}
        autoFocus
        onEnter={onEnter}
      />
    </>
  );
}

function Q3({ t, store }: any) {
  const toggle = (p: string) => {
    const cur = store.platforms || [];
    const next = cur.includes(p) ? cur.filter((x: string) => x !== p) : [...cur, p];
    store.set("platforms", next);
  };
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-2">{t("q3.text")}</h2>
      <p className="text-[12px] text-white/55 mb-4">{t("q3.hint")}</p>
      <div className="space-y-2">
        {PLATFORMS.filter((p) => p !== "other").map((p) => (
          <Pill key={p} selected={(store.platforms || []).includes(p)} onClick={() => toggle(p)}>
            {t(`q3.${p}`)}
          </Pill>
        ))}
        <Pill selected={(store.platforms || []).includes("other")} onClick={() => toggle("other")}>
          {t("q3.other")}
        </Pill>
        {(store.platforms || []).includes("other") && (
          <TextInput
            value={store.platforms_other || ""}
            onChange={(v) => store.set("platforms_other", v)}
            placeholder={t("q3.otherPlaceholder")}
          />
        )}
      </div>
    </>
  );
}

function Q4({ t, store, goNext }: any) {
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-5">{t("q4.text")}</h2>
      <div className="space-y-2">
        {FOLLOWER_RANGES.map((r) => (
          <Pill
            key={r}
            selected={store.follower_range === r}
            onClick={() => {
              store.set("follower_range", r);
              setTimeout(goNext, 200);
            }}
          >
            {t(`q4.${r}`)}
          </Pill>
        ))}
      </div>
    </>
  );
}

function Q5({ t, store, goNext }: any) {
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-2">{t("q5.text")}</h2>
      <p className="text-[12px] text-white/55 mb-4">{t("q5.hint")}</p>
      <div className="space-y-2">
        {HOURS_RANGES.map((r) => (
          <Pill
            key={r}
            selected={store.hours_non_content === r}
            onClick={() => {
              store.set("hours_non_content", r);
              setTimeout(goNext, 200);
            }}
          >
            {t(`q5.${r}`)}
          </Pill>
        ))}
      </div>
    </>
  );
}

function Q6({ t, store }: any) {
  const toggle = (key: string) => {
    const cur = store.does_currently || [];
    let next: string[];
    if (key === "none_of_above") {
      next = cur.includes(key) ? [] : ["none_of_above"];
    } else {
      next = cur.includes(key) ? cur.filter((x: string) => x !== key) : [...cur.filter((x: string) => x !== "none_of_above"), key];
    }
    store.set("does_currently", next);
  };
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-2">{t("q6.text")}</h2>
      <p className="text-[12px] text-white/55 mb-4">{t("q6.hint")}</p>
      <div className="space-y-2">
        {DOES_CURRENTLY.map((k) => (
          <Pill key={k} selected={(store.does_currently || []).includes(k)} onClick={() => toggle(k)}>
            {t(`q6.${k}`)}
          </Pill>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create S1 route**

Create `app/[locale]/s1/[qId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { S1Wizard } from "@/components/screens/S1Wizard";

export default async function S1Page({ params }: { params: Promise<{ locale: string; qId: string }> }) {
  const { qId } = await params;
  const n = parseInt(qId, 10);
  if (!Number.isInteger(n) || n < 1 || n > 6) notFound();
  return <S1Wizard qId={n} />;
}
```

- [ ] **Step 3: Verify flow**

```bash
npm run dev
```

Visit welcome, click "Empecemos", walk through Q1→Q6. Verify:
- Enter advances on text fields
- Auto-advance works on Q4 and Q5
- Back button works
- Progress bar updates

Stop server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: section 1 wizard with 6 questions"
```

---

### Task 14: Section 2 service card with progressive disclosure

**Files:**
- Create: `components/service/ServiceCard.tsx`

- [ ] **Step 1: Create ServiceCard**

Create `components/service/ServiceCard.tsx`:

```tsx
"use client";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { PriceRow } from "@/components/fields/PriceRow";
import type { ServiceConfig } from "@/lib/services";
import { useFormStore } from "@/lib/store";

export function ServiceCard({ service, index }: { service: ServiceConfig; index: number }) {
  const t = useTranslations();
  const state = useFormStore((s) => s.services[service.id] || {});
  const setService = useFormStore((s) => s.setService);

  const interest = state.interest ?? null;
  const priceMonthly = state.priceMonthly ?? null;
  const priceSetup = state.priceSetup ?? null;

  const setInterest = (v: "very" | "somewhat" | "none") => {
    if (v === "none") {
      setService(service.id, { interest: v, priceMonthly: null, priceSetup: null, serviceId: service.id });
    } else {
      setService(service.id, { interest: v, serviceId: service.id });
    }
  };

  const isCollapsed = interest === "none";

  const reopen = () => {
    setService(service.id, { interest: undefined as unknown as "very", priceMonthly: null, priceSetup: null, serviceId: service.id });
  };

  return (
    <motion.div
      layout
      onClick={isCollapsed ? reopen : undefined}
      className={clsx(
        "rounded-2xl border p-3.5 mb-2.5 transition-colors",
        isCollapsed
          ? "bg-raised border-[rgba(255,255,255,0.05)] opacity-60 cursor-pointer hover:opacity-80"
          : interest
          ? "bg-raised-selected border-[rgba(255,255,255,0.18)]"
          : "bg-raised border-border-subtle"
      )}
    >
      <div className="flex justify-between items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-widest text-white/40">{String(index + 1).padStart(2, "0")} / 13</div>
          <div className="text-[14px] font-semibold mt-0.5 mb-1">{t(service.nameKey)}</div>
          {!isCollapsed && (
            <div className="text-[12px] text-white/65 leading-snug">{t(service.descriptionKey)}</div>
          )}
        </div>
        {isCollapsed && (
          <span className="text-[11px] px-2 py-1 rounded-full bg-white/8 text-white/70 whitespace-nowrap">
            {t("s2.price.notInterestedBadge")}
          </span>
        )}
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {(["very", "somewhat", "none"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setInterest(v)}
              className={clsx(
                "py-2.5 px-2 rounded-[10px] text-[12px] font-medium border transition-colors",
                interest === v
                  ? "bg-white text-black border-white"
                  : "bg-raised border-[rgba(255,255,255,0.12)] text-white"
              )}
            >
              {t(`s2.interest.${v}`)}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {interest && interest !== "none" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/6">
              <div className="text-[11px] text-white/50 mb-1.5">
                {service.hasSetupFee ? t("s2.price.labelSetup") : t("s2.price.label")}
              </div>
              <PriceRow
                prices={service.prices}
                value={priceMonthly}
                onChange={(v, isCustom) =>
                  setService(service.id, { priceMonthly: v, serviceId: service.id })
                }
              />
              {service.hasSetupFee && service.priceSetup && (
                <div className="mt-2">
                  <div className="text-[11px] text-white/50 mb-1.5">Setup</div>
                  <PriceRow
                    prices={service.priceSetup}
                    value={priceSetup}
                    onChange={(v) =>
                      setService(service.id, { priceSetup: v, serviceId: service.id })
                    }
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: service card with progressive disclosure"
```

---

### Task 15: S2 page (service list)

**Files:**
- Create: `app/[locale]/s2/page.tsx`
- Create: `components/screens/S2List.tsx`

- [ ] **Step 1: Create S2List component**

Create `components/screens/S2List.tsx`:

```tsx
"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/chrome/Container";
import { ProgressBar } from "@/components/chrome/ProgressBar";
import { LangSelector } from "@/components/chrome/LangSelector";
import { ServiceCard } from "@/components/service/ServiceCard";
import { SERVICES } from "@/lib/services";

export function S2List() {
  const t = useTranslations("s2");
  const locale = useLocale();
  const router = useRouter();

  return (
    <>
      <LangSelector />
      <Container variant="scroll">
        <ProgressBar section={2} percent={30} minsLeft={2} />
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-[18px] font-semibold mb-1">{t("sectionTitle")}</h2>
          <p className="text-[13px] text-white/60 mb-5">{t("intro")}</p>

          {SERVICES.map((svc, i) => (
            <ServiceCard key={svc.id} service={svc} index={i} />
          ))}

          <button
            onClick={() => router.push(`/${locale}/s3`)}
            className="mt-4 block w-full py-3.5 rounded-full bg-white text-black font-semibold text-sm"
          >
            {t("continueCta")}
          </button>
        </motion.div>
      </Container>
    </>
  );
}
```

- [ ] **Step 2: Create route**

Create `app/[locale]/s2/page.tsx`:

```tsx
import { S2List } from "@/components/screens/S2List";
export default function S2Page() { return <S2List />; }
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Visit welcome → s1 → s2. Verify:
- All 13 service cards render
- Selecting "No" collapses the card
- Selecting "Sí" or "Tal vez" reveals price row
- Services 11 (course) and 13 (merch) show setup price row
- "Continuar a bundles" navigates to s3 (will 404 for now)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: section 2 service list page"
```

---

### Task 16: Bundle card + S3 page

**Files:**
- Create: `components/bundle/BundleCard.tsx`
- Create: `app/[locale]/s3/page.tsx`
- Create: `components/screens/S3Bundles.tsx`

- [ ] **Step 1: Create BundleCard**

Create `components/bundle/BundleCard.tsx`:

```tsx
"use client";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { PriceRow } from "@/components/fields/PriceRow";
import { useFormStore } from "@/lib/store";
import type { BundleConfig } from "@/lib/bundles";

export function BundleCard({ bundle }: { bundle: BundleConfig }) {
  const t = useTranslations();
  const storeKey = `bundle_${bundle.id}_price` as "bundle_starter_price" | "bundle_growth_price" | "bundle_pro_price";
  const value = useFormStore((s) => s[storeKey] ?? null);
  const setField = useFormStore((s) => s.set);

  return (
    <div
      className={clsx(
        "rounded-2xl border p-3.5 mb-2.5",
        bundle.isHighlighted
          ? "border-[rgba(167,139,250,0.3)]"
          : "border-border-subtle"
      )}
      style={
        bundle.isHighlighted
          ? { background: "linear-gradient(180deg, rgba(167,139,250,0.08), rgba(167,139,250,0.02))" }
          : { background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))" }
      }
    >
      <div className="inline-block text-[10px] tracking-widest px-2 py-0.5 rounded-full bg-white/8 mb-1.5">
        {t(bundle.tagKey)}
      </div>
      <div className="text-[15px] font-bold mb-1.5">{t(bundle.nameKey)}</div>
      <div className="text-[12px] text-white/70 leading-snug mb-2.5">{t(bundle.includesKey)}</div>
      <div className="flex justify-between text-[11px] mt-2 pt-2 border-t border-white/8">
        <span className="text-white/45 line-through">{bundle.standalonePriceRange}</span>
        <span className="text-success font-semibold">{t("s3.savingsLabel", { amount: bundle.savingsLabel })}</span>
      </div>

      <div className="text-[13px] font-medium mt-3.5 mb-2">{t("s3.priceQuestion")}</div>
      <PriceRow
        prices={bundle.prices}
        value={value as number | null}
        onChange={(v) => setField(storeKey, v)}
      />
      <button
        onClick={() => setField(storeKey, null)}
        className="block w-full text-[11px] text-white/50 underline mt-2 py-1"
      >
        {t("s3.notInterestedBundle")}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create S3Bundles component**

Create `components/screens/S3Bundles.tsx`:

```tsx
"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/chrome/Container";
import { ProgressBar } from "@/components/chrome/ProgressBar";
import { LangSelector } from "@/components/chrome/LangSelector";
import { BundleCard } from "@/components/bundle/BundleCard";
import { Pill } from "@/components/fields/Pill";
import { BUNDLES } from "@/lib/bundles";
import { BUNDLE_PREFERENCE } from "@/lib/schema";
import { useFormStore } from "@/lib/store";

export function S3Bundles() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pref = useFormStore((s) => s.bundle_preference);
  const setField = useFormStore((s) => s.set);

  return (
    <>
      <LangSelector />
      <Container variant="scroll">
        <ProgressBar section={3} percent={70} minsLeft={1} />
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-[18px] font-semibold mb-1">{t("s3.sectionTitle")}</h2>
          <p className="text-[13px] text-white/60 mb-5">{t("s3.intro")}</p>

          {BUNDLES.map((b) => <BundleCard key={b.id} bundle={b} />)}

          <div className="mt-6 pt-5 border-t border-white/8">
            <h3 className="text-[14px] font-medium mb-3">{t("s3.q8.text")}</h3>
            <div className="space-y-2">
              {BUNDLE_PREFERENCE.map((v) => (
                <Pill
                  key={v}
                  selected={pref === v}
                  onClick={() => setField("bundle_preference", v)}
                >
                  {t(`s3.q8.${v}`)}
                </Pill>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push(`/${locale}/s4/9`)}
            disabled={!pref}
            className={`mt-5 block w-full py-3.5 rounded-full font-semibold text-sm ${
              pref ? "bg-white text-black" : "bg-white/20 text-white/50 cursor-not-allowed"
            }`}
          >
            Siguiente →
          </button>
        </motion.div>
      </Container>
    </>
  );
}
```

- [ ] **Step 3: Create route**

Create `app/[locale]/s3/page.tsx`:

```tsx
import { S3Bundles } from "@/components/screens/S3Bundles";
export default function S3Page() { return <S3Bundles />; }
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Walk: welcome → s1 → s2 → s3. Verify bundle cards render with savings, pricing works, Q8 pill selection required to proceed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: section 3 bundles page with q8"
```

---

### Task 17: S4 wizard (Q9, Q10, Q11 with conditional)

**Files:**
- Create: `app/[locale]/s4/[qId]/page.tsx`
- Create: `components/screens/S4Wizard.tsx`

- [ ] **Step 1: Create S4Wizard**

Create `components/screens/S4Wizard.tsx`:

```tsx
"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Container } from "@/components/chrome/Container";
import { ProgressBar } from "@/components/chrome/ProgressBar";
import { LangSelector } from "@/components/chrome/LangSelector";
import { WizardNav } from "@/components/chrome/WizardNav";
import { Pill } from "@/components/fields/Pill";
import { TextInput } from "@/components/fields/TextInput";
import { TextArea } from "@/components/fields/TextArea";
import { YesNo } from "@/components/fields/YesNo";
import { BUDGET_RANGES } from "@/lib/schema";
import { useFormStore } from "@/lib/store";

export function S4Wizard({ qId }: { qId: 9 | 10 | 11 }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const store = useFormStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const percent = qId === 9 ? 82 : qId === 10 ? 92 : 98;

  const goBack = () => {
    if (qId === 9) router.push(`/${locale}/s3`);
    else router.push(`/${locale}/s4/${qId - 1}`);
  };

  const goNext = () => {
    if (qId === 9) router.push(`/${locale}/s4/10`);
    else if (qId === 10) router.push(`/${locale}/s4/11`);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...store,
          locale,
          services: Object.values(store.services).map((s) => ({
            serviceId: s.serviceId,
            interest: s.interest ?? "none",
            priceMonthly: s.priceMonthly ?? null,
            priceSetup: s.priceSetup ?? null,
          })),
          hp_website: "",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) setError(t("errors.submitRateLimit"));
        else setError(body.error || t("errors.submitServer"));
        setSubmitting(false);
        return;
      }
      router.push(`/${locale}/thanks`);
    } catch {
      setError(t("errors.submitNetwork"));
      setSubmitting(false);
    }
  };

  return (
    <>
      <LangSelector />
      <Container variant="wizard">
        <ProgressBar section={4} percent={percent} minsLeft={0} isLastQuestion={qId === 11} />
        <AnimatePresence mode="wait">
          <motion.div
            key={qId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="text-[11px] tracking-wider text-white/45 mb-2">PREGUNTA {qId} / 11</p>

            {qId === 9 && <Q9 t={t} store={store} />}
            {qId === 10 && <Q10 t={t} store={store} />}
            {qId === 11 && (
              <Q11 t={t} store={store} submitting={submitting} error={error} onSubmit={submit} />
            )}

            {qId !== 11 && (
              <WizardNav
                onBack={goBack}
                onNext={goNext}
                canAdvance={canAdvance(qId, store)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Container>
    </>
  );
}

function canAdvance(qId: number, s: ReturnType<typeof useFormStore.getState>): boolean {
  if (qId === 9) {
    if (!s.budget_range) return false;
    if (s.budget_range === "custom") return !!s.budget_custom && s.budget_custom > 0;
    return true;
  }
  if (qId === 10) return !!s.one_wish && s.one_wish.trim().length >= 3;
  return true;
}

function Q9({ t, store }: any) {
  return (
    <>
      <h2 className="text-[22px] font-semibold leading-tight mb-2">{t("s4.q9.text")}</h2>
      <p className="text-[12px] text-white/55 mb-4">{t("s4.q9.hint")}</p>
      <div className="space-y-2">
        {BUDGET_RANGES.filter((r) => r !== "custom").map((r) => (
          <Pill key={r} selected={store.budget_range === r} onClick={() => store.set("budget_range", r)}>
            {t(`s4.q9.${r}`)}
          </Pill>
        ))}
        <Pill
          selected={store.budget_range === "custom"}
          onClick={() => store.set("budget_range", "custom")}
        >
          {t("s4.q9.custom")}
        </Pill>
        {store.budget_range === "custom" && (
          <TextInput
            type="text"
            value={store.budget_custom?.toString() || ""}
            onChange={(v) => {
              const n = parseInt(v, 10);
              store.set("budget_custom", Number.isFinite(n) && n > 0 ? n : null);
            }}
            placeholder={t("s4.q9.customPlaceholder")}
          />
        )}
      </div>
    </>
  );
}

function Q10({ t, store }: any) {
  return (
    <>
      <h2 className="text-[20px] font-semibold leading-tight mb-4">{t("s4.q10.text")}</h2>
      <TextArea
        value={store.one_wish || ""}
        onChange={(v) => store.set("one_wish", v)}
        placeholder={t("s4.q10.placeholder")}
        maxLength={500}
      />
    </>
  );
}

function Q11({ t, store, submitting, error, onSubmit }: any) {
  const consent = store.contact_consent;
  const canSubmit =
    consent === false ||
    (consent === true && !!store.contact_phone && store.contact_phone.replace(/\D/g, "").length >= 8);

  return (
    <>
      <h2 className="text-[20px] font-semibold leading-tight mb-4">{t("s4.q11.text")}</h2>
      <YesNo
        value={consent ?? null}
        onChange={(v) => store.set("contact_consent", v)}
        yesLabel={t("s4.q11.yes")}
        noLabel={t("s4.q11.no")}
      />

      <AnimatePresence>
        {consent === true && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mt-4 pt-4 border-t border-white/8"
          >
            <label className="text-[11px] text-white/55 block mb-1.5">{t("s4.q11.phoneLabel")}</label>
            <TextInput
              type="tel"
              value={store.contact_phone || ""}
              onChange={(v) => store.set("contact_phone", v)}
              placeholder={t("s4.q11.phonePlaceholder")}
            />
            <label className="text-[11px] text-white/55 block mt-3 mb-1.5">{t("s4.q11.emailLabel")}</label>
            <TextInput
              type="email"
              value={store.contact_email || ""}
              onChange={(v) => store.set("contact_email", v)}
              placeholder={t("s4.q11.emailPlaceholder")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-4 text-[12px] text-error bg-error/10 border border-error/20 rounded-xl p-3">
          {error}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className={`mt-5 w-full py-3.5 rounded-full font-semibold text-sm ${
          canSubmit && !submitting ? "bg-accent-gradient" : "bg-white/20 text-white/50 cursor-not-allowed"
        }`}
      >
        {submitting ? t("nav.submitting") : t("nav.submit")}
      </button>
    </>
  );
}
```

- [ ] **Step 2: Create route**

Create `app/[locale]/s4/[qId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { S4Wizard } from "@/components/screens/S4Wizard";

export default async function S4Page({ params }: { params: Promise<{ locale: string; qId: string }> }) {
  const { qId } = await params;
  const n = parseInt(qId, 10);
  if (![9, 10, 11].includes(n)) notFound();
  return <S4Wizard qId={n as 9 | 10 | 11} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: section 4 wizard with q9, q10, q11 conditional contact"
```

---

### Task 18: Thanks screen

**Files:**
- Create: `app/[locale]/thanks/page.tsx`
- Create: `components/screens/Thanks.tsx`

- [ ] **Step 1: Create Thanks component**

Create `components/screens/Thanks.tsx`:

```tsx
"use client";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/chrome/Container";
import { LangSelector } from "@/components/chrome/LangSelector";
import { clearDraft } from "@/lib/draft";
import { useFormStore } from "@/lib/store";

export function Thanks() {
  const t = useTranslations("thanks");
  const locale = useLocale();
  const reset = useFormStore((s) => s.reset);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clearDraft();
    reset();
  }, [reset]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/${locale}` : "";
  const shareText = locale === "es"
    ? `Ayudame con esta encuesta para creadores (3 min): ${shareUrl}`
    : `Help with this creator survey (3 min): ${shareUrl}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <LangSelector />
      <Container variant="wizard">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-5xl text-center my-4">🎉</div>
          <h1 className="text-[26px] font-bold text-center mb-3">{t("title")}</h1>
          <p className="text-[14px] text-white/75 text-center leading-relaxed mb-4">{t("body")}</p>
          <div
            className="rounded-xl px-3.5 py-3 text-[13px] leading-snug mb-4"
            style={{ background: "rgba(255,200,100,0.05)", border: "1px solid rgba(255,200,100,0.25)" }}
          >
            {t("gift")}
          </div>
          <p className="text-[13px] text-white/65 text-center mb-4">{t("closingLine")}</p>

          <div className="border-t border-white/8 pt-4">
            <p className="text-[12px] text-white/60 text-center mb-3">{t("shareTitle")}</p>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-whatsapp-green text-white font-semibold text-[13px]"
            >
              {t("shareWhatsapp")}
            </a>
            <button
              onClick={copyLink}
              className="mt-2 flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-white/6 border border-white/15 text-[13px]"
            >
              {copied ? t("shareCopied") : t("shareCopy")}
            </button>
          </div>
        </motion.div>
      </Container>
    </>
  );
}
```

- [ ] **Step 2: Create route**

Create `app/[locale]/thanks/page.tsx`:

```tsx
import { Thanks } from "@/components/screens/Thanks";
export default function ThanksPage() { return <Thanks />; }
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: thank you screen with whatsapp share and copy link"
```

---

## Phase 5 — Server & submission

### Task 19: Google Sheets client

**Files:**
- Create: `lib/sheets.ts`

- [ ] **Step 1: Create Sheets client**

Create `lib/sheets.ts`:

```ts
import "server-only";
import { google } from "googleapis";
import type { Submission } from "./schema";
import { SERVICES } from "./services";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY!, "base64")
    .toString("utf-8")
    .replace(/\\n/g, "\n");
  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function submissionToRow(s: Submission, meta: { submissionId: string; timestamp: string; userAgent: string; referrer: string | null }): (string | number)[] {
  const svcMap = new Map(s.services.map((sv) => [sv.serviceId, sv]));
  const svcCols: (string | number)[] = [];
  for (const svc of SERVICES) {
    const ans = svcMap.get(svc.id);
    svcCols.push(ans?.interest ?? "");
    svcCols.push(ans?.priceMonthly ?? "");
    if (svc.hasSetupFee) svcCols.push(ans?.priceSetup ?? "");
  }
  return [
    meta.timestamp,
    meta.submissionId,
    s.locale,
    s.name,
    s.handle,
    s.platforms.join(","),
    s.platforms_other ?? "",
    s.follower_range,
    s.hours_non_content,
    s.does_currently.join(","),
    ...svcCols,
    s.bundle_starter_price ?? "",
    s.bundle_growth_price ?? "",
    s.bundle_pro_price ?? "",
    s.bundle_preference,
    s.budget_range,
    s.budget_custom ?? "",
    s.one_wish,
    s.contact_consent ? "yes" : "no",
    s.contact_phone ?? "",
    s.contact_email ?? "",
    meta.userAgent,
    meta.referrer ?? "",
  ];
}

export async function appendSubmission(
  s: Submission,
  meta: { submissionId: string; timestamp: string; userAgent: string; referrer: string | null }
): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const row = submissionToRow(s, meta);
  const tabName = s.is_test ? "Responses-TEST" : "Responses";
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: google sheets client for appending submissions"
```

---

### Task 20: Rate limiter

**Files:**
- Create: `lib/rate-limit.ts`
- Create: `lib/rate-limit.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/rate-limit.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, __resetRateLimit } from "./rate-limit";

describe("rate limit", () => {
  beforeEach(() => { __resetRateLimit(); vi.useFakeTimers(); });

  it("allows under the limit", () => {
    expect(checkRateLimit("1.1.1.1")).toBe(true);
    expect(checkRateLimit("1.1.1.1")).toBe(true);
    expect(checkRateLimit("1.1.1.1")).toBe(true);
  });

  it("blocks over the limit", () => {
    checkRateLimit("1.1.1.1");
    checkRateLimit("1.1.1.1");
    checkRateLimit("1.1.1.1");
    expect(checkRateLimit("1.1.1.1")).toBe(false);
  });

  it("resets after window", () => {
    checkRateLimit("1.1.1.1");
    checkRateLimit("1.1.1.1");
    checkRateLimit("1.1.1.1");
    vi.advanceTimersByTime(61 * 60 * 1000);
    expect(checkRateLimit("1.1.1.1")).toBe(true);
  });

  it("tracks different IPs separately", () => {
    checkRateLimit("1.1.1.1");
    checkRateLimit("1.1.1.1");
    checkRateLimit("1.1.1.1");
    expect(checkRateLimit("1.1.1.1")).toBe(false);
    expect(checkRateLimit("2.2.2.2")).toBe(true);
  });
});
```

- [ ] **Step 2: Implement rate limiter**

Create `lib/rate-limit.ts`:

```ts
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;

const hits = new Map<string, number[]>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const list = (hits.get(ip) || []).filter((t) => t > cutoff);
  if (list.length >= MAX_PER_WINDOW) {
    hits.set(ip, list);
    return false;
  }
  list.push(now);
  hits.set(ip, list);
  return true;
}

export function __resetRateLimit(): void { hits.clear(); }
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all 4 rate limit tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: in-memory rate limiter with 3-per-hour per-ip"
```

---

### Task 21: Resend email client

**Files:**
- Create: `lib/email.ts`

- [ ] **Step 1: Create email client**

Create `lib/email.ts`:

```ts
import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendWelcomeEmail({
  to, name, locale,
}: { to: string; name: string; locale: "es" | "en" }): Promise<void> {
  const subject = locale === "es"
    ? "¡Gracias por participar! 🎁"
    : "Thanks for your input! 🎁";
  const body = locale === "es"
    ? `Hola ${name},\n\nGracias por tomarte 3 minutos para ayudarnos a construir mejores servicios para creadores.\n\nYa estás en la lista de early access. Vas a ser de los primeros en probar estos servicios gratis o con descuento cuando lancemos.\n\nSeguí creando — nosotros nos ocupamos del resto.\n\n— El equipo de La Neta`
    : `Hi ${name},\n\nThanks for taking 3 minutes to help us build better tools for creators.\n\nYou're now on the early access list. You'll be among the first to try these services free or at a discount when we launch.\n\nKeep creating — we'll handle the rest.\n\n— The La Neta team`;
  await resend.emails.send({
    from: "La Neta <hola@laneta.com>",
    to,
    subject,
    text: body,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: resend email client for welcome email"
```

---

### Task 22: API route for submit

**Files:**
- Create: `app/api/submit/route.ts`

- [ ] **Step 1: Create API route**

Create `app/api/submit/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { SubmissionSchema } from "@/lib/schema";
import { appendSubmission } from "@/lib/sheets";
import { sendWelcomeEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: silently accept with 200 but do nothing
  if (typeof body === "object" && body !== null && "hp_website" in body && (body as { hp_website: unknown }).hp_website) {
    return NextResponse.json({ ok: true });
  }

  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", details: parsed.error.issues }, { status: 400 });
  }
  const submission = parsed.data;

  const meta = {
    submissionId: uuidv4(),
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get("user-agent") || "",
    referrer: req.headers.get("referer"),
  };

  try {
    await appendSubmission(submission, meta);
  } catch (err) {
    console.error("Sheets append failed", err);
    return NextResponse.json({ error: "storage_failed" }, { status: 500 });
  }

  // Send email non-blocking (don't fail submit if email fails)
  if (submission.contact_consent && submission.contact_email) {
    try {
      await sendWelcomeEmail({
        to: submission.contact_email,
        name: submission.name,
        locale: submission.locale,
      });
    } catch (err) {
      console.error("Email failed (non-fatal)", err);
    }
  }

  return NextResponse.json({ ok: true, id: meta.submissionId });
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: api route with validation, rate limit, honeypot, sheets append, email"
```

---

## Phase 6 — Polish

### Task 23: Autosave toast + draft auto-save hook

**Files:**
- Create: `components/chrome/SaveToast.tsx`
- Create: `lib/useAutosave.ts`
- Modify: `app/[locale]/layout.tsx` (add SaveToast listener globally)

- [ ] **Step 1: Create SaveToast**

Create `components/chrome/SaveToast.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function SaveToast() {
  const t = useTranslations("save");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onSaved = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), 1000);
    };
    window.addEventListener("laneta:draft-saved", onSaved);
    return () => window.removeEventListener("laneta:draft-saved", onSaved);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-5 left-5 text-[11px] text-success bg-success/10 border border-success/20 rounded-full px-2.5 py-1"
        >
          {t("saved")}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Create useAutosave hook**

Create `lib/useAutosave.ts`:

```ts
"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useFormStore } from "./store";
import { saveDraft } from "./draft";

export function useAutosave() {
  const pathname = usePathname();
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = useFormStore.subscribe((state) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const { set, setService, reset, hydrate, ...answers } = state;
        saveDraft({ answers: answers as Record<string, unknown>, route: pathname });
        window.dispatchEvent(new Event("laneta:draft-saved"));
      }, 500);
    });
    return () => { unsub(); if (timer.current) clearTimeout(timer.current); };
  }, [pathname]);
}
```

- [ ] **Step 3: Wire into layout**

Add to `app/[locale]/layout.tsx` — import and render SaveToast, and add an `AutosaveProvider`:

Create `components/chrome/AutosaveProvider.tsx`:

```tsx
"use client";
import { useAutosave } from "@/lib/useAutosave";
export function AutosaveProvider({ children }: { children: React.ReactNode }) {
  useAutosave();
  return <>{children}</>;
}
```

Update `app/[locale]/layout.tsx` children section:

```tsx
<NextIntlClientProvider messages={messages} locale={locale}>
  <AutosaveProvider>
    <SaveToast />
    {children}
  </AutosaveProvider>
</NextIntlClientProvider>
```

Add the imports at top of `layout.tsx`:
```tsx
import { AutosaveProvider } from "@/components/chrome/AutosaveProvider";
import { SaveToast } from "@/components/chrome/SaveToast";
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: autosave draft with save toast"
```

---

### Task 24: Privacy page

**Files:**
- Create: `app/[locale]/privacy/page.tsx`

- [ ] **Step 1: Create privacy page**

Create `app/[locale]/privacy/page.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/chrome/Container";
import { LangSelector } from "@/components/chrome/LangSelector";

export default function PrivacyPage() {
  const t = useTranslations("privacy");
  const body = t("body");
  return (
    <>
      <LangSelector />
      <Container variant="scroll">
        <h1 className="text-[24px] font-bold mb-6">{t("title")}</h1>
        <div className="text-[14px] text-white/75 leading-relaxed whitespace-pre-wrap prose-invert">
          {body}
        </div>
      </Container>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: privacy page"
```

---

### Task 25: OG image + favicon

**Files:**
- Create: `app/opengraph-image.tsx`
- Create: `app/icon.svg`

- [ ] **Step 1: Create dynamic OG image**

Create `app/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "La Neta — Queremos escucharte";

export default function OGImage() {
  return new ImageResponse(
    (
      <div style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#0A0A0F",
        padding: "80px",
        justifyContent: "space-between",
        fontFamily: "system-ui",
      }}>
        <div style={{ fontSize: 20, letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)" }}>LA NETA</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #FFFFFF 0%, #A78BFA 70%, #EC4899 100%)",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: 1.05,
          }}>Queremos escucharte</div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", maxWidth: 800, lineHeight: 1.35 }}>
            3 min. Ayudanos a diseñar nuevos servicios para creadores y sé de los primeros en probarlos gratis.
          </div>
        </div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }}>🎁 Early access garantizado</div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: Create favicon**

Create `app/icon.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A78BFA"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <text x="32" y="42" font-family="Inter, sans-serif" font-weight="700" font-size="28" text-anchor="middle" fill="white">LN</text>
</svg>
```

- [ ] **Step 3: Add OG meta to layout**

Update metadata in `app/[locale]/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "La Neta — Queremos escucharte",
  description: "3 minutos. Ayudanos a diseñar nuevos servicios para creadores.",
  openGraph: {
    title: "La Neta — Queremos escucharte",
    description: "3 minutos. Ayudanos a diseñar nuevos servicios para creadores.",
    images: ["/opengraph-image"],
    locale: "es_MX",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: og image, favicon, meta tags for social preview"
```

---

### Task 26: PostHog analytics

**Files:**
- Create: `lib/posthog.ts`
- Create: `components/chrome/PostHogProvider.tsx`
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: Create PostHog init**

Create `lib/posthog.ts`:

```ts
"use client";
import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key) return;
  posthog.init(key, {
    api_host: host || "https://us.i.posthog.com",
    persistence: "memory",
    disable_session_recording: true,
    capture_pageview: false,
    disable_cookie: true,
  });
  initialized = true;
}

export function track(event: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture(event, props);
}
```

- [ ] **Step 2: Create provider**

Create `components/chrome/PostHogProvider.tsx`:

```tsx
"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initPostHog, track } from "@/lib/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => { initPostHog(); }, []);
  useEffect(() => {
    if (pathname.match(/\/s1\/1$/)) track("survey_started", { locale: pathname.split("/")[1] });
    const sectionMatch = pathname.match(/\/s(\d)/);
    if (sectionMatch) track("section_entered", { section: parseInt(sectionMatch[1], 10) });
  }, [pathname]);
  return <>{children}</>;
}
```

- [ ] **Step 3: Wire into layout**

Update `app/[locale]/layout.tsx` to wrap with PostHogProvider:

```tsx
<NextIntlClientProvider messages={messages} locale={locale}>
  <PostHogProvider>
    <AutosaveProvider>
      <SaveToast />
      {children}
    </AutosaveProvider>
  </PostHogProvider>
</NextIntlClientProvider>
```

Add import:
```tsx
import { PostHogProvider } from "@/components/chrome/PostHogProvider";
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: posthog analytics with section entry events"
```

---

### Task 27: Test mode flag

**Files:**
- Modify: `components/screens/Welcome.tsx` — capture `?test=1`

- [ ] **Step 1: Update Welcome to capture test flag**

In `components/screens/Welcome.tsx`, add at top of `Welcome()`:

```tsx
const searchParams = useSearchParams();
const setField = useFormStore((s) => s.set);

useEffect(() => {
  if (searchParams.get("test") === "1") {
    setField("is_test", true);
  }
}, [searchParams, setField]);
```

Add imports:
```tsx
import { useSearchParams } from "next/navigation";
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Visit `/es?test=1`, complete the form. In the request body, `is_test` should be `true` — Sheets will route to "Responses-TEST" tab.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: test mode via ?test=1 query param"
```

---

## Phase 7 — Testing & deploy

### Task 28: Playwright smoke test

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/happy-path.spec.ts`

- [ ] **Step 1: Create Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: { baseURL: "http://localhost:3000" },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

Add to `package.json` scripts:
```json
"e2e": "playwright test"
```

- [ ] **Step 2: Install Playwright browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 3: Write smoke test**

Create `e2e/happy-path.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("happy path: welcome to thanks (mobile)", async ({ page }) => {
  await page.goto("/es?test=1");
  await expect(page.getByText("Queremos escucharte")).toBeVisible();
  await page.getByRole("button", { name: /Empecemos/ }).click();

  // Q1: name
  await page.getByPlaceholder("Tu nombre").fill("Test User");
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Q2: handle
  await page.getByPlaceholder("@tuhandle").fill("testhandle");
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Q3: platforms
  await page.getByText("YouTube").click();
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Q4 auto-advance
  await page.getByText("10,000 – 50,000").click();

  // Q5 auto-advance
  await page.getByText("2-5 horas").click();

  // Q6
  await page.getByText("Corto clips/shorts").click();
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // S2 skip all to none_interested
  for (let i = 0; i < 13; i++) {
    await page.getByText("No").nth(i).click();
  }
  await page.getByRole("button", { name: /Continuar a bundles/ }).click();

  // S3: pick preference
  await page.getByText("Bundle — un precio").click();
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Q9
  await page.getByText("$100-200/mes").click();
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Q10
  await page.getByPlaceholder(/Contame/).fill("Necesito ayuda con thumbnails.");
  await page.getByRole("button", { name: /Siguiente/ }).click();

  // Q11: no
  await page.getByRole("button", { name: "No" }).click();
  await page.getByRole("button", { name: /Enviar/ }).click();

  // Thanks
  await expect(page.getByText("¡Gracias!")).toBeVisible({ timeout: 10000 });
});
```

- [ ] **Step 4: Note about env vars**

The test will fail at submit unless Google Sheets env vars are set. For CI, set test mode to use mock/stub. For local run, ensure `.env.local` has all vars. Or adjust the test to mock `/api/submit` if running without env.

Quick adjustment: add to top of test:

```ts
test.beforeEach(async ({ page }) => {
  await page.route("**/api/submit", (route) => route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }));
});
```

- [ ] **Step 5: Run test**

```bash
npm run e2e
```

Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: playwright happy path e2e on mobile viewport"
```

---

### Task 29: Environment variables template

**Files:**
- Create: `.env.example`
- Create: `README.md` (if not exists; otherwise skip)

- [ ] **Step 1: Create .env.example**

Create `.env.example`:

```
# Google Sheets (service account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-bot@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=base64-encoded-private-key
GOOGLE_SHEET_ID=your-sheet-id

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

- [ ] **Step 2: Update .gitignore**

Ensure `.env.local` is in `.gitignore` (create if missing):

Append these lines to `.gitignore`:
```
.env.local
.env*.local
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: env template and gitignore for secrets"
```

---

### Task 30: Google Sheet header setup + deploy notes

**Files:**
- Create: `docs/setup.md`

- [ ] **Step 1: Create setup doc**

Create `docs/setup.md`:

```markdown
# Setup guide

## Google Sheets

1. Create a new Google Sheet
2. Add two tabs: `Responses` and `Responses-TEST`
3. Paste this header row in both tabs (row 1):

```
timestamp	submission_id	locale	name	handle	platforms	platforms_other	follower_range	hours_non_content	does_currently	svc_short_clips_interest	svc_short_clips_price_monthly	svc_thumbnail_design_interest	svc_thumbnail_design_price_monthly	svc_ai_dubbing_interest	svc_ai_dubbing_price_monthly	svc_content_seo_interest	svc_content_seo_price_monthly	svc_performance_dashboard_interest	svc_performance_dashboard_price_monthly	svc_media_kit_interest	svc_media_kit_price_monthly	svc_ai_coach_interest	svc_ai_coach_price_monthly	svc_we_post_for_you_interest	svc_we_post_for_you_price_monthly	svc_paid_community_interest	svc_paid_community_price_monthly	svc_newsletter_interest	svc_newsletter_price_monthly	svc_online_course_interest	svc_online_course_price_monthly	svc_online_course_price_setup	svc_podcast_interest	svc_podcast_price_monthly	svc_merch_store_interest	svc_merch_store_price_monthly	svc_merch_store_price_setup	bundle_starter_price	bundle_growth_price	bundle_pro_price	bundle_preference	budget_range	budget_custom	one_wish	contact_consent	contact_phone	contact_email	user_agent	referrer
```

4. Create a Google Cloud service account:
   - Go to https://console.cloud.google.com
   - Create a project, enable Google Sheets API
   - Create a service account, download JSON key
   - Share your sheet with the service account email as Editor
5. Extract from JSON key:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → base64-encode and set as `GOOGLE_PRIVATE_KEY`

## Resend

1. Sign up at https://resend.com
2. Verify domain `laneta.com` (add DNS DKIM/SPF records Resend provides)
3. Copy API key → `RESEND_API_KEY`

## PostHog

1. Sign up at https://posthog.com
2. Create project
3. Copy "Project API Key" → `NEXT_PUBLIC_POSTHOG_KEY`
4. Copy "Host" → `NEXT_PUBLIC_POSTHOG_HOST`

## Vercel

1. Import this repo to Vercel
2. Add all env vars from above
3. Deploy

## Manual browser testing checklist (before launch)

- [ ] iOS Safari 17+: full flow works, autofocus behaves, autosave fires
- [ ] Android Chrome: same
- [ ] WhatsApp in-app browser: open link → flow works
- [ ] Instagram in-app browser: open link → flow works
- [ ] OG preview: paste link in WhatsApp, confirm image + title render
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "docs: setup guide for sheets, resend, posthog, vercel"
```

---

## Self-review notes

Completed spec coverage check:

- ✅ All 4 sections + welcome + thanks implemented
- ✅ i18n with [locale] routing (ES full, EN stub)
- ✅ Progressive service card (Task 14)
- ✅ Bundle cards with PRO accent (Task 16)
- ✅ Q11 conditional reveal (Task 17)
- ✅ Autosave + resume banner (Tasks 12, 23)
- ✅ Schema validation (Task 4)
- ✅ Rate limit + honeypot (Tasks 20, 22)
- ✅ Sheets append with test tab support (Task 19)
- ✅ Resend email (Task 21)
- ✅ OG + favicon (Task 25)
- ✅ PostHog (Task 26)
- ✅ Privacy page (Task 24)
- ✅ Test mode (Task 27)
- ✅ E2E smoke test (Task 28)
- ✅ Setup docs (Task 30)

Type consistency: `ServiceAnswer` used consistently. `SubmissionSchema` fields match `lib/sheets.ts` row mapping.

Remaining manual steps before launch (documented in `docs/setup.md`):
- Logo integration (replace `icon.svg` when logo arrives)
- Confirm `hola@laneta.com` and `privacy@laneta.com` addresses exist
- Complete English translations in `messages/en.json` (v1.1)
