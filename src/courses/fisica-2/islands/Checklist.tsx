/**
 * Elenco di voci spuntabili salvate in locale (`sh:v1:<scope>:<area>`, oggetto `{ id: true }`).
 * Usato per le lezioni (Panoramica), le relazioni di laboratorio e gli appelli: stesso formato
 * delle spunte del sito originale, migrate da src/courses/fisica-2/migrations.ts.
 * I testi arrivano dalle props (nessun dizionario nel bundle).
 */
import { useEffect, useState } from 'preact/hooks';
import { read, subscribe, write } from '../../../engine/storage';
import './checklist.css';

export interface ChecklistItem {
  id: string;
  label: string;
  /** Testo secondario (es. tipo di lezione). */
  meta?: string;
  href?: string;
}
export interface ChecklistGroup {
  id: string;
  title?: string;
  items: ChecklistItem[];
}
interface Props {
  scope: string;
  area: string;
  groups: ChecklistGroup[];
  /** "{done} di {total}" */
  progressLabel: string;
  /** Etichetta accessibile dell'elenco. */
  label: string;
  /** Titoli dei gruppi come h3 (default) o h4. */
  headingLevel?: 3 | 4;
}
type State = Record<string, true>;

const load = (scope: string, area: string): State => {
  const v = read<unknown>(scope, area, {});
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  return Object.fromEntries(
    Object.entries(v as Record<string, unknown>).filter(([, x]) => x === true),
  ) as State;
};

export default function Checklist({ scope, area, groups, progressLabel, label, headingLevel = 3 }: Props) {
  const [state, setState] = useState<State>({});
  useEffect(() => {
    setState(load(scope, area));
    return subscribe(scope, area, () => setState(load(scope, area)));
  }, [scope, area]);
  const all = groups.flatMap((g) => g.items);
  const done = all.filter((i) => state[i.id]).length;
  const toggle = (id: string, on: boolean) => {
    const next = { ...load(scope, area) };
    if (on) next[id] = true;
    else delete next[id];
    write(scope, area, next);
    setState(next);
  };
  const H = headingLevel === 4 ? 'h4' : 'h3';
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  return (
    <div class="f2-checklist" role="group" aria-label={label}>
      <div class="progress" aria-live="polite">
        <div class="progress__head">
          <span>{label}</span>
          <span>{progressLabel.replace('{done}', String(done)).replace('{total}', String(all.length))}</span>
        </div>
        <div class="progress__bar" aria-hidden="true">
          <div class="progress__fill" style={{ '--value': pct }} />
        </div>
      </div>
      {groups.map((g) => (
        <section
          key={g.id}
          class="f2-checklist__group"
          aria-labelledby={g.title ? `cl-${area}-${g.id}` : undefined}
        >
          {g.title && <H id={`cl-${area}-${g.id}`}>{g.title}</H>}
          <ul class="f2-checklist__list">
            {g.items.map((it) => (
              <li key={it.id} data-done={state[it.id] ? '' : undefined}>
                <label class="check">
                  <input
                    type="checkbox"
                    checked={!!state[it.id]}
                    onChange={(e) => toggle(it.id, e.currentTarget.checked)}
                  />
                  <span>
                    {it.label}
                    {it.meta && <span class="badge f2-checklist__meta">{it.meta}</span>}
                  </span>
                </label>
                {it.href && (
                  <a class="f2-checklist__link" href={it.href}>
                    →<span class="visually-hidden"> {it.label}</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
