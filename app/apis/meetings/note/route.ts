import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { meeting_id, note } = await req.json();
  if (!meeting_id) return NextResponse.json({ error: "meeting_id required" }, { status: 400 });

  const { error } = await supabase
    .from("meetings")
    .update({ note })
    .eq("id", meeting_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}