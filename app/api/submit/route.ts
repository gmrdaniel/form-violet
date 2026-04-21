import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  console.log("[submit-stub]", JSON.stringify(body, null, 2));
  return NextResponse.json({ ok: true, stub: true });
}
