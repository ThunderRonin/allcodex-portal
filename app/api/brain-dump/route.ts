import { NextRequest, NextResponse } from "next/server";
import { runBrainDump } from "@/lib/allknower-server";
import { getAkCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function POST(req: NextRequest) {
  try {
    const creds = await getAkCreds();
    if (!creds.url || !creds.token) return notConfigured("AllKnower");
    const { rawText, mode, model } = await req.json();
    const result = await runBrainDump(creds, rawText, mode ?? "auto", model);
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
