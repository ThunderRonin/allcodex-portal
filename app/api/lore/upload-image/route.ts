import { NextRequest, NextResponse } from "next/server";
import { createNote, putNoteContent } from "@/lib/etapi-server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function POST(req: NextRequest) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");

    const contentType = req.headers.get("content-type") || "application/octet-stream";
    const filename = req.headers.get("x-vercel-filename") || "image.png";

    // Read raw body since form-data from createImageUpload bypasses Next.js FormData parsing sometimes
    // Actually our client sends the File directly as body: fetch(..., { body: file })
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create an image note in Trilium (AllCodex)
    // We put it under "root" or perhaps an "attachments" note if one existed, but "root" works on ETAPI
    const createResult = await createNote(creds, {
      parentNoteId: "root",
      title: filename,
      type: "image",
      mime: contentType,
    });
    
    // ETAPI v1 returns the note directly
    const noteId = createResult?.noteId;

    if (!noteId) {
      throw new Error("Failed to create image note in ETAPI");
    }

    // Put the image data into the note content
    // Warning: ETAPI putNoteContent currently sets "text/html" hardcoded in etapi-server.ts!
    // We need to use a custom fetch for images, or update etapi-server.ts to support mimes.
    // Let's do a direct fetch here to avoid breaking other things right now.
    const res = await fetch(`${creds.url}/etapi/notes/${noteId}/content`, {
      method: "PUT",
      headers: {
        Authorization: creds.token,
        "Content-Type": contentType,
      },
      body: buffer,
    });

    if (!res.ok) {
      throw new Error(`Failed to put image content: ${await res.text()}`);
    }

    // Return the URL that the portal can use to load this image.
    // Our portal proxy doesn't currently proxy static images cleanly unless we add a route,
    // but we can use an absolute URL from the AllCodex instance (requires auth though),
    // Or we provide a /api/lore/[id]/image route.
    // For now we'll return a new local proxy route.
    const url = `/api/lore/${noteId}/image`;

    return NextResponse.json({ url, noteId }, { status: 201 });
  } catch (err: any) {
    return handleRouteError(err);
  }
}
