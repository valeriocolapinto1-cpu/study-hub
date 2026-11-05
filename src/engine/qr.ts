/**
 * Trasferimento dei dati via QR.
 *
 * 1. Il JSON dell'export viene compresso con `CompressionStream('deflate')`
 *    e codificato in base64url.
 * 2. Il testo viene diviso in frame `SH1:<i>/<n>:<crc>:<blocco>`: un QR se
 *    basta, altrimenti una sequenza animata. Oltre `MAX_FRAMES` si usa il file.
 * 3. In lettura i frame (in qualsiasi ordine, anche ripetuti) si accumulano in
 *    un `FrameCollector` finché il messaggio è completo e il CRC torna.
 *
 * Il disegno del QR usa `qrcode-generator` (MIT, nessuna dipendenza) caricato
 * in modo lazy; la lettura usa `BarcodeDetector` quando il browser lo offre,
 * altrimenti `jsQR` (caricato solo se serve). Questo modulo è puro: il
 * caricamento delle librerie sta nell'isola ExportImport.
 */

export const FRAME_PREFIX = 'SH1';
/** Caratteri di dati per frame: QR versione ~20 con correzione L, leggibile da schermo. */
export const FRAME_CHARS = 700;
export const MAX_FRAMES = 24;

// ─────────────────────────── base64url ───────────────────────────

export function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error('base64url non valido');
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ─────────────────────────── compressione ───────────────────────────

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const response = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await response.arrayBuffer());
}

export const compressionSupported = (): boolean =>
  typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

/** Testo → deflate → base64url. Senza CompressionStream: prefisso `r` e testo non compresso. */
export async function compressText(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  if (!compressionSupported()) return `r${toBase64Url(bytes)}`;
  return `z${toBase64Url(await pipe(bytes, new CompressionStream('deflate')))}`;
}

export async function decompressText(payload: string): Promise<string> {
  const kind = payload[0];
  const bytes = fromBase64Url(payload.slice(1));
  if (kind === 'r') return new TextDecoder().decode(bytes);
  if (kind !== 'z') throw new Error('formato sconosciuto');
  if (!compressionSupported()) throw new Error('decompressione non supportata');
  return new TextDecoder().decode(await pipe(bytes, new DecompressionStream('deflate')));
}

// ─────────────────────────── frame ───────────────────────────

/** CRC-32 (IEEE) in esadecimale, per riconoscere frame di messaggi diversi. */
export function crc32(text: string): string {
  let crc = ~0;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i);
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (~crc >>> 0).toString(16).padStart(8, '0');
}

export function splitFrames(payload: string, size = FRAME_CHARS): string[] {
  const n = Math.max(1, Math.ceil(payload.length / size));
  const crc = crc32(payload);
  return Array.from(
    { length: n },
    (_, i) => `${FRAME_PREFIX}:${i + 1}/${n}:${crc}:${payload.slice(i * size, (i + 1) * size)}`,
  );
}

export interface ParsedFrame {
  index: number;
  total: number;
  crc: string;
  chunk: string;
}

export function parseFrame(text: string): ParsedFrame | null {
  const m = /^SH1:(\d{1,3})\/(\d{1,3}):([0-9a-f]{8}):([A-Za-z0-9_-]*)$/.exec(text.trim());
  if (!m) return null;
  const index = Number(m[1]);
  const total = Number(m[2]);
  if (index < 1 || total < 1 || index > total) return null;
  return { index, total, crc: m[3]!, chunk: m[4]! };
}

/** Accumula frame letti dalla fotocamera (ordine qualsiasi, duplicati ignorati). */
export class FrameCollector {
  private crc: string | null = null;
  private total = 0;
  private chunks = new Map<number, string>();

  /** Aggiunge un testo letto; `true` se era un frame nuovo e valido. */
  add(text: string): boolean {
    const f = parseFrame(text);
    if (!f) return false;
    if (this.crc !== f.crc) {
      // Nuovo messaggio: si riparte.
      this.crc = f.crc;
      this.total = f.total;
      this.chunks.clear();
    }
    if (this.chunks.has(f.index)) return false;
    this.chunks.set(f.index, f.chunk);
    return true;
  }

  get received(): number {
    return this.chunks.size;
  }

  get expected(): number {
    return this.total;
  }

  get missing(): number[] {
    return Array.from({ length: this.total }, (_, i) => i + 1).filter((i) => !this.chunks.has(i));
  }

  get complete(): boolean {
    return this.total > 0 && this.chunks.size === this.total;
  }

  /** Payload ricomposto (verifica il CRC) oppure `null` se incompleto o corrotto. */
  payload(): string | null {
    if (!this.complete) return null;
    const joined = Array.from({ length: this.total }, (_, i) => this.chunks.get(i + 1)!).join('');
    return crc32(joined) === this.crc ? joined : null;
  }
}

/** Prepara i frame di un testo; `null` se servirebbero troppi QR (usare il file). */
export async function encodeForQr(
  text: string,
  opts: { frameChars?: number; maxFrames?: number } = {},
): Promise<string[] | null> {
  const frames = splitFrames(await compressText(text), opts.frameChars ?? FRAME_CHARS);
  return frames.length > (opts.maxFrames ?? MAX_FRAMES) ? null : frames;
}

/** Ricompone e decomprime il testo dai frame raccolti. */
export async function decodeFromCollector(c: FrameCollector): Promise<string | null> {
  const payload = c.payload();
  return payload === null ? null : decompressText(payload);
}

/** Interpreta testo incollato: uno o più frame (uno per riga) oppure il JSON stesso. */
export async function decodePasted(text: string): Promise<string | null> {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return trimmed;
  const c = new FrameCollector();
  for (const line of trimmed.split(/\s+/)) c.add(line);
  return decodeFromCollector(c);
}

// ─────────────────────────── disegno ───────────────────────────

/** Matrice di moduli (true = scuro), come prodotta da un codificatore QR. */
export interface QrMatrix {
  size: number;
  isDark(row: number, col: number): boolean;
}

/** SVG compatto (un solo path) con margine di 4 moduli, colori da CSS (`currentColor`). */
export function matrixToSvg(m: QrMatrix, title: string): string {
  const margin = 4;
  const dim = m.size + margin * 2;
  let d = '';
  for (let r = 0; r < m.size; r++) {
    let c = 0;
    while (c < m.size) {
      if (!m.isDark(r, c)) {
        c++;
        continue;
      }
      const start = c;
      while (c < m.size && m.isDark(r, c)) c++;
      d += `M${start + margin} ${r + margin}h${c - start}v1h${start - c}z`;
    }
  }
  const esc = title.replace(
    /[&<>"]/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" role="img" shape-rendering="crispEdges"><title>${esc}</title><rect width="${dim}" height="${dim}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
