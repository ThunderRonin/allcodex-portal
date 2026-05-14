import { NextRequest } from "next/server";
import { getAkCreds } from "@/lib/get-creds";
import { notConfigured } from "@/lib/route-error";
import { proxySSE } from "@/lib/sse-proxy";

export async function POST(req: NextRequest) {
  const creds = await getAkCreds();
  if (!creds.url || !creds.token) return notConfigured("AllKnower");
  const body = await req.json();
  return proxySSE(creds, "/brain-dump/stream", body);
}
