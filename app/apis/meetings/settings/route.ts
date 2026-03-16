// ─────────────────────────────────────────────────────────────────────────────
// app/api/meetings/settings/route.ts
// Supabase table: meeting_settings (single row)
// Columns: id (int, default 1), start_time (text), end_time (text)
//
// Run once in Supabase SQL editor:
//   CREATE TABLE meeting_settings (
//     id INT PRIMARY KEY DEFAULT 1,
//     start_time TEXT NOT NULL DEFAULT '09:00',
//     end_time   TEXT NOT NULL DEFAULT '17:00'
//   );
//   INSERT INTO meeting_settings (id, start_time, end_time) VALUES (1, '09:00', '17:00')
//   ON CONFLICT (id) DO NOTHING;
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/meetings/settings
export async function GET() {
  const { data, error } = await supabase
    .from("meeting_settings")
    .select("start_time, end_time")
    .eq("id", "dbbbed5d-4e29-4402-9c60-88d5ad9aafeb")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/meetings/settings
export async function POST(req: NextRequest) {
  try {
    const { start_time, end_time } = await req.json();
    if (!start_time || !end_time) return NextResponse.json({ error: "start_time and end_time required" }, { status: 400 });

    const { error } = await supabase
      .from("meeting_settings")
      .upsert({ id: "dbbbed5d-4e29-4402-9c60-88d5ad9aafeb", start_time, end_time });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}