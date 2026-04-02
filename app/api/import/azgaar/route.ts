import { NextRequest, NextResponse } from "next/server";
import { getAkCreds } from "@/lib/get-creds";
import { handleRouteError, notConfigured } from "@/lib/route-error";

export async function POST(req: NextRequest) {
  try {
    const creds = await getAkCreds();
    if (!creds.url || !creds.token) return notConfigured("AllKnower");

    const { searchParams } = req.nextUrl;
    const endpoint = searchParams.get("action") === "preview"
      ? "/import/azgaar/preview"
      : "/import/azgaar";

    const body = await req.json();
    const res = await fetch(`${creds.url}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return handleRouteError(err);
  }
}
