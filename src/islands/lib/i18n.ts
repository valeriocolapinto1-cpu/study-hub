/**
 * Traduzioni per le isole (stesse chiavi di src/i18n), ridotte ai namespace in
 * src/i18n/island-namespaces.mjs: il dizionario completo non entra nel bundle.
 */
import dictionaries from 'virtual:island-i18n';
import { DEFAULT_LANG, type Lang } from '../../config/site';

export type { Lang };

export function t(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const msg = dictionaries[lang][key] ?? dictionaries[DEFAULT_LANG][key] ?? key;
  if (!params) return msg;
  return msg.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}
