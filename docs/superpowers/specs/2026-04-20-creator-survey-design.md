# La Neta — Formulario de Encuesta para Creadores (Spec de Diseño)

**Fecha:** 2026-04-20
**Versión:** 1.0
**Documento fuente:** `La_Neta_Creator_Survey_v3.1_Final.md`
**Directorio de trabajo:** `C:\crm\formulario`
**Versión en inglés (referencia):** `2026-04-20-creator-survey-design-en.md`

## Propósito

Construir un formulario web custom para la Creator Services Survey v3.1. Reemplaza Google Forms / Typeform con una experiencia pulida, mobile-first, diseñada para creadores de contenido jóvenes. Objetivo: 500+ respuestas en 2 semanas vía distribución por WhatsApp (90% tráfico móvil).

## Objetivos

- Tasa de completación ≥ 70% (target del doc fuente: 70–85%)
- Táctil-friendly en pantallas chicas (superficie principal: navegador abierto desde WhatsApp)
- Se siente "actual" — estéticamente alineado con apps que usan creadores jóvenes a diario (TikTok, Spotify, Discord)
- Datos capturados en Google Sheets para acceso fácil del equipo no técnico (Ana / operaciones)
- Incentivo y social proof visibles antes de cualquier pregunta
- Resume-able: si cerrás el browser a mitad, al volver podés continuar donde quedaste

## No-objetivos

- Sin auth / cuentas. Cada respondiente es anónimo salvo que opte-in en Q11.
- Sin dashboard de analytics dentro de la app. PostHog cubre eso externamente.
- Sin UI de admin. Cambios de schema = editar archivo de config + redeploy.
- Sin referral attribution (UTM / codes) en v1. Decisión explícita.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **React Hook Form** + **Zod** para validación (esquema compartido client/server)
- **Framer Motion** para transiciones (page-to-page, reveals condicionales, progress bar)
- **next-intl** para i18n
- **googleapis** (Google Sheets API v4) vía Service Account para escrituras
- **Resend** para email de confirmación post-submit
- **PostHog** para analytics + funnel de drop-off
- **Vercel** para hosting
- Storage principal: **Google Sheets** (una spreadsheet, tab "Responses" para producción, tab "Responses-TEST" para modo test)

## Arquitectura

```
[Browser: Next.js client]
  ↓ estado del form (React Hook Form + autosave a localStorage, debounce 500ms)
  ↓ eventos de PostHog (pageview por sección, selección de interés, abandono)
  ↓ POST /api/submit en el paso final
[Next.js Server Action / API Route]
  ↓ valida honeypot + rate limit (max 3/IP/hora)
  ↓ valida schema (Zod, server-side)
  ↓ escribe fila vía googleapis (service account)
  ↓ si consent=yes → dispara email de bienvenida (Resend)
[Google Sheets]  [Resend]  [PostHog cloud]
```

### Por qué Server Action en lugar de client → Sheets directo

- Credenciales del service account quedan server-side (nunca expuestas al browser)
- Único punto de validación confiable
- Podemos agregar rate limiting, honeypot, spam checks sin cambiar el cliente

### Límites del flujo de datos

- **Cliente:** navegación, estado in-progress, autosave del draft en `localStorage` bajo la key `laneta-survey-draft-v1` (se limpia al submit exitoso).
- **Servidor:** validación + escritura en Sheets + envío de email. Retorna `{ ok: true }` o errores detallados.
- **Sheets:** fuente de verdad. La app no lee de vuelta — escritura one-way.

## Modelo de navegación (híbrido)

Patrón elegido: **wizard + scroll combinados**. Cada sección usa el patrón que le calza.

| Sección | Forma del contenido | Patrón |
|---|---|---|
| Welcome | Mensaje + CTA | Pantalla única, sin form |
| S1 — Sobre vos | 6 preguntas cortas | Wizard (una pregunta por pantalla) |
| S2 — Servicios | Matriz (13 servicios × 2 preguntas) | Lista scrolleable de tarjetas progresivas |
| S3 — Bundles | Comparación + 3 precios + preferencia | Pantalla única con scroll |
| S4 — Final | 3 preguntas + contacto condicional | Wizard (una pregunta por pantalla) |
| Thank you | Confirmación + share | Pantalla única |

