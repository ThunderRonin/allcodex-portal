import type { AkCreds } from "./get-creds";

export async function proxySSE(
  creds: AkCreds,
  path: string,
  body: unknown,
  timeoutMs = 300_000,
): Promise<Response> {
  if (!creds.url || !creds.token) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: "AllKnower not configured" })}\n\n`,
      { status: 503, headers: { "Content-Type": "text/event-stream" } },
    );
  }

  let res: Response;
  try {
    res = await fetch(`${creds.url}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: "AllKnower is unreachable" })}\n\n`,
      { status: 503, headers: { "Content-Type": "text/event-stream" } },
    );
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "Unknown error");
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: text })}\n\n`,
      { status: 502, headers: { "Content-Type": "text/event-stream" } },
    );
  }

  const upstream = res.body;
  const safe = new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch {
        // Upstream closed (AllKnower finished) — not an error for the client
      } finally {
        controller.close();
      }
    },
  });

  return new Response(safe, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
