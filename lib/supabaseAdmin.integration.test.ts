// Integration test that proves the full persistence pipeline works:
//   toResponsesRow(submission) → supabaseAdmin.insert → public.responses
//
// This hits the REAL Supabase project (same DB that prod uses). It only runs
// when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set — the rest of the
// time vitest marks the describe block as "skipped".
//
// Each test inserts one row tagged with a unique UUID, reads it back, asserts
// a few key columns survived the round-trip, then deletes the row in an
// afterAll cleanup (plus best-effort cleanup on test failure).
//
// Run only this file:  npm run test:integration

import { afterAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { toResponsesRow } from "./mapToDbRow";
import type { Submission } from "./schema";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasCreds = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

// Rows we insert during this run — cleaned up in afterAll even if a test fails.
const createdSubmissionIds: string[] = [];

function makeValidSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    locale: "es",
    name: "Integration Test",
    handle: "integration_test",
    platforms: ["youtube"],
    platforms_other: null,
    follower_range: "10k_50k",
    hours_non_content: "2_5",
    does_currently: ["cut_clips"],
    services: [
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
    ].map((serviceId) => ({
      serviceId,
      interest: "none" as const,
      priceMonthly: null,
      priceSetup: null,
    })),
    bundle_starter_price: null,
    bundle_growth_price: null,
    bundle_pro_price: null,
    bundle_preference: "not_sure",
    budget_range: "lt_50",
    budget_custom: null,
    one_wish: "persist me please",
    contact_consent: false,
    contact_phone: null,
    contact_email: null,
    hp_website: "",
    is_test: true,
    ...overrides,
  };
}

describe.skipIf(!hasCreds)("supabaseAdmin persistence (integration)", () => {
  // We build our own client here instead of importing supabaseAdmin because
  // lib/supabaseAdmin.ts captures env vars at module-load time — test-setup
  // sets them later. Constructing here guarantees fresh credentials.
  const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  afterAll(async () => {
    if (createdSubmissionIds.length === 0) return;
    const { error } = await admin
      .from("responses")
      .delete()
      .in("submission_id", createdSubmissionIds);
    if (error) {
      // Don't fail the suite on cleanup issues — surface so a human can act.
      console.warn(
        "[integration] cleanup failed; these submission_ids may be orphaned:",
        createdSubmissionIds,
        error.message,
      );
    }
  });

  it("inserts a row and reads it back with the expected shape", async () => {
    const submissionId = randomUUID();
    createdSubmissionIds.push(submissionId);

    const row = toResponsesRow(makeValidSubmission(), {
      submissionId,
      source: "form-violet",
      timestampIso: new Date().toISOString(),
      userAgent: "vitest-integration",
      referrer: null,
    });

    const insert = await admin.from("responses").insert(row);
    expect(insert.error, insert.error?.message).toBeNull();

    const read = await admin
      .from("responses")
      .select(
        "submission_id, source, language, q1_name, q2_handle, q4_followers, q9_monthly_budget, q11_can_contact",
      )
      .eq("submission_id", submissionId)
      .single();

    expect(read.error, read.error?.message).toBeNull();
    expect(read.data).toMatchObject({
      submission_id: submissionId,
      source: "form-violet",
      language: "es",
      q1_name: "Integration Test",
      q2_handle: "integration_test",
      q4_followers: "10K-50K",
      q9_monthly_budget: "<50",
      q11_can_contact: "no",
    });
  }, 20_000);

  it("rejects inserts with invalid data (CHECK constraints enforced)", async () => {
    const submissionId = randomUUID();
    const badRow = toResponsesRow(makeValidSubmission(), {
      submissionId,
      source: "form-violet",
      timestampIso: new Date().toISOString(),
      userAgent: null,
      referrer: null,
    });
    // q4_followers has a CHECK constraint; an unknown value must be rejected
    // by Postgres (the mapper would never produce this in prod).
    (badRow as Record<string, unknown>).q4_followers = "definitely-not-valid";

    const insert = await admin.from("responses").insert(badRow);
    expect(insert.error).not.toBeNull();
    // If it somehow inserted, we'd want to clean it up.
    if (!insert.error) createdSubmissionIds.push(submissionId);
  }, 20_000);
});

describe.skipIf(hasCreds)("supabaseAdmin persistence (skipped: no credentials)", () => {
  it("sets SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to enable", () => {
    // Placeholder so the output shows WHY integration tests didn't run.
    expect(hasCreds).toBe(false);
  });
});
