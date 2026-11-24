/**
 * Validazione della richiesta del pannello (nessuna libreria: il Worker resta piccolo).
 * Le lunghezze massime proteggono la spesa: un messaggio dello studente è breve, il contesto
 * della pagina al più un esercizio con la sua soluzione.
 */

export const LIMITS = {
  /** Corpo della richiesta (byte). */
  body: 64_000,
  message: 2_000,
  messages: 20,
  title: 200,
  outline: 6_000,
  text: 6_000,
  answer: 2_000,
  solution: 6_000,
  courseId: 64,
  turnstile: 2_048,
} as const;

export type ContextKind = 'exercise' | 'card' | 'theory';

export interface TutorRequest {
  lang: 'it' | 'en';
  course: { id: string; title: string; outline: string };
  context: { kind: ContextKind; title: string; text: string; answer?: string; solution?: string };
  messages: { role: 'user' | 'assistant'; content: string }[];
  turnstile?: string;
}

export type Validation =
  { ok: true; value: TutorRequest } | { ok: false; code: 'invalid' | 'too-long'; field: string };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function validateRequest(raw: unknown): Validation {
  let tooLong = '';
  const str = (v: unknown, max: number, field: string, required = true): string | undefined | null => {
    if (v === undefined || v === null || v === '') return required ? null : undefined;
    if (typeof v !== 'string') return null;
    const s = v.trim();
    if (required && !s) return null;
    if (s.length > max) {
      tooLong ||= field;
      return s.slice(0, max);
    }
    return s;
  };
  const bad = (field: string): Validation => ({ ok: false, code: 'invalid', field });

  if (!isObj(raw)) return bad('body');
  const lang = raw.lang === 'en' ? 'en' : raw.lang === 'it' ? 'it' : null;
  if (!lang) return bad('lang');

  if (!isObj(raw.course)) return bad('course');
  const courseId = str(raw.course.id, LIMITS.courseId, 'course.id');
  if (!courseId || !/^[a-z0-9-]+$/.test(courseId)) return bad('course.id');
  const courseTitle = str(raw.course.title, LIMITS.title, 'course.title');
  const outline = str(raw.course.outline, LIMITS.outline, 'course.outline');
  if (!courseTitle) return bad('course.title');
  if (!outline) return bad('course.outline');

  if (!isObj(raw.context)) return bad('context');
  const kind = raw.context.kind;
  if (kind !== 'exercise' && kind !== 'card' && kind !== 'theory') return bad('context.kind');
  const title = str(raw.context.title, LIMITS.title, 'context.title');
  const text = str(raw.context.text, LIMITS.text, 'context.text');
  const answer = str(raw.context.answer, LIMITS.answer, 'context.answer', false);
  const solution = str(raw.context.solution, LIMITS.solution, 'context.solution', false);
  if (!title) return bad('context.title');
  if (!text) return bad('context.text');
  if (answer === null) return bad('context.answer');
  if (solution === null) return bad('context.solution');

  if (!Array.isArray(raw.messages) || raw.messages.length === 0) return bad('messages');
  if (raw.messages.length > LIMITS.messages) return { ok: false, code: 'too-long', field: 'messages' };
  const messages: TutorRequest['messages'] = [];
  for (const [i, m] of raw.messages.entries()) {
    if (!isObj(m)) return bad(`messages.${i}`);
    // Turni alterni, dal primo all'ultimo dello studente: niente prefill dell'assistente.
    const role = i % 2 === 0 ? 'user' : 'assistant';
    if (m.role !== role) return bad(`messages.${i}.role`);
    // Le risposte del tutor tornano dalla cronologia del browser: stesso limite del contesto.
    const content = str(m.content, role === 'user' ? LIMITS.message : LIMITS.text, `messages.${i}`);
    if (!content) return bad(`messages.${i}.content`);
    messages.push({ role, content });
  }
  if (messages.at(-1)?.role !== 'user') return bad('messages');

  const turnstile = str(raw.turnstile, LIMITS.turnstile, 'turnstile', false);
  if (turnstile === null) return bad('turnstile');
  if (tooLong) return { ok: false, code: 'too-long', field: tooLong };

  return {
    ok: true,
    value: {
      lang,
      course: { id: courseId, title: courseTitle, outline },
      context: {
        kind,
        title,
        text,
        ...(answer ? { answer } : {}),
        ...(solution ? { solution } : {}),
      },
      messages,
      ...(turnstile ? { turnstile } : {}),
    },
  };
}

/** Caratteri totali della richiesta (per la stima del costo massimo). */
export const requestChars = (r: TutorRequest): number =>
  r.course.title.length +
  r.course.outline.length +
  r.context.title.length +
  r.context.text.length +
  (r.context.answer?.length ?? 0) +
  (r.context.solution?.length ?? 0) +
  r.messages.reduce((n, m) => n + m.content.length, 0);
