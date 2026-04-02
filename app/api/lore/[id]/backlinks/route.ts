import { NextRequest, NextResponse } from "next/server";
import { searchBacklinks } from "@/lib/etapi-server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");
    const { id } = await params;
    const backlinks = await searchBacklinks(creds, id);
    return NextResponse.json(backlinks);
  } catch (err) {
    return handleRouteError(err);
  }
}
