// Maps a form-violet Submission to a row in the shared public.responses table
// in Supabase. The canonical shape of that table is defined by form-green
// (C:\Users\PC\Documents\cuestionario-diseño, migrations 20260420200000 ...).
//
// This file is the only place that knows about the enum / field-name /
// shape mismatches between the two forms. Internal code in form-violet
// keeps using its own vocabulary.

import { SERVICES, type ServiceConfig } from "./services";
import { BUNDLES } from "./bundles";
import type { Submission } from "./schema";

/* -------------------------------------------------------------------------- */
/* enum translation tables — form-violet value → form-green value              */
/* -------------------------------------------------------------------------- */

const FOLLOWER_MAP = {
  lt_1k: "<1K",
  "1k_10k": "1K-10K",
  "10k_50k": "10K-50K",
  "50k_100k": "50K-100K",
  "100k_500k": "100K-500K",
  "500k_plus": "500K+",
} as const;

const HOURS_MAP = {
  lt_2: "<2h",
  "2_5": "2-5h",
  "5_10": "5-10h",
  "10_plus": "10h+",
} as const;

const PLATFORM_MAP: Record<string, string> = {
  youtube: "youtube",
  tiktok: "tiktok",
  instagram: "instagram",
  facebook: "facebook",
  twitter: "x",
  other: "other",
};

const TASK_MAP: Record<string, string> = {
  cut_clips: "cut_clips",
  design_thumbnails: "design_thumbs",
  optimize_seo: "optimize_seo",
  translate_content: "translate_dub",
  manage_schedule: "manage_schedule",
  newsletter: "newsletter",
  paid_community: "paid_community",
  online_course: "online_course",
  podcast: "podcast",
  merchandise: "merch",
  none_of_above: "none",
};

const INTEREST_MAP = {
  very: "very",
  somewhat: "kinda",
  none: "nope",
} as const;

const BUDGET_MAP = {
  lt_50: "<50",
  "50_100": "50-100",
  "100_200": "100-200",
  "200_400": "200-400",
  "400_plus": "400+",
  custom: "other",
} as const;

// form-violet service id → form-green service key (matches the DB column prefix)
const SERVICE_ID_MAP: Record<string, string> = {
  short_clips: "short_form_clips",
  thumbnail_design: "thumbnail_cover_design",
  ai_dubbing: "ai_dubbing_translation",
  content_seo: "content_seo_hashtags",
  performance_dashboard: "weekly_dashboard",
  media_kit: "dynamic_media_kit",
  ai_coach: "elevn_ai_coach",
  we_post_for_you: "we_post_for_you",
  paid_community: "paid_community",
  newsletter: "newsletter",
  online_course: "online_course",
  podcast: "podcast",
  merch_store: "merch_store",
};

// Canonical order (01..13) — must match form-green's SERVICES catalog so
// the DB column prefix numbers line up.
const SERVICE_ORDER: readonly string[] = [
  "short_form_clips",
  "thumbnail_cover_design",
  "ai_dubbing_translation",
  "content_seo_hashtags",
  "weekly_dashboard",
  "dynamic_media_kit",
  "elevn_ai_coach",
  "we_post_for_you",
  "paid_community",
  "newsletter",
  "online_course",
  "podcast",
  "merch_store",
];

/* -------------------------------------------------------------------------- */
/* phone normalization + country derivation                                    */
/* -------------------------------------------------------------------------- */

/**
 * Strip whitespace / dashes so the stored number is strict E.164
 * (e.g. "+52 55 1234 5678" → "+5255 12345678" → "+525512345678").
 * form-green already emits this shape via react-phone-number-input;
 * form-violet's schema lets users type freely, so we clean on the server.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\s()-]/g, "");
  if (!cleaned) return null;
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/**
 * Dial-code → ISO-3166-1 alpha-2 country code. Covers the 6 priority
 * countries, all of LATAM, and a handful of EU destinations where we
 * might realistically get traffic. Anything outside returns null, which
 * is the same as before this change — no regression for unknowns.
 * +1 maps to 'US' even though Canada shares it; the survey audience is
 * US-dominant, so misclassifying the occasional Canadian is acceptable.
 */
const DIAL_TO_ISO: Record<string, string> = {
  "+1": "US",
  "+33": "FR",
  "+34": "ES",
  "+39": "IT",
  "+44": "GB",
  "+49": "DE",
  "+51": "PE",
  "+52": "MX",
  "+53": "CU",
  "+54": "AR",
  "+55": "BR",
  "+56": "CL",
  "+57": "CO",
  "+58": "VE",
  "+351": "PT",
  "+501": "BZ",
  "+502": "GT",
  "+503": "SV",
  "+504": "HN",
  "+505": "NI",
  "+506": "CR",
  "+507": "PA",
  "+509": "HT",
  "+591": "BO",
  "+592": "GY",
  "+593": "EC",
  "+595": "PY",
  "+597": "SR",
  "+598": "UY",
};

