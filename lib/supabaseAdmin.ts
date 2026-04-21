import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side only. These env vars are NOT prefixed with NEXT_PUBLIC_, so
// they never leak into the client bundle. The API route at
// /app/api/submit/route.ts is the only thing that needs to write.
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin: SupabaseClient | null =
  url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null;

export const supabaseAdminConfigured = Boolean(supabaseAdmin);
