import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { SubmissionSchema } from "@/lib/schema";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { toResponsesRow } from "@/lib/mapToDbRow";

/**
 * Form-violet submission endpoint.
 *
 * Writes into the same public.responses table that form-green uses (shared
 * Supabase project). Differences between the two frontends' internal schemas
 * are translated in lib/mapToDbRow. We always stamp source='form-violet'.
 *
 * Uses the service_role key server-side (never exposed to the browser), so
 * the endpoint bypasses RLS intentionally — the anon-insert policy is only
 * relied on by form-green, which runs in the browser.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "invalid json" },
      { status: 400 },
    );
  }

  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Honeypot: if a bot filled the hidden field, pretend success and bail.
  if (parsed.data.hp_website && parsed.data.hp_website.length > 0) {
    return NextResponse.json({ ok: true, submissionId: randomUUID() });
  }

  if (!supabaseAdmin) {
    console.error(
      "[submit] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
    return NextResponse.json(
      { ok: false, error: "server not configured" },
      { status: 500 },
    );
  }

  const submissionId = randomUUID();
  const row = toResponsesRow(parsed.data, {
    submissionId,
    source: "form-violet",
    timestampIso: new Date().toISOString(),
    userAgent: req.headers.get("user-agent"),
    referrer: req.headers.get("referer"),
  });

  const { error } = await supabaseAdmin.from("responses").insert(row);
  if (error) {
    console.error("[submit] supabase insert failed:", error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, submissionId });
}
