/**
 * Cornice comune delle figure interattive: titolo, comandi, figura SVG
 * (ridisegnata dagli stessi disegnatori del build) e una riga di lettura.
 */
import type { ComponentChildren } from 'preact';
import '../../sim/sim.css';
import '../figures.css';

export function LiveFrame(p: { id: string; title: string; svg: string; readout?: string; children: ComponentChildren }): preact.JSX.Element {
  return (
    <section class="sim" aria-labelledby={p.id}>
      <h3 class="sim__title" id={p.id}>
        {p.title}
      </h3>
      <div class="sim__panel">{p.children}</div>
      {/* contenuto fidato: SVG generato dal kit, con title/desc */}
      <div class="diagram-live__figure" dangerouslySetInnerHTML={{ __html: p.svg }} />
      {p.readout !== undefined && (
        <p class="sim-readout" aria-live="polite">
          {p.readout}
        </p>
      )}
    </section>
  );
}

export const deg = (lang: 'it' | 'en', v: number): string => `${(Math.round(v * 10) / 10).toString().replace('.', lang === 'it' ? ',' : '.')}°`;
export const fix = (lang: 'it' | 'en', v: number, d = 2): string => {
  const s = (Math.abs(v) < 5e-4 ? 0 : v).toFixed(d).replace('-', '−');
  return lang === 'it' ? s.replace('.', ',') : s;
};
