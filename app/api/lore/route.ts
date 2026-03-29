import { NextRequest, NextResponse } from "next/server";
import { searchNotes, createNote, createAttribute } from "@/lib/etapi-server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function GET(req: NextRequest) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");
    const q = req.nextUrl.searchParams.get("q") ?? "#lore";
    const notes = await searchNotes(creds, q);
    return NextResponse.json(notes);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");
    const { loreType, templateId, attributes, ...noteParams } = await req.json();
    if (!noteParams.parentNoteId) noteParams.parentNoteId = "root";
    const result = await createNote(creds, noteParams);
    const noteId = (result as any)?.note?.noteId ?? (result as any).noteId;
    if (noteId) {
      await createAttribute(creds, { noteId, type: "label", name: "lore", value: "" });
      if (loreType) {
        await createAttribute(creds, { noteId, type: "label", name: "loreType", value: loreType });
      }
      if (templateId) {
        await createAttribute(creds, { noteId, type: "relation", name: "template", value: templateId }).catch(() => {});
      }
      if (attributes && typeof attributes === 'object') {
        for (const [key, value] of Object.entries(attributes)) {
          if (value && typeof value === 'string' && value.trim() !== '') {
            // Replace spaces with underscores for valid Trilium label names
            const sanitizedKey = key.replace(/\s+/g, '_');
            await createAttribute(creds, { noteId, type: "label", name: sanitizedKey, value: value.trim() });
          }
        }
      }
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
