/**
 * Regole del modulo Contribuisci, condivise tra l'isola e i test.
 * Devono restare allineate a tools/apps-script/Logic.gs: lo verifica
 * tests/unit/apps-script/apps-script.test.ts.
 */

export const CONTRIB_TYPES = ['errore', 'miglioria', 'appunti', 'altro'] as const;
export type ContribType = (typeof CONTRIB_TYPES)[number];

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 5000;
export const NAME_MAX = 80;
export const MAX_FILES = 10;
export const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
/** Blocco di upload: multiplo di 256 KiB (richiesto dagli upload ripristinabili di Drive). */
export const CHUNK_BYTES = 4 * 1024 * 1024;
/** Tempo minimo plausibile per compilare il modulo (sotto, lo script lo tratta come bot). */
export const MIN_FILL_MS = 3000;

export const ALLOWED_EXTENSIONS = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  txt: 'text/plain',
  md: 'text/markdown',
  tex: 'application/x-tex',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
} as const;

/** Valore dell'attributo `accept` dell'input file. */
export const ACCEPT = Object.keys(ALLOWED_EXTENSIONS)
  .map((e) => `.${e}`)
  .join(',');

export const fileExtension = (name: string): string =>
  /\.([A-Za-z0-9]+)$/.exec(name)?.[1]?.toLowerCase() ?? '';

export const isAllowedFile = (name: string): boolean =>
  Object.prototype.hasOwnProperty.call(ALLOWED_EXTENSIONS, fileExtension(name));

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const COURSE_RE = /^[a-z0-9][a-z0-9/-]*$/;

export interface ContribFields {
  tipo: ContribType;
  corso: string;
  pagina: string;
  messaggio: string;
  email: string;
  nome: string;
  consensoPrivacy: boolean;
  consensoDiritti: boolean;
  consensoPubblicazione: boolean;
}

export interface FileLike {
  name: string;
  size: number;
}

export type FieldError =
  'required' | 'invalid' | 'too_short' | 'too_long' | 'type' | 'too_many' | 'too_large' | 'empty';
export type FieldErrors = Partial<Record<keyof ContribFields | 'files', FieldError>>;

export function validateFiles(files: readonly FileLike[]): FieldError | null {
  if (files.length > MAX_FILES) return 'too_many';
  let total = 0;
  for (const f of files) {
    if (!isAllowedFile(f.name)) return 'type';
    if (f.size <= 0) return 'empty';
    total += f.size;
  }
  return total > MAX_TOTAL_BYTES ? 'too_large' : null;
}

/** Stessa validazione dello script (che comunque la ripete lato server). */
export function validateFields(f: ContribFields, files: readonly FileLike[] = []): FieldErrors {
  const e: FieldErrors = {};
  if (!(CONTRIB_TYPES as readonly string[]).includes(f.tipo)) e.tipo = 'invalid';
  if (f.corso && !COURSE_RE.test(f.corso)) e.corso = 'invalid';
  if (f.pagina && !/^\/[^\s<>"]*$/.test(f.pagina)) e.pagina = 'invalid';
  const msg = f.messaggio.trim();
  if (msg.length === 0) e.messaggio = 'required';
  else if (msg.length < MESSAGE_MIN) e.messaggio = 'too_short';
  else if (msg.length > MESSAGE_MAX) e.messaggio = 'too_long';
  const email = f.email.trim();
  if (email && !EMAIL_RE.test(email)) e.email = 'invalid';
  if (f.nome.trim().length > NAME_MAX) e.nome = 'too_long';
  if (!f.consensoPrivacy) e.consensoPrivacy = 'required';
  if (!f.consensoDiritti) e.consensoDiritti = 'required';
  if (!f.consensoPubblicazione) e.consensoPubblicazione = 'required';
  const fe = validateFiles(files);
  if (fe) e.files = fe;
  return e;
}

/** Precompilazione da `?corso=&pagina=&tipo=`; i valori non validi vengono ignorati. */
export function prefillFromQuery(search: string, known: readonly string[]): Partial<ContribFields> {
  const q = new URLSearchParams(search);
  const out: Partial<ContribFields> = {};
  const tipo = q.get('tipo');
  if (tipo && (CONTRIB_TYPES as readonly string[]).includes(tipo)) out.tipo = tipo as ContribType;
  const corso = q.get('corso');
  if (corso && known.includes(corso)) out.corso = corso;
  const pagina = q.get('pagina');
  if (pagina && /^\/[^\s<>"]{0,299}$/.test(pagina)) out.pagina = pagina;
  return out;
}

/** Corpo dell'email di ripiego (quando l'endpoint non è configurato o non risponde). */
export function buildMailto(
  to: string,
  subject: string,
  f: Pick<ContribFields, 'tipo' | 'corso' | 'pagina' | 'messaggio' | 'nome'>,
  labels: { type: string; course: string; page: string; name: string; attach: string },
  hasFiles: boolean,
): string {
  const lines = [
    `${labels.type}: ${f.tipo}`,
    f.corso ? `${labels.course}: ${f.corso}` : '',
    f.pagina ? `${labels.page}: ${f.pagina}` : '',
    f.nome.trim() ? `${labels.name}: ${f.nome.trim()}` : '',
    '',
    f.messaggio.trim(),
    hasFiles ? `\n${labels.attach}` : '',
  ].filter((l, i) => l !== '' || i === 4);
  const subj = `${subject} [${f.tipo}]${f.corso ? ` ${f.corso}` : ''}`;
  return `mailto:${to}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

/** Dimensione leggibile (KB/MB, separatore decimale della lingua). */
export function formatBytes(bytes: number, lang: 'it' | 'en'): string {
  const nf = (n: number, d: number) =>
    n.toLocaleString(lang === 'it' ? 'it-IT' : 'en-GB', {
      maximumFractionDigits: d,
      minimumFractionDigits: 0,
    });
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${nf(bytes / 1024, 0)} KB`;
  return `${nf(bytes / (1024 * 1024), 1)} MB`;
}

/** Divide un ArrayBuffer in blocchi di CHUNK_BYTES codificati in base64. */
export function* chunksOf(buffer: ArrayBuffer, size = CHUNK_BYTES): Generator<string> {
  const bytes = new Uint8Array(buffer);
  const n = Math.max(1, Math.ceil(bytes.length / size));
  for (let i = 0; i < n; i++)
    yield toBase64(bytes.subarray(i * size, Math.min(bytes.length, (i + 1) * size)));
}

export function toBase64(bytes: Uint8Array): string {
  let bin = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) bin += String.fromCharCode(...bytes.subarray(i, i + step));
  return btoa(bin);
}
