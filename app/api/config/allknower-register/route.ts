/**
 * POST /api/config/allknower-register
 *
 * Registers a new account on AllKnower (better-auth) and stores the session token.
 * better-auth bearer plugin returns the token in the `set-auth-token` response header.
 * Endpoint: POST {url}/api/auth/sign-up/email
 *
 * Body: { url: string; email: string; name: string; password: string }
 */

import { NextRequest, NextResponse } from "next/server";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
};

export async function POST(req: NextRequest) {
  const { url, email, name, password } = await req.json().catch(() => ({}));

  if (!url || !email || !name || !password) {
    return NextResponse.json(
      { error: "url, email, name and password are required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${url}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: url,
      },
      body: JSON.stringify({ email, name, password }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `AllKnower returned ${res.status}${body ? `: ${body}` : ""}` },
        { status: 401 }
      );
    }

    // better-auth bearer plugin returns the token in the `set-auth-token` response header
    const token: string = res.headers.get("set-auth-token") ?? "";
    const data = await res.json();

    if (!token) {
      return NextResponse.json({ error: "No token in response (set-auth-token header missing)" }, { status: 502 });
    }

    const response = NextResponse.json({ ok: true, user: data.user ?? null });
    response.cookies.set("allknower_url", url, COOKIE_OPTS);
    response.cookies.set("allknower_token", token, COOKIE_OPTS);
    return response;
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