### URLs y ruteo (con i18n)

Todas las rutas tienen prefijo de idioma `[locale]`:

- `/` → detecta `Accept-Language`, redirige a `/es` o `/en`
- `/[locale]` → Welcome
- `/[locale]/s1/[qId]` → S1 wizard, `qId` en `[1..6]`
- `/[locale]/s2` → S2 scroll
- `/[locale]/s3` → S3 scroll
- `/[locale]/s4/[qId]` → S4 wizard, `qId` en `[9, 10, 11]` (Q11b/c son reveal condicional dentro de Q11, no ruta aparte)
- `/[locale]/thanks` → Thank you
- `/[locale]/privacy` → Aviso de privacidad

Racional: la ruta muestra el idioma (URLs compartibles saben qué idioma servir), back button del browser funciona natural, soporte para compartir a mitad del flow.

### Indicador de progreso

Barra superior persistente visible en todas las pantallas excepto welcome/thanks/privacy. Muestra:
- Progreso (fill con `accent-gradient`)
- "Sección X de 4 · ~Y min"

Pesos del progreso: S1=20%, S2=40%, S3=20%, S4=20%. Dentro de cada sección avanza proporcional a preguntas contestadas.

### Comportamiento teclado y táctil

- Wizard: Enter = avanzar, ArrowLeft = atrás, teclas 1-6 = seleccionar opción
- Auto-avance 200ms después de seleccionar en preguntas de single-select en wizard
- Todos los tap targets ≥ 48px de alto
- En S2 no hay auto-avance — el creador puede revisar y cambiar libremente

## Sección 2 — tarjeta de servicio (divulgación progresiva)

Pieza UX crítica. Cada uno de los 13 servicios es una tarjeta en lista scroll vertical.

### Estados de la tarjeta

1. **Inicial** — compacto: número (`01 / 13`), nombre, descripción de una línea, 3 botones de interés (`🔥 Sí`, `Tal vez`, `No`). Precio oculto.
2. **Interesado** (Sí o Tal vez tocado) — expande hacia abajo con spring (~250ms): fila de precios (3 presets + "Otro monto"). La selección de precio es opcional.
3. **No interesado** (No tocado) — colapsa a estado atenuado de una línea con badge "No me interesa". Tocar de nuevo re-expande.

### Data model por servicio

```ts
{
  serviceId: string
  interest: "very" | "somewhat" | "none" | null
  priceMonthly: number | null
  priceSetup: number | null   // solo servicios 11 (curso) y 13 (merch)
  priceIsCustom: boolean
}
```

### Lista de servicios (13 ítems)

Cada uno tiene: `id`, `name` (clave i18n), `description` (clave i18n), `prices: [low, mid, high]`, `hasSetupFee: boolean`. Configuración centralizada en `lib/services.ts`. **Los textos de nombre/descripción se mantienen idénticos al doc fuente `La_Neta_Creator_Survey_v3.1_Final.md`** — solo las claves en `messages/es.json` y `messages/en.json` cambian.

### Comportamiento de scroll

- Sin scroll-snap (se siente janky con expansiones). Scroll natural.
- Botón flotante "Continuar a bundles →" se fija al fondo al pasar el 50% de la lista.

## Sección 3 — pantalla de bundles

### Presentación de la comparación

Mobile-first: la tabla del doc fuente se reformatea como **tres tarjetas apiladas**, no tabla. Cada tarjeta muestra:
- Tag (STARTER / GROWTH / PRO)
- Nombre del bundle
- Inclusiones
- "Si lo compraras suelto: ~$X" (precio tachado)
- "Ahorrás 25-40%" (badge verde)
- 3 opciones de precio + "Otro monto" + "No me interesa este bundle"

**Bundle PRO** tiene borde y background violeta tenue — señala "más completo" sin empujar compra.

