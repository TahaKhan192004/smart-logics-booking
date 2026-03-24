// app/api/meetings/settings/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

// GET /api/meetings/settings
// Returns array of { day, enabled, start_time, end_time }
export async function GET() {
  const { data, error } = await supabase
    .from("meeting_settings")
    .select("day, enabled, start_time, end_time")
    .order("day");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return in Mon–Sun order
  const ordered = DAYS.map(d => data?.find(r => r.day === d) ?? { day: d, enabled: false, start_time: "09:00", end_time: "17:00" });
  return NextResponse.json(ordered);
}

// POST /api/meetings/settings
// Body: array of { day, enabled, start_time, end_time }
export async function POST(req: NextRequest) {
  try {
    const rows = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Expected array of day settings" }, { status: 400 });
    }

    const { error } = await supabase
      .from("meeting_settings")
      .upsert(rows, { onConflict: "day" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}