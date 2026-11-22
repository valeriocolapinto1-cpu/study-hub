/**
 * IslandBoundary: confine d'errore attorno a ogni isola Preact. Non si usa a mano:
 * il plugin `tools/vite/island-boundary.mjs` sostituisce il client di @astrojs/preact
 * con `boundary-client.ts`, che avvolge ogni isola al momento dell'idratazione.
 *
 * Se un'isola lancia (render, effetti, idratazione) al posto del riquadro vuoto
 * compare un messaggio con «Ricarica» e «Segnala errore» (modulo Contribuisci
 * precompilato con pagina, corso e messaggio d'errore); il resto della pagina
 * continua a funzionare. Gli errori nei gestori di eventi non arrivano qui
 * (come in React): restano nella console.
 *
 * Testi IT/EN qui dentro e niente JSX: pesa poche centinaia di byte, perché
 * entra nel bundle di ogni pagina con isole (budget di Lighthouse).
 */
import { Component, h, type ComponentType } from 'preact';

const TEXTS = {
  it: ['Questa sezione non si è caricata per un errore.', 'Ricarica', 'Segnala errore'],
  en: ['This section failed to load because of an error.', 'Reload', 'Report error'],
};

/** Link al modulo Contribuisci con tipo «errore», pagina, corso e messaggio. */
export function reportHref(loc: Pick<Location, 'pathname'>, base: string, error: unknown): string {
  const rest = loc.pathname.startsWith(base)
    ? loc.pathname.slice(base.length)
    : loc.pathname.replace(/^\//, '');
  const lang = rest.startsWith('en/') ? 'en' : 'it';
  const page = `/${rest.replace(/^(it|en)\//, '')}`;
  const course = /^anno-\d+\/([^/]+)/.exec(page.slice(1))?.[1];
  const q = new URLSearchParams({ tipo: 'errore', pagina: page, ...(course ? { corso: course } : {}) });
  q.set('messaggio', String((error as Error | undefined)?.message ?? error).slice(0, 300));
  return `${base}${lang}/contribuisci/?${q}`;
}

interface State {
  error?: unknown;
}

export function withBoundary<P extends object>(Inner: ComponentType<P>): ComponentType<P> {
  return class IslandBoundary extends Component<P, State> {
    override componentDidCatch(error: unknown) {
      console.error(error);
      this.setState({ error });
    }
    override render(props: P, state: State) {
      if (!('error' in state)) return h(Inner, props);
      const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
      const [msg, reload, report] = TEXTS[document.documentElement.lang.startsWith('en') ? 'en' : 'it'];
      return h(
        'div',
        { class: 'sh-alert sh-alert--danger', role: 'alert', 'data-island-error': '' },
        h('p', null, msg),
        h(
          'p',
          { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn btn--sm', onClick: () => location.reload() }, reload),
          ' ',
          h(
            'a',
            {
              class: 'btn btn--ghost btn--sm',
              href: reportHref(location, base, state.error),
              rel: 'nofollow',
            },
            report,
          ),
        ),
      );
    }
  };
}
