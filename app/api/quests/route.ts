import { NextRequest, NextResponse } from "next/server";
import { searchNotes } from "@/lib/etapi-server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function GET(_req: NextRequest) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");
    const notes = await searchNotes(creds, "#quest");
    return NextResponse.json(notes);
  } catch (err) {
    return handleRouteError(err);
  }
}
