import { NextRequest, NextResponse } from "next/server";
import { suggestRelationships, applyRelationships } from "@/lib/allknower-server";
import { getAkCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function POST(req: NextRequest) {
  try {
    const creds = await getAkCreds();
    if (!creds.url || !creds.token) return notConfigured("AllKnower");
    const { text } = await req.json();
    const result = await suggestRelationships(creds, text);
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const creds = await getAkCreds();
    if (!creds.url || !creds.token) return notConfigured("AllKnower");
    const { sourceNoteId, relations, bidirectional } = await req.json();
    const result = await applyRelationships(creds, sourceNoteId, relations, bidirectional);
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
