import { NextRequest, NextResponse } from "next/server";
import { getNote } from "@/lib/etapi-server";
import { getEtapiCreds } from "@/lib/get-creds";
import { notConfigured } from "@/lib/route-error";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");
    const { id } = await params;

    // Get note metadata to know the mime type
    const note = await getNote(creds, id);

    // Fetch the raw content bytes
    const res = await fetch(`${creds.url}/etapi/notes/${id}/content`, {
      headers: {
        Authorization: creds.token,
      },
      // cache: "force-cache" // We could cache images, but Trilium images can change
    });

    if (!res.ok) {
      return new NextResponse(`Error fetching image: ${res.status}`, { status: res.status });
    }

    // Proxy the response bytes
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": note?.mime || "image/png",
        "Cache-Control": "public, max-age=86400", // cache for 1 day
      },
    });
  } catch (err: any) {
    console.error("Image proxy error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
