import { NextResponse } from "next/server";
import { getAkCreds } from "@/lib/get-creds";
import { getModelChains } from "@/lib/allknower-server";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function GET() {
  try {
    const creds = await getAkCreds();
    if (!creds.url || !creds.token) return notConfigured("AllKnower");
    const models = await getModelChains(creds);
    return NextResponse.json(models);
  } catch (err) {
    return handleRouteError(err);
  }
}
