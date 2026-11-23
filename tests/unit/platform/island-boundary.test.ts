// @vitest-environment jsdom
/**
 * IslandBoundary (ripiego delle isole che lanciano) e avviso sui dati locali.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { ERROR_LOG_KEY, reportHref, withBoundary } from '../../../src/islands/lib/boundary';
import { dataPageHref, showNotice } from '../../../src/scripts/data-notice';
import { prefillFromQuery } from '../../../src/lib/contribute/rules';

const BASE = '/study-hub/';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  document.documentElement.lang = '';
  vi.restoreAllMocks();
});

function Boom({ when }: { when: 'render' | 'effect' }): null {
  useEffect(() => {
    if (when === 'effect') throw new Error('effetto rotto');
  }, [when]);
  if (when === 'render') throw new TypeError('Cannot read properties of null');
  return null;
}

const Ok = ({ label }: { label: string }) => h('p', null, label);

describe('IslandBoundary', () => {
  it('senza errori rende l’isola così com’è (nessun DOM in più)', () => {
    const W = withBoundary(Ok);
    const { container } = render(h(W, { label: 'ciao' }));
    expect(container.innerHTML).toBe('<p>ciao</p>');
  });

  it.each(['render', 'effect'] as const)('errore in %s: messaggio, Ricarica, Segnala errore', (when) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    document.documentElement.lang = 'it-IT';
    const W = withBoundary(Boom);
    render(h('div', null, h(W, { when }), h(Ok, { label: 'resto della pagina' })));
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Questa sezione non si è caricata');
    expect(screen.getByRole('button', { name: 'Ricarica' })).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Segnala errore' }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toMatch(/\/contribuisci\/\?tipo=errore/);
    // Il resto della pagina non è toccato.
    expect(screen.getByText('resto della pagina')).toBeTruthy();
    expect(console.error).toHaveBeenCalled();
  });

  it('in inglese i testi del ripiego sono in inglese', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    document.documentElement.lang = 'en-US';
    render(h(withBoundary(Boom), { when: 'render' }));
    expect(screen.getByRole('button', { name: 'Reload' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Report error' })).toBeTruthy();
  });

  it('Ricarica ricarica la pagina', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload, pathname: '/' });
    render(h(withBoundary(Boom), { when: 'render' }));
    fireEvent.click(screen.getByRole('button'));
    expect(reload).toHaveBeenCalled();
  });

  it('Ricarica chiede l’aggiornamento completo a pwa.ts, se c’è', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload, pathname: '/' });
    const hard = vi.fn((e: Event) => e.preventDefault());
    addEventListener('sh:hard-reload', hard);
    try {
      render(h(withBoundary(Boom), { when: 'render' }));
      fireEvent.click(screen.getByRole('button'));
      expect(hard).toHaveBeenCalled();
      expect(reload).not.toHaveBeenCalled();
    } finally {
      removeEventListener('sh:hard-reload', hard);
    }
  });

  it('pagina di una build vecchia: niente riquadro mentre si controlla la versione', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let settle!: (r: { reload: boolean; reason: string }) => void;
    const listener = (e: Event) => {
      (e as CustomEvent<{ pending?: Promise<unknown> }>).detail.pending = new Promise((r) => (settle = r));
    };
    addEventListener('sh:island-error', listener);
    try {
      localStorage.removeItem(ERROR_LOG_KEY);
      render(h('div', null, h(withBoundary(Boom), { when: 'render' })));
      expect(screen.queryByRole('alert')).toBeNull();
      settle({ reload: false, reason: 'stessa-versione' });
      expect(await screen.findByRole('alert')).toBeTruthy();
      const href = screen.getByRole('link', { name: 'Segnala errore' }).getAttribute('href') ?? '';
      expect(new URLSearchParams(href.slice(href.indexOf('?'))).get('messaggio')).toMatch(
        /^\[stessa-versione · \S+\] Cannot read properties of null$/,
      );
      // Registro locale con il motivo.
      const log = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) ?? '[]') as Array<{ text: string }>;
      expect(log.at(-1)?.text).toContain('[stessa-versione');
    } finally {
      removeEventListener('sh:island-error', listener);
    }
  });

  it('se la pagina si ricarica il riquadro non compare', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const listener = (e: Event) => {
      (e as CustomEvent<{ pending?: Promise<unknown> }>).detail.pending = Promise.resolve({
        reload: true,
        reason: 'versione',
      });
    };
    addEventListener('sh:island-error', listener);
    try {
      render(h(withBoundary(Boom), { when: 'render' }));
      await new Promise((r) => setTimeout(r, 0));
      expect(screen.queryByRole('alert')).toBeNull();
    } finally {
      removeEventListener('sh:island-error', listener);
    }
  });

  it('il link precompila tipo, pagina, corso e messaggio nel modulo Contribuisci', () => {
    const href = reportHref(
      { pathname: '/study-hub/en/anno-2/fisica-2/esame/' },
      BASE,
      new Error('x is undefined'),
    );
    expect(href.startsWith('/study-hub/en/contribuisci/?')).toBe(true);
    expect(prefillFromQuery(href.slice(href.indexOf('?')), ['fisica-2'])).toEqual({
      tipo: 'errore',
      pagina: '/anno-2/fisica-2/esame',
      corso: 'fisica-2',
      messaggio: 'x is undefined',
    });
    const hub = reportHref({ pathname: '/study-hub/it/appunti/' }, BASE, 'stringa');
    expect(prefillFromQuery(hub.slice(hub.indexOf('?')), [])).toEqual({
      tipo: 'errore',
      pagina: '/appunti',
      messaggio: 'stringa',
    });
  });
});

describe('avviso sui dati locali', () => {
  it('errore di salvataggio: un solo avviso con link a I miei dati', () => {
    document.documentElement.lang = 'it-IT';
    showNotice('storage');
    showNotice('storage');
    showNotice('backup');
    const boxes = document.querySelectorAll('.sh-notice');
    expect(boxes).toHaveLength(1);
    expect(boxes[0]?.getAttribute('role')).toBe('status');
    expect(boxes[0]?.textContent).toContain('Impossibile salvare i progressi');
    expect(boxes[0]?.querySelector('a')?.getAttribute('href')).toBe(dataPageHref('it'));
  });

  it('promemoria di backup in inglese; la chiusura lo rimanda', async () => {
    vi.resetModules();
    const { showNotice: show } = await import('../../../src/scripts/data-notice');
    document.documentElement.lang = 'en-US';
    const onDismiss = vi.fn();
    show('backup', onDismiss);
    const box = document.querySelector('.sh-notice')!;
    expect(box.textContent).toContain('30 days');
    expect(box.querySelector('a')?.getAttribute('href')).toBe(`${BASE}en/i-miei-dati/`);
    fireEvent.click(box.querySelector('button')!);
    expect(document.querySelector('.sh-notice')).toBeNull();
    expect(onDismiss).toHaveBeenCalledOnce();
    // L'errore di salvataggio sostituisce il promemoria.
    show('backup');
    show('storage');
    expect(document.querySelectorAll('.sh-notice')).toHaveLength(1);
    expect(document.querySelector('.sh-notice')?.getAttribute('data-kind')).toBe('storage');
  });
});
