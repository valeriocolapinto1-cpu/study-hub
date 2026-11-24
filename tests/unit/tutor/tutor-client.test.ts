// @vitest-environment jsdom
/**
 * Pannello del tutor, parti pure: contesto dal DOM (formule in TeX), soluzione dai dati,
 * lettura dello stream SSE, cronologia nel browser.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import katex from 'katex';
import {
  cardContext,
  clip,
  courseOutline,
  domToText,
  exerciseContext,
  exerciseSolution,
  theoryContext,
} from '../../../src/scripts/tutor/context';
import { parseBlock, readEvents } from '../../../src/scripts/tutor/sse';
import { MAX_TURNS, loadChat, outgoing, saveChat } from '../../../src/scripts/tutor/history';
import type { ExerciseData } from '../../../src/engine/course-data';

const tex = (s: string, display = false) =>
  katex.renderToString(s, { displayMode: display, output: 'htmlAndMathml', throwOnError: false });

const html = (s: string) => {
  const box = document.createElement('div');
  box.innerHTML = s;
  document.body.replaceChildren(box);
  return box;
};

describe('domToText', () => {
  it('rimette le formule KaTeX in TeX e tiene i blocchi', () => {
    const el = html(
      `<p>Legge di Ohm: ${tex('V = R I')}.</p><div class="katex-display">${tex('\\tau = RC', true)}</div><ul><li>uno</li><li>due</li></ul>`,
    );
    expect(domToText(el)).toBe('Legge di Ohm: $V = R I$.\n\n$$\\tau = RC$$\n\n- uno\n\n- due');
  });

  it('toglie pulsanti, SVG, testi nascosti e conserva i blocchi di codice', () => {
    const el = html(
      '<p>A<button>Appunto</button><svg><text>R1</text></svg><span class="sh-visually-hidden">x</span></p><pre>int  a;\n  b;</pre>',
    );
    expect(domToText(el)).toBe('A\n\n```\nint  a;\n  b;\n```');
  });

  it('KaTeX senza MathML (dati delle isole, katex-lite): TeX dall’aria-label', () => {
    const el = html(
      '<p><span class="katex" role="img" aria-label="V = R I"><span class="katex-html" aria-hidden="true">VRI</span></span> V</p>',
    );
    expect(domToText(el)).toBe('$V = R I$ V');
  });

  it('clip taglia con i puntini', () => {
    expect(clip('abcdef', 4)).toBe('abc…');
    expect(clip('abc', 4)).toBe('abc');
  });
});

describe('contesto di un esercizio', () => {
  const article = () =>
    html(`<article id="e1" class="sh-exercise">
      <header><h2 class="sh-exercise__title">Esercizio 1</h2><ul class="sh-tags"><li>Facile</li></ul></header>
      <div class="sh-exercise__statement prose"><p>Calcola ${tex('I')} con ${tex('R = 10\\,\\Omega')}.</p></div>
      <div class="sh-fields"><div class="sh-field"><label for="f">Corrente ${tex('I')}</label>
        <div class="sh-field__row"><input id="f" class="sh-input" value="0,5"><span class="sh-field__unit">A</span></div></div></div>
      <div class="sh-live"><p class="sh-result">Sbagliato</p></div>
    </article>`).firstElementChild!;

  it('enunciato, campi, risposta dello studente ed esito', () => {
    const c = exerciseContext(article());
    expect(c.title).toBe('Esercizio 1');
    expect(c.text).toContain('Calcola $I$ con $R = 10\\,\\Omega$.');
    expect(c.text).toContain('- Corrente $I$ [A]');
    expect(c.answer).toBe(
      'Corrente $I$ = 0,5 A\nEsito della correzione automatica / Automatic check: Sbagliato',
    );
  });

  it('scelte multiple: alternative senza spiegazioni e scelta fatta', () => {
    const el =
      html(`<article><div class="sh-exercise__statement"><p>Quale?</p></div><fieldset class="sh-choices">
      <label class="sh-choice"><input type="radio">Prima<span class="sh-choice__why">perché</span></label>
      <label class="sh-choice"><input type="radio" checked>Seconda</label></fieldset></article>`).firstElementChild!;
    const c = exerciseContext(el);
    expect(c.text).toContain('A. Prima');
    expect(c.text).not.toContain('perché');
    expect(c.answer).toBe('B (scelta / chosen)');
  });

  it('soluzione dai dati; nei generati solo per la variante pregenerata', () => {
    const ex = {
      id: 'e1',
      kind: 'static',
      statementHtml: '<p>Calcola I</p>',
      steps: [{ titleHtml: 'Ohm', bodyHtml: `<p>${tex('I = V/R')}</p>` }],
      answer: [{ label: 'I', value: 0.5, unit: 'A' }],
      choices: [
        { html: 'a', correct: false },
        { html: 'b', correct: true },
      ],
    } as unknown as ExerciseData;
    const s = exerciseSolution(ex, 'qualunque')!;
    expect(s).toContain('1. Ohm\n$I = V/R$');
    expect(s).toContain('- I = 0.5 A');
    expect(s).toContain('B');
    const gen = { ...ex, kind: 'generated' } as ExerciseData;
    expect(exerciseSolution(gen, 'Calcola I')).toBeDefined();
    expect(exerciseSolution(gen, 'Calcola V')).toBeUndefined();
  });
});

describe('scheda e teoria', () => {
  it('scheda: fronte e retro (solo se girata)', () => {
    const root = html(`<div class="sh-flashcard"><p class="sh-flashcard__meta"><span>Formula</span></p>
      <div class="sh-flashcard__face"><div class="prose"><p>Fronte ${tex('x')}</p></div></div></div>`);
    expect(cardContext(root)).toEqual({ kind: 'card', title: 'Formula', text: 'Fronte $x$' });
    root
      .querySelector('.sh-flashcard')!
      .insertAdjacentHTML(
        'beforeend',
        '<div class="sh-flashcard__face sh-flashcard__back"><div class="prose"><p>Retro</p></div></div>',
      );
    expect(cardContext(root)?.solution).toBe('Retro');
    expect(cardContext(html('<p>niente</p>'))).toBeNull();
  });

  it('teoria: testo selezionato, altrimenti la sezione in vista', () => {
    const art = html(
      `<article class="prose"><h2>Primo</h2><p>Uno ${tex('a')}</p><h2>Secondo</h2><p>Due</p></article>`,
    ).firstElementChild!;
    const [h1, , h2] = [...art.children] as HTMLElement[];
    h1!.getBoundingClientRect = () => ({ top: -500 }) as DOMRect;
    h2!.getBoundingClientRect = () => ({ top: 2000 }) as DOMRect;
    expect(theoryContext(art, 'Pagina')).toEqual({
      kind: 'theory',
      title: 'Pagina — Primo',
      text: 'Uno $a$',
    });
    h2!.getBoundingClientRect = () => ({ top: 10 }) as DOMRect;
    expect(theoryContext(art, 'Pagina').text).toBe('Due');
    const range = document.createRange();
    range.selectNodeContents(art.children[1]!);
    getSelection()!.removeAllRanges();
    getSelection()!.addRange(range);
    expect(theoryContext(art, 'Pagina')).toMatchObject({ title: 'Pagina', text: 'Uno $a$' });
    getSelection()!.removeAllRanges();
  });

  it('scaletta del corso: obiettivi in TeX, solo titoli se troppo lunga', () => {
    const topics = [
      { title: 'Ohm', group: 'Basi', objectives: [{ text: 'V = RI', tex: '$V = RI$' }, { text: 'b' }] },
    ];
    expect(courseOutline({ topics })).toBe('1. Ohm (Basi): $V = RI$; b');
    const many = Array.from({ length: 50 }, (_, i) => ({
      title: `T${i}`,
      objectives: [{ text: 'x'.repeat(200) }],
    }));
    expect(courseOutline({ topics: many }).startsWith('1. T0\n2. T1')).toBe(true);
  });
});

describe('SSE', () => {
  it('blocchi data: JSON, ignora righe estranee e JSON rotto', () => {
    expect(parseBlock('data: {"type":"text","text":"a"}')).toEqual({ type: 'text', text: 'a' });
    expect(parseBlock(': commento')).toBeNull();
    expect(parseBlock('data: {rotto')).toBeNull();
  });

  it('ricompone eventi spezzati fra pezzi dello stream (anche CRLF)', async () => {
    const chunks = [
      'data: {"type":"te',
      'xt","text":"Ci"}\r\n\r\ndata: {"type":"text","text":"ao"}\n',
      '\ndata: {"type":"done","stop":"end_turn"}',
    ];
    const enc = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        for (const ch of chunks) c.enqueue(enc.encode(ch));
        c.close();
      },
    });
    const out = [];
    for await (const e of readEvents(body)) out.push(e);
    expect(out).toEqual([
      { type: 'text', text: 'Ci' },
      { type: 'text', text: 'ao' },
      { type: 'done', stop: 'end_turn' },
    ]);
  });
});

describe('cronologia', () => {
  beforeEach(() => localStorage.clear());

  it('salva per corso e contesto, limita turni e conversazioni', () => {
    const msgs = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 ? ('assistant' as const) : ('user' as const),
      content: `m${i}`,
    }));
    saveChat('c', 'ex:1', msgs, 1);
    expect(loadChat('c', 'ex:1')).toHaveLength(MAX_TURNS);
    expect(loadChat('altro', 'ex:1')).toEqual([]);
    for (let i = 0; i < 35; i++) saveChat('c', `k${i}`, [{ role: 'user', content: 'x' }], 10 + i);
    const stored = JSON.parse(localStorage.getItem('sh:tutor:c')!);
    expect(Object.keys(stored.chats)).toHaveLength(30);
    expect(stored.chats['ex:1']).toBeUndefined();
    saveChat('c', 'k34', []);
    expect(loadChat('c', 'k34')).toEqual([]);
    localStorage.setItem('sh:tutor:c', '{rotto');
    expect(loadChat('c', 'k1')).toEqual([]);
  });

  it('messaggi in uscita: coppie complete, poi la domanda (sempre dallo studente)', () => {
    const u = (c: string) => ({ role: 'user' as const, content: c });
    const a = (c: string) => ({ role: 'assistant' as const, content: c });
    expect(outgoing([], 'q')).toEqual([u('q')]);
    expect(outgoing([a('x'), u('1'), a('2'), u('orfano')], 'q')).toEqual([u('1'), a('2'), u('q')]);
    const long = Array.from({ length: 40 }, (_, i) => (i % 2 ? a(`${i}`) : u(`${i}`)));
    const out = outgoing(long, 'q');
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out[0]!.role).toBe('user');
  });
});