### Q8 (bundle vs individual)

Debajo de las 3 tarjetas, como lista single-select apilada (no pantalla separada).

## Sección 4 — flujo condicional

Q11 se renderiza como dos targets grandes (Sí / No):
- **Sí** → la tarjeta expande inline con slide-down para revelar teléfono (requerido, formato WhatsApp) + email (opcional) + botón de submit
- **No** → botón "Enviar" se habilita inmediatamente

Submit único sin importar el camino.

## Estilo visual — Dark Creator

### Paleta

| Token | Valor | Uso |
|---|---|---|
| `bg-base` | `#0A0A0F` | Fondo de página |
| `bg-raised` | `rgba(255,255,255,0.02)` | Tarjetas, inputs |
| `bg-raised-selected` | `rgba(255,255,255,0.06)` | Estado seleccionado |
| `border-subtle` | `rgba(255,255,255,0.08)` | Bordes de tarjetas |
| `border-strong` | `rgba(255,255,255,0.25)` | Borde de tarjeta seleccionada |
| `text-primary` | `#FFFFFF` | Títulos, texto principal |
| `text-secondary` | `rgba(255,255,255,0.70)` | Body |
| `text-tertiary` | `rgba(255,255,255,0.45)` | Labels, metadata |
| `accent-gradient` | `linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)` | CTAs, pills seleccionadas, progress fill |
| `accent-violet` | `#A78BFA` | Acento del bundle PRO |
| `success` | `#9FE899` | Badges "Ahorrás X%" + toast "Guardado" |
| `whatsapp-green` | `#25D366` | Botón de share (solo ese uso) |
| `error` | `#F87171` | Errores de validación y campos requeridos |

### Tipografía

- **Fuente:** Inter (variable, vía `next/font`) como única familia. Pesos: 400 (body), 500 (subtítulo), 600 (h2/h3), 700 (h1).
- **H1 (welcome/títulos de sección):** 30px, weight 700, letter-spacing -0.02em, con efecto gradient text (accent-gradient)
- **H2 (texto de pregunta en wizard):** 20-22px, weight 500-600, line-height 1.3
- **Body:** 14px, line-height 1.55
- **Labels:** 11px uppercase, letter-spacing 0.08em

### Principios de movimiento (Emil Kowalski-style)

- **Transiciones de página** (wizard→wizard): fade + slide horizontal 20px, 300ms, easing `[0.32, 0.72, 0, 1]`
- **Reveals condicionales** (expansión de tarjeta S2, contacto en Q11): spring, height animate, 250ms
- **Feedback de selección:** scale 1 → 0.98 al tap, spring back
- **Progress bar:** width transition 400ms con easing custom
- **Todos los elementos interactivos** tienen `:focus-visible` con accent-gradient
- **Respeta `prefers-reduced-motion`** — fallback a transiciones instantáneas sin animación de altura

### Lenguaje de formas

- Tarjetas: `border-radius: 14px`
- Pills / opciones: `border-radius: 10-12px`
- CTAs primarios (wizard): `border-radius: 999px` (fully rounded)
- CTAs secundarios (bundles): `border-radius: 12px`
- Sin shadows duras. Border sutil 1px como separador.

### Layout responsive (mobile-first con canvas centrado en desktop)

Una sola versión responsive — no dos diseños.

- **Móvil (< 768px):** containers full-width con padding 16px
- **Desktop (≥ 768px):** containers centrados horizontalmente, con breathing room
  - Wizard (S1, S4, welcome, thanks): `max-width: 440px`
  - Scroll (S2, S3): `max-width: 560px`
  - Padding exterior: 32px
  - Background: gradient radial violeta sutil arriba + grid punteado de 24px tenue. Se oculta en móvil.
- **Progress bar:** width del container, no de la viewport.
- **Selector de idioma** (🌐 ES · EN): esquina superior derecha del container, siempre visible cuando `[locale]` está presente.

## Schema de datos

Un solo Zod schema, fuente compartida entre cliente y servidor. Nombres en snake_case para matchear el header row de Google Sheets.

