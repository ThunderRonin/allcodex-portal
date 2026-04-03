import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> },
) {
  const { id } = await params;
  return NextResponse.redirect(new URL(`/api/lore/${id}/image`, req.url));
}
