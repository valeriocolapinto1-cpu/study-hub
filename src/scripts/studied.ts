/**
 * «Segna come studiato» (R13), senza isole: lo scarica site.ts solo nelle pagine di un corso con
 * elementi `data-studied-*`. Legge l'area `studied` del corso (`<html data-course>`) e aggiorna:
 * - `[data-studied-mark="<argomento>"]`: spunta (`data-studied`) e testo per i lettori di schermo
 *   (`data-studied-label` sul contenitore più vicino);
 * - `[data-chapter-ids]`: «n/totale argomenti» in `[data-chapter-count]` (modello `data-t`), la
 *   frazione studiata in `--studied` (barra dei capitoli della panoramica) e il pulsante
 *   `[data-studied-chapter]` (segna o annulla tutto il capitolo);
 * - `[data-studied-toggle]`: pulsante in fondo alla teoria, con invito dopo ~80 % della lettura.
 */
import { subscribe } from '../engine/storage';
import { STUDIED_AREA, isStudied, loadStudied, saveStudied } from '../engine/studied';

const course = document.documentElement.dataset.course ?? '';
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => [
  ...root.querySelectorAll<T>(sel),
];
const fill = (s = '', p: Record<string, number>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => String(p[k] ?? m));
const ids = (el: HTMLElement) => (el.dataset.chapterIds ?? '').split(' ').filter(Boolean);

const toggle = document.querySelector<HTMLButtonElement>('[data-studied-toggle]');
const status = document.querySelector<HTMLElement>('[data-studied-status]');
const hint = document.querySelector<HTMLElement>('[data-studied-hint]');
let hintClosed = false;
let studiedNow = false;

function render(): void {
  const s = loadStudied(course);
  const on = (id: string) => isStudied(s, id);
  for (const el of $$('[data-studied-mark]')) {
    const yes = on(el.dataset.studiedMark!);
    el.toggleAttribute('data-studied', yes);
    let mark = el.querySelector(':scope > .studied-mark');
    if (yes && !mark) {
      mark = document.createElement('span');
      mark.className = 'studied-mark visually-hidden';
      mark.textContent = ` (${el.closest<HTMLElement>('[data-studied-label]')?.dataset.studiedLabel ?? '✓'})`;
      (el.querySelector('a') ?? el).append(mark);
    } else if (!yes) el.querySelector('.studied-mark')?.remove();
  }
  for (const ch of $$('[data-chapter-ids]')) {
    const list = ids(ch);
    const n = list.filter(on).length;
    const done = list.length > 0 && n === list.length;
    ch.toggleAttribute('data-studied', done);
    ch.style.setProperty('--studied', String(list.length ? n / list.length : 0));
    const count = ch.querySelector<HTMLElement>('[data-chapter-count]');
    if (count) count.textContent = fill(count.dataset.t, { n, total: list.length });
    const btn = ch.querySelector<HTMLButtonElement>('[data-studied-chapter]');
    if (btn) {
      btn.textContent = (done ? btn.dataset.labelOn : btn.dataset.labelOff) ?? '';
      btn.hidden = false;
    }
  }
  if (toggle) {
    studiedNow = on(toggle.dataset.studiedToggle!);
    toggle.textContent = (studiedNow ? toggle.dataset.labelOn : toggle.dataset.labelOff) ?? '';
    toggle.classList.toggle('btn--primary', !studiedNow);
    const state = document.querySelector('[data-studied-state]');
    if (state) state.textContent = (studiedNow ? toggle.dataset.stateOn : toggle.dataset.stateOff) ?? '';
    toggle.closest('.studied-box')?.toggleAttribute('data-studied', studiedNow);
    if (studiedNow && hint) hint.hidden = true;
  }
}

function mark(topicIds: string[], on: boolean): void {
  saveStudied(course, topicIds, on, Date.now());
  render();
}

toggle?.addEventListener('click', () => {
  const on = !studiedNow;
  mark([toggle.dataset.studiedToggle!], on);
  if (status) status.textContent = (on ? toggle.dataset.saidOn : toggle.dataset.saidOff) ?? '';
});

document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest?.<HTMLButtonElement>('[data-studied-chapter]');
  const ch = btn?.closest<HTMLElement>('[data-chapter-ids]');
  if (!btn || !ch) return;
  const list = ids(ch);
  const s = loadStudied(course);
  mark(list, !list.every((id) => isStudied(s, id)));
  btn.focus();
});

// Invito dopo circa l'80 % della lettura, finché il pulsante in fondo non è in vista.
if (toggle && hint) {
  const article = document.querySelector<HTMLElement>('article.prose') ?? document.body;
  let boxVisible = false;
  new IntersectionObserver(([e]) => {
    boxVisible = !!e?.isIntersecting;
    check();
  }).observe(toggle);
  let queued = false;
  function check(): void {
    queued = false;
    const r = article.getBoundingClientRect();
    const read = r.height > 0 ? (innerHeight - r.top) / r.height : 1;
    hint!.hidden = hintClosed || studiedNow || boxVisible || read < 0.8;
  }
  addEventListener(
    'scroll',
    () => {
      if (!queued) requestAnimationFrame(check);
      queued = true;
    },
    { passive: true },
  );
  hint.querySelector('[data-studied-hint-mark]')?.addEventListener('click', () => {
    toggle.click();
    hint.hidden = true;
    toggle.focus();
  });
  hint.querySelector('[data-studied-hint-close]')?.addEventListener('click', () => {
    hintClosed = true;
    hint.hidden = true;
  });
}

render();
// Altre schede, importazioni e migrazioni (progress.read) aggiornano la pagina.
subscribe(course, STUDIED_AREA, render);
subscribe(course, 'progress', render);
