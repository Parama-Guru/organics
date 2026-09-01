import type { NextRequest } from "next/server";

/** Read JSON without trusting Content-Length or buffering an unbounded chunked body. */
export async function readBoundedJson(
  request: NextRequest,
  maxBytes: number,
): Promise<{ ok: true; value: unknown } | { ok: false; tooLarge: boolean }> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, tooLarge: true };
  }
  if (!request.body) return { ok: false, tooLarge: false };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, tooLarge: true };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return { ok: false, tooLarge: false };
  }
}
