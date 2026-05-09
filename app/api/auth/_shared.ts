import { NextResponse } from "next/server";

export const AUTH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
};

export function resolveAllKnowerUrl(url?: unknown): string {
  return typeof url === "string" && url.trim()
    ? url.trim().replace(/\/$/, "")
    : process.env.ALLKNOWER_URL ?? "";
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
