import { NextResponse } from "next/server";
import { deleteAllCodexIntegration } from "@/lib/allknower-server";
import { getAkCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function DELETE() {
  try {
    const creds = await getAkCreds();
    if (!creds.url || !creds.token) return notConfigured("AllKnower");

    const result = await deleteAllCodexIntegration(creds);
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
