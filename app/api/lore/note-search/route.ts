import { NextRequest, NextResponse } from "next/server";
import { searchNotes } from "@/lib/etapi-server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function GET(req: NextRequest) {
  try {
    const rawQuery = req.nextUrl.searchParams.get("q");
    const type = req.nextUrl.searchParams.get("type");
    const q = rawQuery?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json([]);
    }

    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");

    const safeQ = q.replace(/["\\]/g, "");
    const results = await searchNotes(creds, `note.title *= "${safeQ}"`);

    return NextResponse.json(
      results
        .filter((note) => !type || note.type === type)
        .slice(0, 12)
        .map((note) => ({
          noteId: note.noteId,
          title: note.title,
          type: note.type,
          loreType: note.attributes.find((attribute) => attribute.name === "loreType")?.value ?? null,
        })),
    );
  } catch (err: any) {
    return handleRouteError(err);
  }
}
