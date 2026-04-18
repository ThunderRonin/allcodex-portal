/**
 * POST /api/config/connect
 *
 * Saves AllCodex and/or AllKnower credentials as HTTP-only cookies.
 * The client passes pre-acquired tokens directly — no server-side validation here,
 * that's done via /api/config/status.
 *
 * Body shape:
 *   {
 *     allcodex?: { url: string; token: string }
 *     allknower?: { url: string; token: string }
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  // Only mark secure on HTTPS. For localhost this stays false.
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // Read existing cookies before any async gap (for AllKnower fallback below)
  const jar = await cookies();
  const existingAkUrl = jar.get("allknower_url")?.value;
  const existingAkToken = jar.get("allknower_token")?.value;

  const saved: string[] = [];
  const response = NextResponse.json({ saved }); // we'll mutate `saved` before returning

  if (body.allcodex?.url && body.allcodex?.token) {
    response.cookies.set("allcodex_url", body.allcodex.url, COOKIE_OPTS);
    response.cookies.set("allcodex_token", body.allcodex.token, COOKIE_OPTS);
    saved.push("allcodex");

    // Forward AllCodex credentials to AllKnower so it can update its runtime
    // credential cache without requiring a restart. Use the allknower url/token
    // from the request body (if also being set) or existing cookies as fallback.
    const allknowerUrl = body.allknower?.url ?? existingAkUrl;
    const allknowerToken = body.allknower?.token ?? existingAkToken;
    if (allknowerUrl && allknowerToken) {
      fetch(`${allknowerUrl}/config/allcodex`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${allknowerToken}`,
        },
        body: JSON.stringify({ url: body.allcodex.url, token: body.allcodex.token }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => {
        // Non-fatal — AllKnower will fall back to env or pick up credentials on
        // the next cache refresh (60s TTL).
      });
    }
  }

  if (body.allknower?.url && body.allknower?.token) {
    response.cookies.set("allknower_url", body.allknower.url, COOKIE_OPTS);
    response.cookies.set("allknower_token", body.allknower.token, COOKIE_OPTS);
    saved.push("allknower");
  }

  if (saved.length === 0) {
    return NextResponse.json({ error: "No valid credentials provided" }, { status: 400 });
  }

  return response;
}