### Columnas

| Columna | Tipo | Fuente | Requerida |
|---|---|---|---|
| `timestamp` | ISO string (UTC) | server-generated | sí |
| `submission_id` | UUID v4 | server-generated | sí |
| `locale` | `es` \| `en` | client | sí |
| `name` | string | Q1 | sí |
| `handle` | string | Q2 | sí |
| `platforms` | string (comma-joined) | Q3 | sí |
| `platforms_other` | string | Q3 "other" text | no |
| `follower_range` | enum | Q4 | sí |
| `hours_non_content` | enum | Q5 | sí |
| `does_currently` | string (comma-joined) | Q6 | sí |
| `svc_01_short_clips_interest` | enum(`very`/`somewhat`/`none`) | S2 | sí |
| `svc_01_short_clips_price_monthly` | number \| null | S2 | condicional |
| `svc_01_short_clips_price_setup` | number \| null | S2 | solo servicios con setup fee |
| ... (13 servicios × 2–3 columnas) ... | | | |
| `bundle_starter_price` | number \| null | Q7 | no |
| `bundle_growth_price` | number \| null | Q7 | no |
| `bundle_pro_price` | number \| null | Q7 | no |
| `bundle_preference` | enum | Q8 | sí |
| `budget_range` | enum(`lt_50`/`50_100`/`100_200`/`200_400`/`400_plus`/`custom`) | Q9 | sí |
| `budget_custom` | number \| null | Q9 | requerido si `budget_range=custom` |
| `one_wish` | string | Q10 | sí |
| `contact_consent` | boolean | Q11 | sí |
| `contact_phone` | string | Q11b | condicional |
| `contact_email` | string | Q11c | no |
| `user_agent` | string | server-derived | sí |
| `referrer` | string | server-derived | no |

### Nota sobre precios compuestos (servicios 11 y 13)

La mayoría tiene un precio mensual. Dos servicios combinan setup + mensual:
- **S11 — Curso online:** `$299 setup + $49/mo`, `$499 + $99/mo`, `$999 + $149/mo`
- **S13 — Merch store:** `$199 setup + $49/mo`, `$299 + $79/mo`, `$499 + $149/mo`

Para esos dos, `price_setup` se llena; para los otros 11 siempre es null. El config `services.ts` marca cada servicio con `hasSetupFee: boolean`.

### Reglas de validación

- `name`: min 2, max 100 chars, trimmed
- `handle`: trimmed, `@` inicial se remueve si viene, min 2, max 50
- `platforms`: al menos una seleccionada de las 5 conocidas OR `platforms_other` no vacío
- `platforms_other`: requerido solo si `platforms` incluye `other`
- `does_currently`: array puede estar vacío solo si `none_of_above` está seleccionado (mutuamente excluyentes)
- `svc_*_interest` requerido para los 13
- `svc_*_price_*`: si `interest` es `very` o `somewhat`, precio puede ser null (skip intencional); si `interest=none`, ambos precios deben ser null
- `bundle_*_price`: siempre opcional
- `budget_range`: requerido; si `custom`, `budget_custom` debe ser entero positivo
- `one_wish`: min 3, max 500 chars, trimmed
- `contact_phone`: si `contact_consent=true`, requerido; formato internacional básico (+ opcional, min 8 dígitos)
- `contact_email`: si presente, email válido; nunca requerido

## i18n — next-intl

### Setup

- Librería: `next-intl`
- Locales: `es` (default) y `en`
- Detección: middleware lee `Accept-Language` y redirige `/` → `/[locale]`
- Archivos: `messages/es.json`, `messages/en.json`
- **Textos ES:** copiados textualmente del doc fuente `La_Neta_Creator_Survey_v3.1_Final.md`
- **Textos EN:** ya vienen del mismo doc (las 13 descripciones de servicios están en inglés en el doc; los welcome/section titles necesitan traducción — usar la misma copia adaptada del doc)

### v1 alcance

