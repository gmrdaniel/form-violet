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
    interest: "none" as const,
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

  it("accepts svc with interest=very and no price", () => {
    const services = [...validSubmission.services];
    services[0] = { ...services[0], interest: "very" as const };
    const result = SubmissionSchema.safeParse({ ...validSubmission, services });
    expect(result.success).toBe(true);
  });

  it("rejects svc with interest=none but price set", () => {
    const services = [...validSubmission.services];
    services[0] = { ...services[0], interest: "none" as const, priceMonthly: 29 };
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
