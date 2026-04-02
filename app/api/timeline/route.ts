import { NextRequest, NextResponse } from "next/server";
import { searchNotes } from "@/lib/etapi-server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function GET(_req: NextRequest) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");
    // Search for notes with either #event or #timeline labels (lore types)
    const [events, timelines] = await Promise.all([
      searchNotes(creds, "#loreType=event"),
      searchNotes(creds, "#loreType=timeline"),
    ]);
    // Merge, deduplicate by noteId
    const seen = new Set<string>();
    const all = [...events, ...timelines].filter((n) => {
      if (seen.has(n.noteId)) return false;
      seen.add(n.noteId);
      return true;
    });
    return NextResponse.json(all);
  } catch (err) {
    return handleRouteError(err);
  }
}