v1 se lanza solo en español. La estructura de i18n queda conectada para que agregar inglés sea solo traducir los `messages/en.json`. El botón 🌐 ES · EN está visible pero al hacer click en EN muestra "Pronto" si el archivo está vacío.

## Autosave y reanudación (draft)

### Comportamiento

1. Cada cambio de campo dispara save con debounce 500ms a `localStorage` bajo key `laneta-survey-draft-v1`
2. Draft incluye: todas las respuestas + ruta actual + timestamp + versión del schema
3. Al volver a entrar a `/[locale]`, el middleware lee el draft:
   - Si existe y `now - timestamp < 7 días` → banner en welcome: *"Tenés una encuesta sin terminar · [Empezar de cero] [Continuar →]"*
   - Si expirado o invalid → draft se descarta silenciosamente
4. Tras save exitoso, pequeño toast "✓ Guardado" en esquina superior izquierda por 1 seg
5. Submit exitoso → draft se borra

### Versionado del schema

Key del draft incluye versión (`laneta-survey-draft-v1`). Si cambia el schema de manera incompatible, bump a `v2` — drafts viejos no se intentan cargar.

## OG / WhatsApp preview y favicon

### Meta tags en el layout

```tsx
// app/[locale]/layout.tsx
export const metadata: Metadata = {
  title: "La Neta — Queremos escucharte",
  description: "3 minutos. Ayudanos a diseñar nuevos servicios para creadores y sé de los primeros en probarlos gratis.",
  openGraph: {
    title: "La Neta — Queremos escucharte",
    description: "3 minutos. Ayudanos a diseñar nuevos servicios para creadores.",
    images: ["/opengraph-image"],
    locale: "es_MX",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};
```

### OG image dinámica (Next.js `ImageResponse`)

Archivo: `app/opengraph-image.tsx`. Genera 1200×630 al request (sin imagen estática).

```tsx
import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function OGImage() {
  return new ImageResponse(
    (
      <div style={{ display:"flex", flexDirection:"column", width:"100%", height:"100%", background:"#0A0A0F", padding:"80px", justifyContent:"space-between" }}>
        <div style={{ fontSize:20, letterSpacing:"0.2em", color:"#ffffff80" }}>LA NETA</div>
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
          <div style={{ fontSize:84, fontWeight:700, letterSpacing:"-0.02em", background:"linear-gradient(135deg, #fff, #A78BFA, #EC4899)", backgroundClip:"text", color:"transparent" }}>Queremos escucharte</div>
          <div style={{ fontSize:28, color:"#ffffffB0", maxWidth:800 }}>3 min. Ayudanos a diseñar nuevos servicios para creadores y sé de los primeros en probarlos gratis.</div>
        </div>
        <div style={{ fontSize:18, color:"#ffffff60" }}>🎁 Early access garantizado</div>
      </div>
    ),
    { ...size }
  );
}
```

### Favicon provisorio (hasta que llegue el logo)

Archivo: `app/icon.svg`. Gradient violeta→rosa con "LN" centrado. Reemplazar cuando el logo oficial esté disponible.

```svg
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

Apple touch icon: `app/apple-icon.png` 180×180, misma estética que el SVG pero PNG (generado una vez a mano con el mismo diseño).

## Protección anti-spam

### Honeypot

Campo oculto `hp_website` en el último form step. Si llega con valor no vacío al servidor → rechazar con 200 silencioso (no devolver error explícito, para no darle pistas al bot).

```tsx
<input type="text" name="hp_website" tabIndex={-1} autoComplete="off"
       style={{ position:"absolute", left:"-9999px" }} aria-hidden />
