"use client";

import { useCallback, useRef } from "react";

export type SSEEvent = {
  event: string;
  data: unknown;
};

export function useSSEStream() {
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async function* (
    url: string,
    body: unknown,
  ): AsyncGenerator<SSEEvent> {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`Stream failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let currentEvent = "message";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          try {
            yield { event: currentEvent, data: JSON.parse(line.slice(6)) };
          } catch {
            yield { event: currentEvent, data: line.slice(6) };
          }
        }
      }
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { stream, cancel };
}
