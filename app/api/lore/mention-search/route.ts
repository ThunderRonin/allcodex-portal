import { NextRequest, NextResponse } from "next/server";
import { searchNotesTitles } from "@/lib/etapi-server";
import { akFetchAutocomplete } from "@/lib/allknower-server";
import { getEtapiCreds, getAkCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q");
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");

    // Sanitize q: remove double quotes, backslashes to avoid breaking ETAPI search syntax
    const safeQ = q.replace(/["\\]/g, "");

    // 1. Get exact matching note titles from AllCodex search
    // We use `#lore AND note.title` directly
    const etapiResults = await searchNotesTitles(creds, `#lore AND note.title *= "${safeQ}"`, 8);

    // 2. Optionally hit AllKnower for semantic autocomplete if enabled
    let akResults: any[] = [];
    try {
      const akCreds = await getAkCreds();
      if (akCreds.url && akCreds.token) {
        akResults = await akFetchAutocomplete(akCreds, q);
      }
    } catch (e) {
      // Ignore AI errors here, fallback to ETAPI
    }

    // 3. Merge and deduplicate by noteId
    const seen = new Set<string>();
    const merged = [];

    // Prioritize ETAPI direct prefix matches
    for (const res of etapiResults) {
      if (!seen.has(res.noteId)) {
        seen.add(res.noteId);
        merged.push({ noteId: res.noteId, title: res.title, loreType: res.loreType });
      }
    }

    // Add remaining semantic suggestions from AllKnower
    for (const res of akResults) {
      if (res.noteId && !seen.has(res.noteId)) {
        seen.add(res.noteId);
        merged.push({ noteId: res.noteId, title: res.title, loreType: res.type || "unknown" });
      }
    }

    return NextResponse.json(merged.slice(0, 8));
  } catch (err: any) {
    return handleRouteError(err);
  }
}