```

### Rate limiting

- Max **3 submits por IP en 1 hora**
- Storage: en-memoria con `Map<ip, [timestamp, ...]>` con cleanup de entradas > 1h. En Vercel Edge + serverless esto significa por instancia; suficiente para MVP.
- Si superan límite: 429 con mensaje "Llegaste al límite de intentos. Probá en 1 hora."

Migración futura: si vemos abuso real, pasar a Upstash Redis (~$0/mes free tier).

## Aviso de privacidad

### Línea en el welcome

Debajo del CTA principal, fuente pequeña (11px, opacity 0.5):

> *Al continuar aceptás nuestro [aviso de privacidad](/es/privacy).*

### Página `/[locale]/privacy`

Página simple sin framework de cookies/consent (no tenemos cookies de tracking — PostHog se configura en modo privacy-friendly, sin cookies por defecto).

Contenido mínimo (en ambos idiomas):

```markdown
# Aviso de Privacidad

**Global Media Review / La Neta** ("nosotros") opera esta encuesta.

## Qué datos recolectamos
- **Siempre:** respuestas a las preguntas, user-agent del navegador.
- **Si consentís (Q11):** tu número de WhatsApp y opcionalmente email.
- **Nunca:** datos bancarios, passwords, tu ubicación GPS.

## Para qué los usamos
- **Todas las respuestas:** diseñar nuevos servicios para creadores y medir interés.
- **Teléfono y email (si lo diste):** contactarte con novedades sobre el lanzamiento de estos servicios y darte early access. No lo compartimos con terceros ni hacemos marketing a servicios que no son de La Neta.

## Cuánto tiempo los guardamos
- 24 meses desde la fecha de envío, o hasta que pidas que los borremos.

## Cómo borrar tus datos
Escribinos a **privacy@laneta.com** con el asunto "Borrar mis datos" desde el email que diste. En 30 días borramos todo lo asociado.

## Seguridad
Tus respuestas se guardan en Google Sheets privadas, accesibles solo por el equipo de La Neta.

---
Última actualización: 20 de abril, 2026
```

En el footer de todas las páginas: link chiquito "Aviso de privacidad".

## Analytics — PostHog

### Setup

- Free tier (1M eventos/mes) — no requiere pagar
- Registro en https://posthog.com, crear proyecto
- Env vars: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (`https://us.i.posthog.com` o eu según región)
- Configuración: disable_cookies, persistence=memory, disable_session_recording (privacy-friendly por default)

### Eventos a trackear

| Evento | Cuándo | Propiedades |
|---|---|---|
| `survey_started` | Al clickear "Empecemos" en welcome | `locale`, `is_resumed` |
| `section_entered` | Al llegar a S1, S2, S3, S4 | `section`, `seconds_since_start` |
| `question_answered` | Cada vez que contesta una pregunta | `qId`, `section` |
| `service_interest_selected` | Al seleccionar interés en S2 | `service_id`, `interest` |
| `bundle_priced` | Al elegir precio para un bundle | `bundle_id`, `price`, `is_custom` |
| `survey_submitted` | POST exitoso | `consent`, `duration_seconds` |
| `survey_abandoned` | Tras 60s de inactividad sin submit | `last_section`, `last_qId` |

Con esto armamos funnel en PostHog: Welcome → S1 → S2 → S3 → S4 → Submit, midiendo drop-off en cada paso.

## Modo test

Flag: `?test=1` en la URL.

- Si presente en el welcome, se propaga por todo el flow (atributo en el form state)
- En el submit, si `test=true`, la API route escribe en la tab **"Responses-TEST"** de la Sheet (en vez de "Responses")
- PostHog events también incluyen `is_test: true` → fácil filtrar en dashboard

El equipo usa esto para probar el form sin contaminar datos reales.

## Email de confirmación — Resend

### Cuándo se envía

Post-submit exitoso, **solo si `contact_consent=true` Y `contact_email` está presente** (email es opcional incluso consintiendo).

### Config

Env var: `RESEND_API_KEY`. Setup:

1. Crear cuenta en https://resend.com (free tier: 3000 emails/mes)
2. Verificar dominio `laneta.com` (agregás DNS records DKIM/SPF)
3. From address: `hola@laneta.com`

### Ejemplo de código

