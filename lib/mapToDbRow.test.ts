import { describe, expect, it } from "vitest";
import {
  derivePhoneCountry,
  derivePriceChoice,
  normalizePhone,
  toResponsesRow,
} from "./mapToDbRow";
import type { Submission } from "./schema";

/* ---------------- test fixtures ---------------- */

function baseSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    locale: "es",
    name: "Ana",
    handle: "ana",
    platforms: ["youtube"],
    platforms_other: null,
    follower_range: "10k_50k",
    hours_non_content: "2_5",
    does_currently: ["cut_clips"],
    services: Array.from({ length: 13 }, (_, i) => ({
      serviceId: [
        "short_clips",
        "thumbnail_design",
        "ai_dubbing",
        "content_seo",
        "performance_dashboard",
        "media_kit",
        "ai_coach",
        "we_post_for_you",
        "paid_community",
        "newsletter",
        "online_course",
        "podcast",
        "merch_store",
      ][i],
      interest: "none" as const,
      priceMonthly: null,
      priceSetup: null,
    })),
    bundle_starter_price: null,
    bundle_growth_price: null,
    bundle_pro_price: null,
    bundle_preference: "not_sure",
    budget_range: "50_100",
    budget_custom: null,
    one_wish: "grow my audience",
    contact_consent: false,
    contact_phone: null,
    contact_email: null,
    hp_website: "",
    is_test: false,
    ...overrides,
  };
}

const meta = {
  submissionId: "11111111-1111-4111-8111-111111111111",
  source: "form-violet" as const,
  timestampIso: "2026-04-21T00:00:00.000Z",
  userAgent: "vitest",
  referrer: "http://localhost/",
};

/* ---------------- normalizePhone ---------------- */

describe("normalizePhone", () => {
  it("strips whitespace, parens, and dashes", () => {
    expect(normalizePhone("+52 55 1234 5678")).toBe("+525512345678");
    expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
  });

  it("adds a leading + when the user omitted it", () => {
    expect(normalizePhone("525512345678")).toBe("+525512345678");
  });

  it("returns null for empty, whitespace-only, or null input", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
  });
});

/* ---------------- derivePhoneCountry ---------------- */

describe("derivePhoneCountry", () => {
  it("matches the six priority countries", () => {
    expect(derivePhoneCountry("+15551234567")).toBe("US");
    expect(derivePhoneCountry("+525512345678")).toBe("MX");
    expect(derivePhoneCountry("+573001234567")).toBe("CO");
    expect(derivePhoneCountry("+584121234567")).toBe("VE");
    expect(derivePhoneCountry("+56912345678")).toBe("CL");
    expect(derivePhoneCountry("+51987654321")).toBe("PE");
  });

  it("picks the longest matching prefix (Uruguay over nothing)", () => {
    expect(derivePhoneCountry("+59891234567")).toBe("UY");
    expect(derivePhoneCountry("+59399123456")).toBe("EC");
    expect(derivePhoneCountry("+50240123456")).toBe("GT");
  });

  it("returns null for unknown codes and for non-E.164 strings", () => {
    expect(derivePhoneCountry("+99912345")).toBeNull();
    expect(derivePhoneCountry("5512345678")).toBeNull();
    expect(derivePhoneCountry(null)).toBeNull();
  });
});

/* ---------------- derivePriceChoice ---------------- */

describe("derivePriceChoice", () => {
  const prices = [29, 59, 99] as const;

  it("matches low/mid/high tiers", () => {
    expect(derivePriceChoice(29, prices)).toEqual({ choice: "low", other: null });
    expect(derivePriceChoice(59, prices)).toEqual({ choice: "mid", other: null });
    expect(derivePriceChoice(99, prices)).toEqual({ choice: "high", other: null });
  });

  it("returns choice=other and keeps the amount when user typed freely", () => {
    expect(derivePriceChoice(45, prices)).toEqual({ choice: "other", other: 45 });
  });

  it("returns both null when price is missing", () => {
    expect(derivePriceChoice(null, prices)).toEqual({ choice: null, other: null });
  });

  it("falls back to 'other' when the catalog is missing", () => {
    expect(derivePriceChoice(40, undefined)).toEqual({ choice: "other", other: 40 });
  });
});

/* ---------------- toResponsesRow ---------------- */

