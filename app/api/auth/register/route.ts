import { NextRequest, NextResponse } from "next/server";
import { registerAllKnower } from "@/lib/allknower-server";
import { handleRouteError } from "@/lib/route-error";
import { resolveAllKnowerUrl, setAllKnowerSessionCookies } from "../_shared";

export async function POST(req: NextRequest) {
  try {
    const { url, email, password, name } = await req.json().catch(() => ({}));
    const allknowerUrl = resolveAllKnowerUrl(url);

    if (!allknowerUrl || !email || !password || !name) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "url, email, password and name are required." },
        { status: 400 },
      );
    }

    const { token, user } = await registerAllKnower(allknowerUrl, email, password, name);
    const response = NextResponse.json({ ok: true, user });
    setAllKnowerSessionCookies(response, allknowerUrl, token);
    return response;
  } catch (err) {
    return handleRouteError(err);
  }
}
