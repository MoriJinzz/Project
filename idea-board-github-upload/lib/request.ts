import { NextRequest } from "next/server";

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === request.nextUrl.origin;
}

export async function readJson(request: NextRequest): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    throw new Error("Expected JSON");
  }
  const body = await request.text();
  if (body.length > 4096) throw new Error("Request too large");
  return JSON.parse(body) as unknown;
}
