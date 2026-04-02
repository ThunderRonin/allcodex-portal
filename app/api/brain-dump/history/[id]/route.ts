import { NextRequest, NextResponse } from "next/server";
import { getAkCreds } from "@/lib/get-creds";
import { getBrainDumpEntry } from "@/lib/allknower-server";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const creds = await getAkCreds();
    if (!creds.url || !creds.token) return notConfigured("AllKnower");
    const { id } = await params;
    const entry = await getBrainDumpEntry(creds, id);
    return NextResponse.json(entry);
  } catch (err) {
    return handleRouteError(err);
  }
}
