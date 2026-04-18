/**
 * GET /api/config/status
 *
 * Returns live connectivity status for AllCodex (Trilium) and AllKnower.
 * Actually tries to reach each service — safe GET requests.
 */

import { NextResponse } from "next/server";
import { getEtapiCreds, getAkCreds } from "@/lib/get-creds";

async function probeAllCodex(url: string, token: string): Promise<{ ok: boolean; version?: string; error?: string }> {
  try {
    const res = await fetch(`${url}/etapi/app-info`, {
      headers: { Authorization: token }, // raw token, Trilium's EtapiTokenAuth scheme
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, version: data.appVersion };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function probeAllKnower(url: string, token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    // Use /api/auth/session to validate the bearer token — the composite /health
    // endpoint returns 503 when upstream deps (AllCodex, LanceDB) are degraded,
    // which is unrelated to whether the Portal has valid AllKnower credentials.
    const res = await fetch(`${url}/api/auth/get-session`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    // better-auth returns { session, user } when valid, or null/empty when not
    if (!data?.session) return { ok: false, error: "Invalid or expired session" };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function GET() {
  const etapiCreds = await getEtapiCreds();
  const akCreds = await getAkCreds();

  const [allcodex, allknower] = await Promise.all([
    etapiCreds.url && etapiCreds.token
      ? probeAllCodex(etapiCreds.url, etapiCreds.token)
      : { ok: false, error: "Not configured" },
    akCreds.url && akCreds.token
      ? probeAllKnower(akCreds.url, akCreds.token)
      : { ok: false, error: "Not configured" },
  ]);

  return NextResponse.json({
    allcodex: {
      ...allcodex,
      url: etapiCreds.url || null,
      configured: Boolean(etapiCreds.url && etapiCreds.token),
    },
    allknower: {
      ...allknower,
      url: akCreds.url || null,
      configured: Boolean(akCreds.url && akCreds.token),
    },
  });
}
