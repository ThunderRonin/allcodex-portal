import { NextResponse } from "next/server";
import { getAllCodexIntegrationStatus } from "@/lib/allknower-server";
import { getAkCreds } from "@/lib/get-creds";
import { handleRouteError } from "@/lib/route-error";

export async function GET() {
  try {
    const creds = await getAkCreds();
    if (!creds.url || !creds.token) {
      return NextResponse.json({ connected: false, authenticated: false });
    }

    const status = await getAllCodexIntegrationStatus(creds);
    return NextResponse.json({ ...status, authenticated: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