```ts
// lib/email.ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendWelcomeEmail({ to, name, locale }: {
  to: string; name: string; locale: "es" | "en";
}) {
  const subject = locale === "es"
    ? "¡Gracias por participar! 🎁"
    : "Thanks for your input! 🎁";
  const html = renderWelcomeHtml({ name, locale }); // React Email o plantilla simple
  await resend.emails.send({
    from: "La Neta <hola@laneta.com>",
    to, subject, html,
  });
}
```

En el API route, tras append a Sheets, disparamos `sendWelcomeEmail` con `await` dentro de un try/catch — si falla, NO bloqueamos la respuesta al usuario (log del error y seguir). El Sheet es la verdad; el email es bonus.

## Accesibilidad (básica)

Alcance sencillo — sin auditoría WCAG AA completa, pero cubriendo lo esencial:

- HTML semántico: `<main>`, `<nav>`, `<form>`, `<button>`, `<label>` para cada input
- `aria-expanded` en tarjetas de S2 (progresivas)
- `aria-invalid` + `aria-describedby` en inputs con error
- Focus-visible con outline gradient (ya en el sistema)
- Navegación por teclado en el wizard (Enter, ArrowLeft/Right, teclas 1-6)
- Respeta `prefers-reduced-motion`
- Contraste: texto primario blanco sobre `#0A0A0F` = 19:1 (AAA). Texto secundario `rgba(255,255,255,0.70)` = 13:1 (AAA).

## Estados de error y feedback

Premisa: **solo destacar lo que falta o está mal** — no mostrar errores proactivos ni validación prematura.

| Situación | Comportamiento |
|---|---|
| Campo requerido vacío, intenta avanzar | Pregunta no avanza, el input requerido se resalta con borde `error` y mensaje inline abajo: *"Este campo es obligatorio"* |
| Email inválido | Borde `error`, mensaje: *"Email inválido"* — solo al blur, no durante escritura |
| Teléfono inválido en Q11b | Mismo patrón — solo al blur |
| Error de red en submit | Pantalla no cambia. Botón "Enviar" muestra spinner 1s luego mensaje inline: *"No pudimos guardar tu respuesta. Tu progreso está seguro. [Intentar de nuevo]"* |
| Error 500 del servidor | Mismo tratamiento con mensaje diferente: *"Algo falló de nuestro lado. Intentalo en unos segundos."* |
| Rate limit 429 | *"Muchos intentos seguidos. Probá en 1 hora."* |
| Submit en progreso | Botón deshabilitado con spinner + texto "Enviando..." |
| Submit exitoso | Transición a `/[locale]/thanks` con animación fade+slide |

Sin toasts agresivos. Errores inline, cercanos al campo que los dispara.

## Organización del código

```
C:\crm\formulario\
├─ app\
│  ├─ [locale]\
│  │  ├─ layout.tsx                 # layout con font, progress bar, lang selector
│  │  ├─ page.tsx                   # welcome screen
│  │  ├─ s1\[qId]\page.tsx          # S1 wizard
│  │  ├─ s2\page.tsx                # S2 lista de servicios
│  │  ├─ s3\page.tsx                # S3 bundles
│  │  ├─ s4\[qId]\page.tsx          # S4 wizard
│  │  ├─ thanks\page.tsx
│  │  └─ privacy\page.tsx
│  ├─ api\submit\route.ts           # POST → Sheets + Resend
│  ├─ opengraph-image.tsx           # OG dinámico 1200×630
│  ├─ icon.svg                      # favicon provisorio
│  ├─ apple-icon.png                # 180×180
│  └─ globals.css
├─ components\
│  ├─ chrome\ProgressBar.tsx
│  ├─ chrome\WizardNav.tsx
│  ├─ chrome\LangSelector.tsx
│  ├─ chrome\SaveToast.tsx
│  ├─ chrome\ResumeBanner.tsx
│  ├─ fields\Pill.tsx
│  ├─ fields\PriceRow.tsx
│  ├─ fields\YesNo.tsx
│  ├─ fields\TextInput.tsx
│  ├─ fields\TextArea.tsx
│  ├─ service\ServiceCard.tsx
│  ├─ bundle\BundleCard.tsx
│  └─ screens\Welcome.tsx
├─ lib\
│  ├─ schema.ts                     # Zod compartido
│  ├─ services.ts                   # config de los 13 servicios
│  ├─ bundles.ts                    # config de los 3 bundles
│  ├─ store.ts                      # Zustand
│  ├─ draft.ts                      # localStorage save/load con versión
│  ├─ sheets.ts                     # Google Sheets client (solo server)
│  ├─ email.ts                      # Resend client (solo server)
│  ├─ rate-limit.ts                 # rate limiter en-memoria
│  ├─ posthog.ts                    # PostHog init
│  └─ i18n.ts                       # next-intl config
├─ messages\
│  ├─ es.json
│  └─ en.json
├─ middleware.ts                    # next-intl + detección de locale
├─ docs\superpowers\specs\
│  ├─ 2026-04-20-creator-survey-design.md      # este doc (canónico)
│  └─ 2026-04-20-creator-survey-design-en.md   # versión en inglés
└─ .env.local
   # GOOGLE_SERVICE_ACCOUNT_EMAIL
   # GOOGLE_PRIVATE_KEY (base64)
   # GOOGLE_SHEET_ID
   # RESEND_API_KEY
   # NEXT_PUBLIC_POSTHOG_KEY
   # NEXT_PUBLIC_POSTHOG_HOST
```

