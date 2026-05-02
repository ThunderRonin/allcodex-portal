export type RouteErrorPayload = {
  error: string;
  message: string;
};

export function isRouteErrorPayload(value: unknown): value is RouteErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    "message" in value &&
    typeof (value as { error?: unknown }).error === "string" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}

async function readJsonOrText(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function fetchJsonOrThrow<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = await readJsonOrText(response);

  if (!response.ok) {
    if (isRouteErrorPayload(body)) {
      throw body;
    }

    if (body instanceof Error) {
      throw body;
    }

    const message =
      typeof body === "string"
        ? body
        : response.statusText || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}
