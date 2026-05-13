import { type NextRequest, NextResponse } from "next/server";
import { getBrainDumpHistory } from "@/lib/allknower-server";
import { getAkCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function GET(req: NextRequest) {
  try {
    const creds = await getAkCreds();
    if (!creds.url || !creds.token) return notConfigured("AllKnower");
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const result = await getBrainDumpHistory(creds, cursor);
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
