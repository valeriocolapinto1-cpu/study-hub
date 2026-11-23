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
 * Prima di mostrare il messaggio l'errore passa a `src/scripts/pwa.ts` (evento
 * `sh:island-error`): se la pagina è di una build non più pubblicata (HTML vecchio
 * in cache, codice o dati cambiati) il worker si aggiorna e la pagina si ricarica da
 * sola, e il riquadro non compare. Altrimenti il motivo (`versione-ripetuta`, `offline`,
 * `stessa-versione`) e la build finiscono nella console e nel messaggio di
 * «Segnala errore». «Ricarica» chiede a pwa.ts un aggiornamento completo
 * (`sh:hard-reload`: worker deregistrato, cache svuotate tranne i corsi scaricati).
 *
 * Testi IT/EN qui dentro e niente JSX: pesa poche centinaia di byte, perché
 * entra nel bundle di ogni pagina con isole (budget di Lighthouse).
 */
import { Component, h, type ComponentType } from 'preact';

const TEXTS = {
  it: ['Questa sezione non si è caricata per un errore.', 'Ricarica', 'Segnala errore'],
  en: ['This section failed to load because of an error.', 'Reload', 'Report error'],
};

/** Testo dell'errore per console e segnalazione: motivo, build, messaggio. */
export const errorText = (error: unknown, reason?: string): string =>
  `${reason ? `[${reason} · ${__SH_BUILD__.commit}] ` : ''}${String((error as Error | undefined)?.message ?? error)}`;

/** Link al modulo Contribuisci con tipo «errore», pagina, corso e messaggio. */
export function reportHref(loc: Pick<Location, 'pathname'>, base: string, error: unknown): string {
  const rest = loc.pathname.startsWith(base)
    ? loc.pathname.slice(base.length)
    : loc.pathname.replace(/^\//, '');
  const lang = rest.startsWith('en/') ? 'en' : 'it';
  const page = `/${rest.replace(/^(it|en)\//, '').replace(/\/$/, '')}`;
  const course = /^anno-\d+\/([^/]+)/.exec(page.slice(1))?.[1];
  const q = new URLSearchParams({ tipo: 'errore', pagina: page, ...(course ? { corso: course } : {}) });
  q.set('messaggio', String((error as Error | undefined)?.message ?? error).slice(0, 300));
  return `${base}${lang}/contribuisci/?${q}`;
}

interface State {
  error?: unknown;
  /** Controllo della versione in corso: niente riquadro (la pagina potrebbe ricaricarsi). */
  pending?: boolean;
}

interface Recovery {
  reload: boolean;
  reason: string;
}

export function withBoundary<P extends object>(Inner: ComponentType<P>): ComponentType<P> {
  return class IslandBoundary extends Component<P, State> {
    override componentDidCatch(error: unknown) {
      console.error(error);
      const detail: { pending?: Promise<Recovery> } = {};
      dispatchEvent(new CustomEvent('sh:island-error', { detail }));
      const show = (reason?: string) => {
        const text = errorText(error, reason);
        if (reason) console.error(text);
        this.setState({ error: text, pending: false });
      };
      if (!detail.pending) return show();
      this.setState({ error, pending: true });
      detail.pending.then(
        (r) => !r.reload && show(r.reason),
        () => show(),
      );
    }
    override render(props: P, state: State) {
      if (!('error' in state)) return h(Inner, props);
      if (state.pending) return null;
      const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
      const [msg, reload, report] = TEXTS[document.documentElement.lang.startsWith('en') ? 'en' : 'it'];
      return h(
        'div',
        { class: 'sh-alert sh-alert--danger', role: 'alert', 'data-island-error': '' },
        h('p', null, msg),
        h(
          'p',
          { class: 'btn-row' },
          h(
            'button',
            {
              type: 'button',
              class: 'btn btn--sm',
              // Senza pwa.ts (che annulla l'evento) si ricarica e basta.
              onClick: () =>
                dispatchEvent(new Event('sh:hard-reload', { cancelable: true })) && location.reload(),
            },
            reload,
          ),
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
