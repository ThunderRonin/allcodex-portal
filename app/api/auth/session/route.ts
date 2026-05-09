import { NextResponse } from "next/server";
import { getAllKnowerSession } from "@/lib/allknower-server";
import { getAkCreds } from "@/lib/get-creds";
import { handleRouteError } from "@/lib/route-error";

export async function GET() {
  try {
    const creds = await getAkCreds();
    if (!creds.url || !creds.token) {
      return NextResponse.json({ authenticated: false, user: null, session: null });
    }

    const session = await getAllKnowerSession(creds);
    return NextResponse.json({
      authenticated: Boolean(session.session),
      user: session.user,
      session: session.session ? { active: true } : null,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
