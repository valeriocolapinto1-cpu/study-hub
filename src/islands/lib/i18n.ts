/**
 * Traduzioni per le isole (stesse chiavi di src/i18n), ridotte ai namespace in
 * src/i18n/island-namespaces.mjs: il dizionario completo non entra nel bundle.
 *
 * Nel browser (build di produzione) si scarica solo il dizionario della lingua
 * della pagina (`<html lang>`): le isole ricevono sempre la stessa lingua come
 * prop, e l'altro dizionario pesava ~3,5 KB gzip su ogni pagina del motore.
 * Sul server, in sviluppo e nei test si caricano entrambi.
 */
import { DEFAULT_LANG, LANGS, type Lang } from '../../config/site';

export type { Lang };

const load = (l: Lang): Promise<{ default: Record<string, string> }> =>
  l === 'en' ? import('virtual:island-i18n/en') : import('virtual:island-i18n/it');

const pageLang: Lang | null =
  import.meta.env.PROD && !import.meta.env.SSR && typeof document !== 'undefined'
    ? document.documentElement.lang.startsWith('en')
      ? 'en'
      : 'it'
    : null;

const dictionaries: Partial<Record<Lang, Record<string, string>>> = Object.fromEntries(
  await Promise.all((pageLang ? [pageLang] : LANGS).map(async (l) => [l, (await load(l)).default] as const)),
);

export function t(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const msg =
    dictionaries[lang]?.[key] ??
    dictionaries[DEFAULT_LANG]?.[key] ??
    (pageLang ? dictionaries[pageLang]?.[key] : undefined) ??
    key;
  if (!params) return msg;
  return msg.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}
