import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isSameOrigin, readJson } from "@/lib/request";
import { parseIdeaInput } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let input;
  try {
    input = parseIdeaInput(await readJson(request));
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }
  if (!input) {
    return NextResponse.json({ error: "Check the field lengths and try again." }, { status: 400 });
  }

  try {
    const { error } = await getSupabase().from("ideas").insert(input);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Could not create idea", error);
    return NextResponse.json({ error: "Could not save the idea. Please try again." }, { status: 500 });
  }
}