describe("toResponsesRow", () => {
  it("always stamps source=form-violet", () => {
    expect(toResponsesRow(baseSubmission(), meta).source).toBe("form-violet");
  });

  it("translates enum values to form-green's vocabulary", () => {
    const row = toResponsesRow(
      baseSubmission({
        follower_range: "10k_50k",
        hours_non_content: "2_5",
        budget_range: "50_100",
        platforms: ["twitter"],
        does_currently: ["design_thumbnails", "translate_content"],
      }),
      meta,
    );
    expect(row.q4_followers).toBe("10K-50K");
    expect(row.q5_hours_non_content).toBe("2-5h");
    expect(row.q9_monthly_budget).toBe("50-100");
    expect(row.q3_platforms).toEqual(["x"]);
    expect(row.q6_current_tasks).toEqual(["design_thumbs", "translate_dub"]);
  });

  it("maps contact_consent to q11_can_contact + normalizes phone + derives country", () => {
    const row = toResponsesRow(
      baseSubmission({
        contact_consent: true,
        contact_phone: "+52 55 1234 5678",
        contact_email: "ana@laneta.com",
      }),
      meta,
    );
    expect(row.q11_can_contact).toBe("yes");
    expect(row.q11b_phone).toBe("+525512345678");
    expect(row.q11b_phone_country).toBe("MX");
    expect(row.q11c_email).toBe("ana@laneta.com");
  });

  it("keeps phone null when the user did not provide one", () => {
    const row = toResponsesRow(baseSubmission(), meta);
    expect(row.q11b_phone).toBeNull();
    expect(row.q11b_phone_country).toBeNull();
  });

  it("maps interest=somewhat to form-green's 'kinda'", () => {
    const input = baseSubmission();
    input.services[0] = {
      serviceId: "short_clips",
      interest: "somewhat",
      priceMonthly: 59,
      priceSetup: null,
    };
    const row = toResponsesRow(input, meta);
    expect(row.s01_short_form_clips_interest).toBe("kinda");
    expect(row.s01_short_form_clips_price).toBe("mid");
  });

  it("marks interest=none as nope + not_interested", () => {
    const row = toResponsesRow(baseSubmission(), meta);
    expect(row.s01_short_form_clips_interest).toBe("nope");
    expect(row.s01_short_form_clips_price).toBe("not_interested");
  });

  it("emits all 13 service triplets regardless of input order", () => {
    const row = toResponsesRow(baseSubmission(), meta);
    const expectedColumns = [
      "s01_short_form_clips",
      "s02_thumbnail_cover_design",
      "s03_ai_dubbing_translation",
      "s04_content_seo_hashtags",
      "s05_weekly_dashboard",
      "s06_dynamic_media_kit",
      "s07_elevn_ai_coach",
      "s08_we_post_for_you",
      "s09_paid_community",
      "s10_newsletter",
      "s11_online_course",
      "s12_podcast",
      "s13_merch_store",
    ];
    for (const prefix of expectedColumns) {
      expect(row).toHaveProperty(`${prefix}_interest`);
      expect(row).toHaveProperty(`${prefix}_price`);
      expect(row).toHaveProperty(`${prefix}_price_other`);
    }
  });

  it("maps bundle numeric prices to tier + other", () => {
    const row = toResponsesRow(
      baseSubmission({
        bundle_starter_price: 79, // tier low (prices: [79,99,129])
        bundle_growth_price: 220, // off-catalog → other
        bundle_pro_price: null, // not interested
      }),
      meta,
    );
    expect(row.bundle_starter_price).toBe("low");
    expect(row.bundle_growth_price).toBe("other");
    expect(row.bundle_growth_price_other).toBe(220);
    expect(row.bundle_pro_price).toBe("not_interested");
  });

  it("matches the full snapshot for a golden submission", () => {
    const sub = baseSubmission({
      name: "Ana Torres",
      handle: "anatorres",
      platforms: ["youtube", "tiktok"],
      follower_range: "50k_100k",
      hours_non_content: "10_plus",
      does_currently: ["cut_clips", "design_thumbnails"],
      contact_consent: true,
      contact_phone: "+52 55 1234 5678",
      contact_email: "ana@laneta.com",
      one_wish: "help me grow internationally",
      budget_range: "200_400",
      bundle_growth_price: 199,
    });
    sub.services[0] = {
      serviceId: "short_clips",
      interest: "very",
      priceMonthly: 59,
      priceSetup: null,
    };
    sub.services[6] = {
      serviceId: "ai_coach",
      interest: "somewhat",
      priceMonthly: 29,
      priceSetup: null,
    };

    expect(toResponsesRow(sub, meta)).toMatchSnapshot();
  });
});
