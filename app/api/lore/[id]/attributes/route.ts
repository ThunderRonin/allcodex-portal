import { NextRequest, NextResponse } from "next/server";
import { getEtapiCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";
import { createAttribute, deleteAttribute } from "@/lib/etapi-server";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");

    const params = await props.params;
    const body = await req.json();

    const created = await createAttribute(creds, {
      noteId: params.id,
      type: body.type,
      name: body.name,
      value: body.value,
    });
    return NextResponse.json(created);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const creds = await getEtapiCreds();
    if (!creds.url || !creds.token) return notConfigured("AllCodex");

    // The attribute ID needs to be passed via URL params or search params.
    // For a generic delete we expect ?attrId=XXX
    const attrId = req.nextUrl.searchParams.get("attrId");

    if (!attrId) {
      return NextResponse.json({ error: "Missing attrId" }, { status: 400 });
    }

    await deleteAttribute(creds, attrId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
