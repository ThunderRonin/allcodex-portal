import { NextRequest, NextResponse } from "next/server";
import { createAttribute, createNote, searchNotes } from "@/lib/etapi-server";
import { getEtapiCreds, getLoreRootNoteId } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function GET(_req: NextRequest) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");
    const notes = await searchNotes(creds, "#quest");
    return NextResponse.json(notes);
  } catch (err) {
    return handleRouteError(err);
  }
}

function asOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export async function POST(req: NextRequest) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");

    const body = await req.json();
    const title = asOptionalString(body?.title);

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const parentNoteId = asOptionalString(body?.parentNoteId) ?? await getLoreRootNoteId();
    const result = await createNote(creds, {
      parentNoteId,
      title,
      content: asOptionalString(body?.content),
    });

    const created = result as { noteId?: string; note?: { noteId?: string } };
    const noteId = created.noteId ?? created.note?.noteId;
    if (noteId) {
      await createAttribute(creds, { noteId, type: "label", name: "quest", value: "" });
      await createAttribute(creds, {
        noteId,
        type: "label",
        name: "questStatus",
        value: asOptionalString(body?.status) ?? "active",
      });

      const description = asOptionalString(body?.description);
      if (description) {
        await createAttribute(creds, { noteId, type: "label", name: "description", value: description });
      }

      const location = asOptionalString(body?.location);
      if (location) {
        await createAttribute(creds, { noteId, type: "label", name: "location", value: location });
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
