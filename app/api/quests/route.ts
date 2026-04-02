import { NextRequest, NextResponse } from "next/server";
import { createAttribute, createNote, searchNotes } from "@/lib/etapi-server";
import { getEtapiCreds, getLoreRootNoteId } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

type QuestCreateResult = {
  noteId?: string;
  note?: {
    noteId?: string;
  };
};

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

function parseOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export async function POST(req: NextRequest) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");

    const body = await req.json();
    const title = parseOptionalString(body?.title);

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const parentNoteId = parseOptionalString(body?.parentNoteId) ?? await getLoreRootNoteId();
    const result = await createNote(creds, {
      parentNoteId,
      title,
      content: parseOptionalString(body?.content),
    });

    const created = result as QuestCreateResult;
    const noteId = created.noteId ?? created.note?.noteId;
    if (!noteId) {
      return NextResponse.json({ error: "Quest note was created without a noteId." }, { status: 502 });
    }

    await createAttribute(creds, { noteId, type: "label", name: "quest", value: "" });
    await createAttribute(creds, {
      noteId,
      type: "label",
      name: "questStatus",
      value: parseOptionalString(body?.status) ?? "active",
    });

    const description = parseOptionalString(body?.description);
    if (description) {
      await createAttribute(creds, { noteId, type: "label", name: "description", value: description });
    }

    const location = parseOptionalString(body?.location);
    if (location) {
      await createAttribute(creds, { noteId, type: "label", name: "location", value: location });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
