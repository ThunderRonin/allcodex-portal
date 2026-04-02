import { NextResponse } from "next/server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";
import { searchNotes } from "@/lib/etapi-server";

/**
 * GET /api/share/tree
 * Returns all #lore notes with their share-relevant attributes:
 * draft, gmOnly, shareAlias, shareCredentials presence.
 * Used by the Shared Content Browser.
 */
export async function GET() {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");

    const notes = await searchNotes(creds, "#lore");

    const items = notes.map((n) => ({
      noteId: n.noteId,
      title: n.title,
      loreType: n.attributes.find((a) => a.name === "loreType")?.value ?? null,
      isDraft: n.attributes.some((a) => a.name === "draft" && a.type === "label"),
      isGmOnly: n.attributes.some((a) => a.name === "gmOnly" && a.type === "label"),
      shareAlias: n.attributes.find((a) => a.name === "shareAlias")?.value ?? null,
      isProtected: n.attributes.some((a) => a.name === "shareCredentials"),
      dateModified: n.dateModified,
    }));

    return NextResponse.json(items);
  } catch (err) {
    return handleRouteError(err);
  }
}
