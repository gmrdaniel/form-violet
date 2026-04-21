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
  hp_website: z.string(),
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
