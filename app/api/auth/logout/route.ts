import { NextResponse } from "next/server";
import { logoutAllKnower } from "@/lib/allknower-server";
import { getAkCreds } from "@/lib/get-creds";
import { clearAllKnowerSessionCookies } from "../_shared";

export async function POST() {
  const creds = await getAkCreds();
  if (creds.url && creds.token) {
    await logoutAllKnower(creds).catch(() => undefined);
  }

  const response = NextResponse.json({ ok: true });
  clearAllKnowerSessionCookies(response);
  return response;
}