## Límites de módulos

Cada componente tiene un solo propósito claro:

- `ServiceCard` maneja su propio state de interés + precio, emite `onChange(ServiceAnswer)`; no conoce otros servicios.
- `WizardNav` es dumb — recibe `onBack`, `onNext`, `canAdvance`.
- `sheets.ts` es el único que toca el SDK de Google; el resto llama a `appendSubmission(data)`.
- `email.ts` es el único que toca Resend; el resto llama a `sendWelcomeEmail(args)`.
- `schema.ts` no importa nada del app — contrato puro.
- `draft.ts` es la única fuente de verdad para localStorage.

## Testing

Básico — cubrir el camino crítico sin obsesionar:

- **Unit:** Zod schema (happy path + reglas condicionales). `ServiceCard` transiciones de estado. `draft.ts` save/load/expiración.
- **Integration:** API route con `sheets.ts` mockeado — verifica mapeo correcto de fila, honeypot, rate limit.
- **E2E (un camino):** Playwright en viewport móvil (390×844), welcome → submit completo → thanks. Verifica que el draft se limpie al submit.
- **Manual pre-lanzamiento:** checklist con iOS Safari 17, Android Chrome, WhatsApp in-app browser, Instagram in-app browser. El form tiene que funcionar en los 4.

## Despliegue

- Vercel conecta al repo, deploy automático en push a `main`
- Variables de entorno en Vercel: todas las del `.env.local` excepto archivos
- Google Sheet setup: crear sheet con header row matching schema; compartir con service account email como Editor
- Resend: verificar dominio `laneta.com` (DNS records DKIM/SPF)
- PostHog: crear proyecto en cloud, copiar key
- Preview URLs para cada PR para testing del equipo

## Fuera de alcance (explícito)

- Referral tracking con UTMs o codes
- Admin dashboard
- Save-and-resume cross-device (solo mismo browser)
- A/B testing de copy o precios
- Edición post-submit
- Auditoría WCAG AA completa (a11y básica sí)
- i18n en inglés completo en v1 (estructura lista; traducciones en v1.1)

## Preguntas abiertas

1. **Logo de La Neta:** pendiente. Hasta que llegue, se usa el favicon SVG provisorio con "LN" gradient. Cuando esté, reemplazar `app/icon.svg` y agregar versión horizontal para el header del welcome.
2. **From address del email:** `hola@laneta.com` asumido. Confirmar con el equipo antes de verificar dominio en Resend.
3. **Email `privacy@laneta.com`:** confirmar que existe o crear alias antes de publicar el aviso de privacidad.
4. **PostHog región:** US o EU según dónde estén los usuarios (mayormente LATAM → US funciona pero EU también ok por ley).
