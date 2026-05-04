import { NextResponse } from "next/server";
import { getGaps } from "@/lib/allknower-server";
import { getAkCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

async function handleGapScan() {
  try {
    const creds = await getAkCreds();
    if (!creds.url || !creds.token) return notConfigured("AllKnower");
    const result = await getGaps(creds);
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET() {
  return handleGapScan();
}

export async function POST() {
  return handleGapScan();
}
