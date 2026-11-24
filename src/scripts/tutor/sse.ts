/**
 * Lettura dello stream del Worker (`text/event-stream`, righe `data: {json}` separate da una riga
 * vuota). Senza EventSource: serve una POST con corpo e intestazioni.
 */
export type TutorEvent =
  | { type: 'session'; token: string }
  | { type: 'text'; text: string }
  | { type: 'refusal' }
  | { type: 'done'; stop: string }
  | { type: 'error'; code: string };

/** Eventi di un blocco di testo SSE già completo (righe `data:` di un evento unite da `\n`). */
export function parseBlock(block: string): TutorEvent | null {
  const data = block
    .split('\n')
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).replace(/^ /, ''))
    .join('\n');
  if (!data) return null;
  try {
    const ev = JSON.parse(data) as TutorEvent;
    return typeof ev?.type === 'string' ? ev : null;
  } catch {
    return null;
  }
}

export async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<TutorEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      buf += decoder.decode(value, { stream: !done }).replace(/\r\n?/g, '\n');
      let i: number;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const ev = parseBlock(buf.slice(0, i));
        buf = buf.slice(i + 2);
        if (ev) yield ev;
      }
      if (done) break;
    }
    const last = parseBlock(buf);
    if (last) yield last;
  } finally {
    reader.releaseLock();
  }
}
