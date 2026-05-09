import { NextResponse } from "next/server";
import { getAkCreds } from "@/lib/get-creds";

export async function POST() {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEV_WIPE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const akCreds = await getAkCreds();

  try {
    if (akCreds.url && akCreds.token) {
      const akRes = await fetch(`${akCreds.url}/config/wipe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${akCreds.token}` },
      });
      if (!akRes.ok) {
        console.error("AllKnower wipe failed:", await akRes.text());
      }
    }

    return NextResponse.json({ ok: true, message: "AllKnower dev data wiped successfully" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