export function derivePhoneCountry(e164: string | null): string | null {
  if (!e164 || !e164.startsWith("+")) return null;
  // Longest prefix wins: +598 (Uruguay) must match before +5 (not a real code).
  for (let digits = 4; digits >= 1; digits--) {
    const prefix = e164.slice(0, digits + 1);
    if (prefix.length < 2) continue;
    const iso = DIAL_TO_ISO[prefix];
    if (iso) return iso;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* price-choice inference                                                      */
/* -------------------------------------------------------------------------- */

type PriceChoice = "low" | "mid" | "high" | "other" | "not_interested";

/**
 * form-violet's PriceRow stores a single number (the monthly price). form-green
 * splits it into a tier enum + an "other" amount. Derive the tier by matching
 * the user's number against the catalog. If the number coincides with a chip
 * value we classify it as that tier; otherwise it was typed freely — "other".
 *
 * Edge case: the user types a number that equals a chip. We can't tell that
 * apart from tapping the chip; we treat it as the chip. For willingness-to-pay
 * analytics that's the right answer.
 */
export function derivePriceChoice(
  priceMonthly: number | null,
  prices: readonly [number, number, number] | undefined,
): { choice: PriceChoice | null; other: number | null } {
  if (priceMonthly === null || priceMonthly === undefined) {
    return { choice: null, other: null };
  }
  if (!prices) {
    return { choice: "other", other: priceMonthly };
  }
  if (priceMonthly === prices[0]) return { choice: "low", other: null };
  if (priceMonthly === prices[1]) return { choice: "mid", other: null };
  if (priceMonthly === prices[2]) return { choice: "high", other: null };
  return { choice: "other", other: priceMonthly };
}

/* -------------------------------------------------------------------------- */
/* main                                                                        */
/* -------------------------------------------------------------------------- */

export type RowMeta = {
  submissionId: string;
  source: "form-green" | "form-violet";
  timestampIso: string;
  userAgent?: string | null;
  referrer?: string | null;
};

export function toResponsesRow(
  sub: Submission,
  meta: RowMeta,
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    // metadata ---------------------------------------------------------------
    submission_id: meta.submissionId,
    source: meta.source,
    timestamp_iso: meta.timestampIso,
    language: sub.locale,
    user_agent: meta.userAgent ?? null,
    referrer: meta.referrer ?? null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,

    // section 1 --------------------------------------------------------------
    q1_name: sub.name,
    q2_handle: sub.handle,
    q3_platforms: sub.platforms.map((p) => PLATFORM_MAP[p] ?? p),
    q3_platforms_other: sub.platforms_other || null,
    q4_followers: FOLLOWER_MAP[sub.follower_range],
    q5_hours_non_content: HOURS_MAP[sub.hours_non_content],
    q6_current_tasks: sub.does_currently.map((t) => TASK_MAP[t] ?? t),

    // section 3 (populated below) --------------------------------------------
    bundle_starter_price: null,
    bundle_starter_price_other: null,
    bundle_growth_price: null,
    bundle_growth_price_other: null,
    bundle_pro_price: null,
    bundle_pro_price_other: null,
    q8_buying_preference: sub.bundle_preference,

    // section 4 --------------------------------------------------------------
    q9_monthly_budget: BUDGET_MAP[sub.budget_range],
    q9_monthly_budget_other: sub.budget_custom ?? null,
    q10_top_wish: sub.one_wish,
    q11_can_contact: sub.contact_consent ? "yes" : "no",
    // Normalize to strict E.164 and derive ISO country from the dial prefix
    // so form-violet's data is comparable with form-green's on the dashboard.
    ...(() => {
      const phone = normalizePhone(sub.contact_phone);
      return { q11b_phone: phone, q11b_phone_country: derivePhoneCountry(phone) };
    })(),
    q11c_email: sub.contact_email || null,
    consent_marketing: sub.contact_consent,
  };

  // section 2 — services --------------------------------------------------------
  const submittedById: Record<string, Submission["services"][number]> = {};
  for (const s of sub.services) {
    const greenKey = SERVICE_ID_MAP[s.serviceId];
    if (greenKey) submittedById[greenKey] = s;
  }

  const configByGreenKey: Record<string, ServiceConfig> = {};
  for (const cfg of SERVICES) {
    const greenKey = SERVICE_ID_MAP[cfg.id];
    if (greenKey) configByGreenKey[greenKey] = cfg;
  }

  SERVICE_ORDER.forEach((greenKey, idx) => {
    const ord = String(idx + 1).padStart(2, "0");
    const prefix = `s${ord}_${greenKey}`;
    const s = submittedById[greenKey];

    if (!s || s.interest === undefined || s.interest === null) {
      row[`${prefix}_interest`] = null;
      row[`${prefix}_price`] = null;
      row[`${prefix}_price_other`] = null;
      return;
    }

    const interest = INTEREST_MAP[s.interest];
    row[`${prefix}_interest`] = interest;

    if (interest === "nope") {
      row[`${prefix}_price`] = "not_interested";
      row[`${prefix}_price_other`] = null;
      return;
    }

    const cfg = configByGreenKey[greenKey];
    const { choice, other } = derivePriceChoice(s.priceMonthly ?? null, cfg?.prices);
    row[`${prefix}_price`] = choice;
    row[`${prefix}_price_other`] = other;
  });

  // section 3 — bundles --------------------------------------------------------
  for (const b of ["starter", "growth", "pro"] as const) {
    const cfg = BUNDLES.find((x) => x.id === b);
    const priceKey = `bundle_${b}_price`;
    const priceOtherKey = `bundle_${b}_price_other`;
    const fieldName = `bundle_${b}_price` as const;
    const userPrice = sub[fieldName];

    if (userPrice === null || userPrice === undefined) {
      // form-violet models "not interested" as null price; mirror form-green.
      row[priceKey] = "not_interested";
      row[priceOtherKey] = null;
      continue;
    }

    const { choice, other } = derivePriceChoice(userPrice, cfg?.prices);
    row[priceKey] = choice;
    row[priceOtherKey] = other;
  }

  return row;
}
