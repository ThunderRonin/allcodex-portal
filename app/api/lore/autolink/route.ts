import { NextRequest, NextResponse } from "next/server";
import { searchNotesTitles } from "@/lib/etapi-server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

let cachedTitles: { noteId: string; title: string }[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function POST(req: NextRequest) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");

    const body = await req.json();
    const text = body.text || "";

    if (!text || text.length < 3) {
      return NextResponse.json({ matches: [] });
    }

    const now = Date.now();
    if (!cachedTitles || now - cacheTime > CACHE_TTL) {
      // Refresh cache
      const freshTitles = await searchNotesTitles(creds, "#lore", 5000);
      // Sort by length descending, so we match "Kingdom of Solaris" before we match "Solaris"
      freshTitles.sort((a, b) => b.title.length - a.title.length);
      cachedTitles = freshTitles;
      cacheTime = now;
    }

    const allTitles = cachedTitles;

    const matches: Array<{ term: string; noteId: string; title: string }> = [];
    const lowerText = text.toLowerCase();
    
    // We only want to return unique matches
    const matchedNoteIds = new Set<string>();

    for (const note of allTitles) {
      if (!note.title || note.title.length < 3) continue;
      
      const lowerTitle = note.title.toLowerCase();
      
      // Simple exact phrase match (case-insensitive) inside the text block
      if (lowerText.includes(lowerTitle)) {
        if (!matchedNoteIds.has(note.noteId)) {
          matchedNoteIds.add(note.noteId);
          matches.push({
            term: note.title,
            noteId: note.noteId,
            title: note.title,
          });
        }
      }
    }

    return NextResponse.json({ matches });
  } catch (err: any) {
    return handleRouteError(err);
  }
}
