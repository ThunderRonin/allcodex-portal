import { NextRequest, NextResponse } from "next/server";
import { getNoteAncestors } from "@/lib/etapi-server";
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
    const ancestors = await getNoteAncestors(creds, id);
    return NextResponse.json(ancestors);
  } catch (err) {
    return handleRouteError(err);
  }
}
