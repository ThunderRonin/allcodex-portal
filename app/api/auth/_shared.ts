import { NextResponse } from "next/server";
import { validateAllKnowerUrl } from "@/lib/url-validation";

export const AUTH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
};

export function resolveAllKnowerUrl(url?: unknown): string {
  const raw = typeof url === "string" && url.trim() ? url.trim() : process.env.ALLKNOWER_URL ?? "";
  if (!raw) return "";
  return validateAllKnowerUrl(raw);
}

export function setAllKnowerSessionCookies(
  response: NextResponse,
  url: string,
  token: string,
) {
  response.cookies.set("allknower_url", url, AUTH_COOKIE_OPTS);
  response.cookies.set("allknower_token", token, AUTH_COOKIE_OPTS);
}

export function clearAllKnowerSessionCookies(response: NextResponse) {
  response.cookies.delete("allknower_token");
  response.cookies.delete("allknower_url");
}
