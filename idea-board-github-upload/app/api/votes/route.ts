import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isSameOrigin, readJson } from "@/lib/request";
import { isUuid } from "@/lib/validation";

const cookieName = "idea_board_voter";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }
  const ideaId = typeof body === "object" && body !== null
    ? (body as Record<string, unknown>).ideaId
    : null;
  if (!isUuid(ideaId)) {
    return NextResponse.json({ error: "Invalid idea." }, { status: 400 });
  }

  const existingVoter = request.cookies.get(cookieName)?.value;
  const voterId = isUuid(existingVoter) ? existingVoter : randomUUID();

  try {
    const { error } = await getSupabase().from("votes").insert({
      idea_id: ideaId,
      voter_id: voterId,
    });

    if (error?.code === "23505") {
      return NextResponse.json({ error: "You already voted for this idea." }, { status: 409 });
    }
    if (error?.code === "23503") {
      return NextResponse.json({ error: "That idea no longer exists." }, { status: 404 });
    }
    if (error) throw error;

    const response = NextResponse.json({ ok: true }, { status: 201 });
    response.cookies.set(cookieName, voterId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    console.error("Could not save vote", error);
    return NextResponse.json({ error: "Could not save the vote. Please try again." }, { status: 500 });
  }
}
