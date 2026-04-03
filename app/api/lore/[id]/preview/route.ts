import { NextRequest, NextResponse } from "next/server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";
import { getNoteContent } from "@/lib/etapi-server";
import { normalizeLoreHtmlForPortal, sanitizePlayerView, sanitizeLoreHtml } from "@/lib/sanitize";

/**
 * GET /api/lore/[id]/preview?mode=player|gm
 *
 * mode=gm (default): Returns the note content sanitized for GM display (all content).
 * mode=player: Returns content with .gm-only elements stripped, simulating player view.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");

    const { id } = await params;
    const mode = req.nextUrl.searchParams.get("mode") ?? "gm";

    const rawContent = await getNoteContent(creds, id);
    const normalizedContent = normalizeLoreHtmlForPortal(rawContent);

    const processed =
      mode === "player"
        ? sanitizePlayerView(normalizedContent)
        : sanitizeLoreHtml(normalizedContent);

    return new NextResponse(processed, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
