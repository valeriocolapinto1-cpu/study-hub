import { describe, expect, it } from 'vitest';
import { getLangFromUrl, localizePath, pick, stripLang, switchLangPath, t, withBase } from '../../src/i18n';
import it_ from '../../src/i18n/it.json';
import en from '../../src/i18n/en.json';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

describe('i18n', () => {
  it('base configurata', () => {
    expect(BASE).toBe('/study-hub/');
  });

  it('localizePath aggiunge base, lingua e barra finale', () => {
    expect(localizePath('', 'it')).toBe(`${BASE}it/`);
    expect(localizePath('/anno-2/teoria-circuiti/', 'en')).toBe(`${BASE}en/anno-2/teoria-circuiti/`);
    expect(localizePath('contribuisci?corso=fisica-2#modulo', 'it')).toBe(
      `${BASE}it/contribuisci/?corso=fisica-2#modulo`,
    );
    expect(withBase('favicon.svg')).toBe(`${BASE}favicon.svg`);
  });

  it('riconosce e cambia la lingua dall’URL', () => {
    expect(getLangFromUrl(new URL(`https://x.test${BASE}en/anno-1/fisica-1/`))).toBe('en');
    expect(getLangFromUrl(`${BASE}it/`)).toBe('it');
    expect(getLangFromUrl(`${BASE}`)).toBe('it');
    expect(stripLang(`${BASE}en/anno-1/fisica-1/`)).toBe('anno-1/fisica-1');
    expect(switchLangPath(`${BASE}en/anno-1/fisica-1/teoria/`, 'it')).toBe(
      `${BASE}it/anno-1/fisica-1/teoria/`,
    );
  });

  it('t() sostituisce i parametri e ripiega sull’italiano', () => {
    expect(t('it', 'home.year', { year: 2 })).toBe('2° anno');
    expect(t('en', 'home.year', { year: 2 })).toBe('Year 2');
    expect(t('en', 'chiave.inesistente')).toBe('chiave.inesistente');
  });

  it('pick() segnala il ripiego', () => {
    expect(pick({ it: 'ciao', en: 'hi' }, 'en')).toEqual({ text: 'hi', fallback: false });
    expect(pick({ it: 'ciao' }, 'en')).toEqual({ text: 'ciao', fallback: true });
  });

  it('dizionari IT ed EN hanno le stesse chiavi, tutte non vuote', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(it_).sort());
    for (const dict of [it_, en]) for (const v of Object.values(dict)) expect(v.trim()).not.toBe('');
  });
});
