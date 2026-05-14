import { NextResponse } from "next/server";
import { execFileSync } from "child_process";
import { getAkCreds } from "@/lib/get-creds";

function isDevBranch(): boolean {
  try {
    return execFileSync("git", ["branch", "--show-current"], { encoding: "utf-8" }).trim() === "dev";
  } catch {
    return false;
  }
}

export async function POST() {
  if (process.env.NODE_ENV === "production" || !isDevBranch()) {
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
        const body = await akRes.text();
        console.error("AllKnower wipe failed:", body);
        return NextResponse.json({ ok: false, error: `AllKnower wipe failed: ${akRes.status}` }, { status: 502 });
      }
    }

    return NextResponse.json({ ok: true, message: "AllKnower dev data wiped successfully" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
