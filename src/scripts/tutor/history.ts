/**
 * Cronologia delle conversazioni del tutor: solo in questo browser (localStorage), mai sul server.
 * Una conversazione per contesto (esercizio, scheda, pagina di teoria), al più MAX_CONVERSATIONS per
 * corso (le più vecchie escono) e MAX_TURNS messaggi ciascuna. Fuori dallo spazio `sh:v1:`: non
 * entra in esportazioni e backup. Il gettone di sessione del Worker sta in sessionStorage.
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Store {
  v: 1;
  chats: Record<string, { at: number; messages: ChatMessage[] }>;
}

export const MAX_CONVERSATIONS = 30;
/** Pari: la conversazione inviata al Worker resta entro i suoi 20 turni con la domanda nuova. */
export const MAX_TURNS = 18;

const key = (course: string) => `sh:tutor:${course}`;

function readStore(course: string): Store {
  try {
    const raw = JSON.parse(localStorage.getItem(key(course)) ?? 'null') as Store | null;
    if (raw && raw.v === 1 && typeof raw.chats === 'object' && raw.chats) return raw;
  } catch {
    // illeggibile: si riparte
  }
  return { v: 1, chats: {} };
}

const valid = (m: unknown): m is ChatMessage =>
  !!m &&
  typeof m === 'object' &&
  ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
  typeof (m as ChatMessage).content === 'string';

export function loadChat(course: string, ctx: string): ChatMessage[] {
  const list = readStore(course).chats[ctx]?.messages;
  return Array.isArray(list) ? list.filter(valid) : [];
}

export function saveChat(course: string, ctx: string, messages: ChatMessage[], now = Date.now()): void {
  const store = readStore(course);
  if (messages.length === 0) delete store.chats[ctx];
  else store.chats[ctx] = { at: now, messages: messages.slice(-MAX_TURNS) };
  const keys = Object.keys(store.chats).sort((a, b) => store.chats[b]!.at - store.chats[a]!.at);
  for (const k of keys.slice(MAX_CONVERSATIONS)) delete store.chats[k];
  try {
    localStorage.setItem(key(course), JSON.stringify(store));
  } catch {
    // spazio pieno o storage bloccato: la conversazione resta solo in memoria
  }
}

/**
 * Messaggi da inviare: la storia (tagliata da un turno dello studente, così i ruoli alternano
 * partendo da `user`) più la domanda nuova.
 */
export function outgoing(history: ChatMessage[], question: string): ChatMessage[] {
  let h = history.slice(-MAX_TURNS);
  while (h.length && h[0]!.role !== 'user') h = h.slice(1);
  // Solo coppie complete domanda → risposta.
  const pairs: ChatMessage[] = [];
  for (let i = 0; i + 1 < h.length; i += 2)
    if (h[i]!.role === 'user' && h[i + 1]!.role === 'assistant') pairs.push(h[i]!, h[i + 1]!);
  return [...pairs, { role: 'user', content: question }];
}

const SESSION_KEY = 'sh:tutor:session';
export function getSession(): string {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? '';
  } catch {
    return '';
  }
}
export function setSession(token: string): void {
  try {
    if (token) sessionStorage.setItem(SESSION_KEY, token);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // niente sessione: al prossimo messaggio si rifà Turnstile
  }
}
