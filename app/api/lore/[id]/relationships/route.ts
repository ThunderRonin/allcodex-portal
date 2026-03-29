import { NextRequest, NextResponse } from "next/server";
import { getNote, getNoteContent } from "@/lib/etapi-server";
import { suggestRelationships } from "@/lib/allknower-server";
import { getEtapiCreds, getAkCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

/**
 * POST /api/lore/[id]/relationships
 *
 * Fetches the note content, sends it to AllKnower for AI relationship
 * suggestions, and returns both AI suggestions and existing ETAPI relations.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const [etapiCreds, akCreds] = await Promise.all([getEtapiCreds(), getAkCreds()]);
    if (!etapiCreds.url || !etapiCreds.token) return notConfigured("AllCodex");
    if (!akCreds.url || !akCreds.token) return notConfigured("AllKnower");

    const { id } = await params;

    // Fetch note metadata + content in parallel
    const [note, html] = await Promise.all([
      getNote(etapiCreds, id),
      getNoteContent(etapiCreds, id),
    ]);

    // Strip HTML to get plain text for the AI
    const text = html
      .replace(/<[^>]*>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Extract existing relation attributes
    const existingRelations = note.attributes
      .filter((a) => a.type === "relation" && a.name !== "template")
      .map((a) => ({ name: a.name, targetNoteId: a.value }));

    // Resolve titles for existing relation targets
    const resolvedRelations = await Promise.all(
      existingRelations.map(async (rel) => {
        try {
          const target = await getNote(etapiCreds, rel.targetNoteId);
          return { ...rel, targetTitle: target.title };
        } catch {
          return { ...rel, targetTitle: rel.targetNoteId };
        }
      })
    );

    // Get AI suggestions (include note title for context, pass noteId for self-filter)
    const contextText = `[${note.title}]\n${text}`;
    const { suggestions } = await suggestRelationships(akCreds, contextText, id);

    return NextResponse.json({
      existing: resolvedRelations,
      suggestions,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
