// app/api/meetings/date-overrides/route.ts
//
// GET  /api/meetings/date-overrides?year=2025&month=6
//      → returns all override rows for that month as an array
//
// POST /api/meetings/date-overrides
//      body: { date: "YYYY-MM-DD", enabled: boolean, start_time: "HH:MM", end_time: "HH:MM" }
//      → upserts a single date override (or array of them)
//
// DELETE /api/meetings/date-overrides?date=YYYY-MM-DD
//        → removes the override so the day falls back to weekly defaults

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = searchParams.get("year");
  const month = searchParams.get("month"); // 1-based

  if (!year || !month) {
    return NextResponse.json({ error: "year and month query params required" }, { status: 400 });
  }

  // Build date range for the requested month
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  // First day of next month, exclusive upper bound
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("meeting_date_overrides")
    .select("date, enabled, start_time, end_time")
    .gte("date", from)
    .lt("date", nextMonth)
    .order("date");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Accept a single object or an array
    const rows = Array.isArray(body) ? body : [body];

    if (rows.length === 0) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    // Basic validation
    for (const row of rows) {
      if (!row.date || typeof row.enabled === "undefined" || !row.start_time || !row.end_time) {
        return NextResponse.json({ error: "Each row needs date, enabled, start_time, end_time" }, { status: 400 });
      }
    }

    const { error } = await supabase
      .from("meeting_date_overrides")
      .upsert(rows, { onConflict: "date" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!date) {
    return NextResponse.json({ error: "date query param required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("meeting_date_overrides")
    .delete()
    .eq("date", date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}