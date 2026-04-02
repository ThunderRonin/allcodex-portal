import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "lore_root_note_id";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export async function GET() {
  const jar = await cookies();
  const value = jar.get(COOKIE_NAME)?.value ?? process.env.LORE_ROOT_NOTE_ID ?? "";
  return NextResponse.json({ loreRootNoteId: value });
}

export async function PUT(req: NextRequest) {
  const { loreRootNoteId } = await req.json();
  if (typeof loreRootNoteId !== "string") {
    return NextResponse.json({ error: "loreRootNoteId must be a string" }, { status: 400 });
  }
  const jar = await cookies();
  jar.set(COOKIE_NAME, loreRootNoteId.trim(), COOKIE_OPTS);
  return NextResponse.json({ ok: true });
}
