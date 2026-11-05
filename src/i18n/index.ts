import it from './it.json';
import en from './en.json';
import { BASE_URL, DEFAULT_LANG, LANGS, type Lang } from '../config/site';

export { LANGS, DEFAULT_LANG, type Lang };

export type Dictionary = typeof it;
export type MessageKey = keyof Dictionary;

const dictionaries: Record<Lang, Record<string, string>> = { it, en };

/** Testo localizzato dei contenuti: l'inglese può mancare (fallback all'italiano). */
export interface Localized {
  it: string;
  en?: string | undefined;
}

export const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && (LANGS as readonly string[]).includes(value);

/**
 * Traduce una chiave dell'interfaccia. I segnaposto `{nome}` vengono sostituiti
 * con `params.nome`. Se la chiave manca in inglese si usa l'italiano; se manca
 * ovunque si restituisce la chiave (e i test sulle traduzioni la segnalano).
 */
export function t(lang: Lang, key: MessageKey | (string & {}), params?: Record<string, string | number>): string {
  const msg = dictionaries[lang][key] ?? dictionaries[DEFAULT_LANG][key] ?? key;
  if (!params) return msg;
  return msg.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

/** Sceglie la lingua da un testo localizzato e dice se è stato usato il ripiego. */
export function pick(text: Localized, lang: Lang): { text: string; fallback: boolean } {
  if (lang === 'en' && text.en && text.en.trim().length > 0) return { text: text.en, fallback: false };
  if (lang === 'it') return { text: text.it, fallback: false };
  return { text: text.it, fallback: true };
}

/** Come `pick`, ma restituisce solo la stringa. */
export const tr = (text: Localized, lang: Lang): string => pick(text, lang).text;

const trimSlashes = (s: string) => s.replace(/^\/+|\/+$/g, '');

/**
 * Costruisce un percorso interno localizzato con base e barra finale.
 * `localizePath('anno-2/teoria-circuiti', 'en')` → `/study-hub/en/anno-2/teoria-circuiti/`.
 * Ancore e query sono conservate.
 */
export function localizePath(path: string, lang: Lang): string {
  const match = /^([^?#]*)(.*)$/.exec(path) ?? ['', path, ''];
  const pathname = trimSlashes(match[1] ?? '');
  const suffix = match[2] ?? '';
  const inner = pathname ? `${pathname}/` : '';
  return `${BASE_URL}${lang}/${inner}${suffix}`;
}

/** Percorso con la sola base (risorse non localizzate). */
export function withBase(path: string): string {
  return `${BASE_URL}${trimSlashes(path)}`;
}

/** Togli base e lingua: `/study-hub/en/anno-2/x/` → `anno-2/x`. */
export function stripLang(pathname: string): string {
  let rest = pathname.startsWith(BASE_URL) ? pathname.slice(BASE_URL.length) : trimSlashes(pathname);
  rest = trimSlashes(rest);
  const [first, ...others] = rest.split('/');
  return isLang(first) ? others.join('/') : rest;
}

/** Lingua dall'URL (primo segmento dopo la base); ripiego sulla lingua predefinita. */
export function getLangFromUrl(url: URL | string): Lang {
  const pathname = typeof url === 'string' ? url : url.pathname;
  const rest = pathname.startsWith(BASE_URL) ? pathname.slice(BASE_URL.length) : trimSlashes(pathname);
  const first = trimSlashes(rest).split('/')[0];
  return isLang(first) ? first : DEFAULT_LANG;
}

/** Stessa pagina nell'altra lingua (gli slug sono identici in IT ed EN). */
export function switchLangPath(url: URL | string, lang: Lang): string {
  const pathname = typeof url === 'string' ? url : url.pathname;
  return localizePath(stripLang(pathname), lang);
}

export const htmlLang: Record<Lang, string> = { it: 'it-IT', en: 'en-US' };
export const ogLocale: Record<Lang, string> = { it: 'it_IT', en: 'en_US' };

/** Per getStaticPaths: una voce per lingua. */
export const langPaths = () => LANGS.map((lang) => ({ params: { lang } }));
