import { NextRequest, NextResponse } from "next/server";
import { getNote, getPortraitImageNoteId, getThemeSongUrl, patchNote, deleteNote, resolveNoteRelations } from "@/lib/etapi-server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");
    const { id } = await params;
    const note = await getNote(creds, id);
    const [resolvedRelations, portraitImageNoteId, themeSongUrl] = await Promise.all([
      resolveNoteRelations(creds, note),
      Promise.resolve(getPortraitImageNoteId(note)),
      Promise.resolve(getThemeSongUrl(note)),
    ]);
    return NextResponse.json({
      ...note,
      resolvedRelations,
      portraitImageNoteId,
      themeSongUrl,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");
    const { id } = await params;
    const body = await req.json();
    const note = await patchNote(creds, id, body);
    return NextResponse.json(note);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");
    const { id } = await params;
    await deleteNote(creds, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
