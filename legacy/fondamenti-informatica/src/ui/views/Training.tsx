import type { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { diagrams, diagramById, type Diagram } from '~/content/diagrams';
import { cp2Drill, loopDrill, mulCmpDrill, shiftDrill, sumDrill, type Drill } from '~/engine/drills';
import { judgeSop } from '~/engine/parseSop';
import { minimalCover, sopToString, varNames } from '~/engine/boolean';
import { mulberry32, randInt, randomSeed, shuffle } from '~/engine/rng';
import { hrefFor } from '~/lib/router';
import { Converters } from '~/ui/components/Converters';
import { DrillRunner } from '~/ui/components/DrillRunner';
import { checkDiagram, countCorrect, DiagramQuiz, type DiagramPicks } from '~/ui/components/DiagramQuiz';
import { Rich } from '~/ui/components/Rich';
import { TruthTable } from '~/ui/components/TruthTable';

/* ─────────────────────────── palestra 1 · binario ─────────────────────────── */

type BinKind = 'cp2' | 'sum';

/** Parametri dell'esercizio, derivati dal seme: rigenerare è cambiare seme. */
function binaryDrill(kind: BinKind, seed: number): Drill {
  const rng = mulberry32(seed);
  const bits = randInt(rng, 0, 3) === 0 ? 4 : 8;
  const limit = 2 ** (bits - 1);

  if (kind === 'cp2') {
    // Due negativi su tre: è lì che serve il procedimento.
    const magnitude = randInt(rng, 1, limit - 1);
    const negative = randInt(rng, 0, 2) > 0;
    return cp2Drill(negative ? -magnitude : magnitude, bits);
  }

  const a = randInt(rng, -limit, limit - 1);
  const b = randInt(rng, -limit, limit - 1);
  return sumDrill(a, b, bits);
}

function BinaryGym(): JSX.Element {
  const [kind, setKind] = useState<BinKind>('cp2');
  const [seed, setSeed] = useState(() => randomSeed());
  const drill = useMemo(() => binaryDrill(kind, seed), [kind, seed]);

  return (
    <div class="gym">
      <p class="lead">
        Il conto non lo fa il sito: lo fai tu, e ogni passaggio viene corretto per conto suo. Se
        sbagli l'inversione dei bit lo scopri al passo 2, non guardando un risultato finale che non
        torna.
      </p>
      <div class="btn-row">
        <button
          type="button"
          class={`btn ${kind === 'cp2' ? 'primary' : 'ghost'} mini`}
          aria-pressed={kind === 'cp2'}
          onClick={() => setKind('cp2')}
        >
          Complemento a 2
        </button>
        <button
          type="button"
          class={`btn ${kind === 'sum' ? 'primary' : 'ghost'} mini`}
          aria-pressed={kind === 'sum'}
          onClick={() => setKind('sum')}
        >
          Somma con i flag
        </button>
        <button type="button" class="btn ghost mini" onClick={() => setSeed(randomSeed())}>
          Nuovo esercizio ↻
        </button>
      </div>
      {/* La chiave rimonta il componente: risposte e suggerimenti aperti
          spariscono quando cambia l'esercizio. */}
      <DrillRunner key={`${kind}-${seed}`} drill={drill} />
      <Converters />
    </div>
  );
}

/* ─────────────────────────── palestra 2 · schemi ─────────────────────────── */

/** Etichette giuste più distrattori, mescolate una volta per esercizio. */
function optionsFor(diagram: Diagram, seed: number): string[] {
  const rng = mulberry32(seed);
  return shuffle(rng, [...diagram.slots.map((slot) => slot.label), ...diagram.distractors]);
}

function DiagramGym({ initial }: { initial: string | null }): JSX.Element {
  const first = (initial && diagramById(initial)) || (diagrams[0] as Diagram);
  const [current, setCurrent] = useState<Diagram>(first);
  const [seed, setSeed] = useState(() => randomSeed());
  const [picks, setPicks] = useState<DiagramPicks>({});
  const [checked, setChecked] = useState(false);

  const options = useMemo(() => optionsFor(current, seed), [current, seed]);
  const verdict = checked ? checkDiagram(current, picks) : undefined;
  const right = verdict ? countCorrect(verdict) : 0;

  const restart = (diagram: Diagram): void => {
    setCurrent(diagram);
    setPicks({});
    setChecked(false);
    setSeed(randomSeed());
  };

  return (
    <div class="gym">
      <p class="lead">
        Ricevi il disegno con alcune etichette mancanti e l'elenco di quelle da collocare — con
        qualche etichetta in più che non va da nessuna parte. Riconoscere un blocco fuori
        contesto è diverso dal riconoscerlo mentre lo leggi in un capitolo: la correzione è
        immediata.
      </p>

      {/* Gli schemi sono quarantacinque: una tendina, non una fila di bottoni. */}
      <div class="field">
        <label for="dg-pick">Schema</label>
        <select
          id="dg-pick"
          style="max-width:min(420px,100%)"
          value={current.id}
          onChange={(event) => {
            const chosen = diagramById((event.target as HTMLSelectElement).value);
            if (chosen) restart(chosen);
          }}
        >
          {diagrams.map((diagram) => (
            <option key={diagram.id} value={diagram.id}>
              {diagram.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          class="btn ghost mini"
          onClick={() => restart(diagrams[Math.floor(Math.random() * diagrams.length)] as Diagram)}
        >
          A caso ↻
        </button>
        <span class="fn">{diagrams.length} schemi</span>
      </div>

      <DiagramQuiz
        diagram={current}
        options={options}
        picks={picks}
        onPick={(slotId, label) => {
          setPicks((prev) => ({ ...prev, [slotId]: label }));
          setChecked(false);
        }}
        verdict={verdict}
        locked={checked}
      />

      <div class="btn-row">
        <button type="button" class="btn primary" onClick={() => setChecked(true)}>
          Correggi
        </button>
        <button type="button" class="btn ghost" onClick={() => restart(current)}>
          Rifai da capo
        </button>
        <a class="btn ghost" href={hrefFor('ref')}>
          Vedi lo schema completo
        </a>
      </div>

      {verdict && (
        <div class={`verdict ${right === current.slots.length ? 'ok' : 'no'}`}>
          {right} etichette giuste su {current.slots.length}
          {right < current.slots.length && ' — quelle sbagliate mostrano la risposta accanto.'}
        </div>
      )}
    </div>
  );
}

/* ──────────────────── palestra 3 · verità e Karnaugh ──────────────────── */

interface LogicExercise {
  vars: number;
  onSet: Set<number>;
  dontCares: Set<number>;
}

/**
 * Funzione casuale non banale: né sempre 0 né sempre 1, e con qualche
 * indifferenza, perché è lì che la mappa di Karnaugh guadagna qualcosa.
 */
function logicExercise(seed: number): LogicExercise {
  const rng = mulberry32(seed);
  const vars = randInt(rng, 0, 1) === 0 ? 3 : 4;
  const cells = 1 << vars;

  const onSet = new Set<number>();
  const dontCares = new Set<number>();
  for (let m = 0; m < cells; m++) {
    const roll = rng();
    if (roll < 0.42) onSet.add(m);
    else if (roll < 0.52) dontCares.add(m);
  }
  // Una funzione costante non insegna nulla: si rigenera con il seme dopo.
  if (onSet.size === 0 || onSet.size === cells) return logicExercise(seed + 1);
  return { vars, onSet, dontCares };
}

function LogicGym(): JSX.Element {
  const [seed, setSeed] = useState(() => randomSeed());
  const [text, setText] = useState('');
  const [showSolution, setShowSolution] = useState(false);

  const exercise = useMemo(() => logicExercise(seed), [seed]);
  const { vars, onSet, dontCares } = exercise;
  const names = varNames(vars);

  const rows = useMemo(
    () =>
      Array.from({ length: 1 << vars }, (_, m) => ({
        in: Array.from({ length: vars }, (_, i) => (m >> (vars - 1 - i)) & 1),
        out: (dontCares.has(m) ? 'x' : onSet.has(m) ? 1 : 0) as 0 | 1 | 'x',
      })),
    [exercise],
  );

  const verdict = judgeSop(text, onSet, dontCares, vars);
  const solution = useMemo(() => sopToString(minimalCover(onSet, dontCares, vars), vars), [exercise]);

  const restart = (): void => {
    setSeed(randomSeed());
    setText('');
    setShowSolution(false);
  };

  const counter = verdict.counterExample;

  return (
    <div class="gym">
      <p class="lead">
        Dalla tabella all'espressione, come nel quesito «sintesi di rete combinatoria». La risposta
        non viene autovalutata: viene <b>letta e verificata</b> su tutte le combinazioni, e
        confrontata con la SOP minima esatta. Quindi scoprirai anche se è giusta ma si poteva fare
        con meno termini.
      </p>

      <div class="btn-row">
        <button type="button" class="btn ghost mini" onClick={restart}>
          Nuova funzione ↻
        </button>
      </div>

      <TruthTable
        vars={names}
        rows={rows}
        caption={`Y(${names.join(', ')})${dontCares.size ? ' — x = indifferenza' : ''}`}
      />

      <div class="field" style="margin-top:12px">
        <label for="sop">Y =</label>
        <input
          id="sop"
          type="text"
          style="width:min(340px,100%)"
          autocomplete="off"
          spellcheck={false}
          placeholder="es. A'B + CD"
          value={text}
          onInput={(event) => setText((event.target as HTMLInputElement).value)}
        />
      </div>
      <p class="fn">
        Scrivi come ti viene: <code>A'B + C</code>, <code>ĀB + C</code>, <code>!A·B + C</code> sono
        la stessa espressione. Il prodotto si può anche solo giustapporre.
      </p>

      {verdict.status !== 'empty' && (
        <div
          class={`verdict ${verdict.status === 'minimal' || verdict.status === 'correct' ? 'ok' : 'no'}`}
        >
          {verdict.status === 'error' ? `Non riesco a leggerla: ${verdict.message}` : verdict.message}
          {counter && (
            <div class="fn" style="margin-top:6px">
              Controesempio: {names.map((name, i) => `${name}=${(counter.minterm >> (vars - 1 - i)) & 1}`).join(', ')} → la
              funzione vale {counter.expected}, la tua espressione {counter.got}.
            </div>
          )}
        </div>
      )}

      <div class="btn-row">
        <button
          type="button"
          class="btn ghost mini"
          onClick={() => setShowSolution((on) => !on)}
        >
          {showSolution ? 'Nascondi una forma minima' : 'Mostra una forma minima'}
        </button>
      </div>
      {showSolution && (
        <p class="step-hint">
          Una SOP minima: Y = <Rich as="span" html={solution} />. Non è detto sia l'unica: a pari
          numero di termini e letterali possono essercene diverse, tutte accettabili.
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────── palestra 4 · assembly ─────────────────────────── */

function asmDrill(seed: number): Drill {
  const rng = mulberry32(seed);
  const which = randInt(rng, 0, 2);
  if (which === 0) {
    const step = randInt(rng, 2, 7);
    return loopDrill({ start: randInt(rng, 3, 12) * step + randInt(rng, 0, step - 1), step });
  }
  if (which === 1) {
    const a = randInt(rng, 2, 12);
    const b = randInt(rng, 2, 12);
    // Metà delle volte il confronto riesce: così il salto non è sempre lo stesso.
    const cmp = randInt(rng, 0, 1) === 0 ? a * b : a * b + randInt(rng, 1, 9);
    return mulCmpDrill({ a, b, cmp, add: randInt(rng, 1, 9) });
  }
  return shiftDrill({
    value: randInt(rng, 3, 40),
    left: randInt(rng, 1, 4),
    right: randInt(rng, 1, 3),
  });
}

function AsmGym(): JSX.Element {
  const [seed, setSeed] = useState(() => randomSeed());
  const drill = useMemo(() => asmDrill(seed), [seed]);

  return (
    <div class="gym">
      <p class="lead">
        Esegui il codice a mente e dichiara i valori intermedi, non solo il risultato. Le risposte
        attese non sono scritte a mano: vengono dal simulatore che gira sugli stessi parametri con
        cui è stampato il listato, quindi codice e soluzione non possono divergere.
      </p>
      <div class="btn-row">
        <button type="button" class="btn ghost mini" onClick={() => setSeed(randomSeed())}>
          Nuovo programma ↻
        </button>
      </div>
      <DrillRunner key={seed} drill={drill} />
    </div>
  );
}

/* ─────────────────────────────── la vista ─────────────────────────────── */

const GYMS = [
  { id: 'bin', label: 'Binario a mano', desc: 'Complemento a 2 e somme, passo per passo.' },
  { id: 'schemi', label: 'Schemi', desc: 'Il «completa l’immagine» che esce sempre.' },
  { id: 'logica', label: 'Verità & Karnaugh', desc: 'Dalla tabella alla SOP minima.' },
  { id: 'asm', label: 'Assembly', desc: 'Esecuzione a mente, registro per registro.' },
] as const;

type GymId = (typeof GYMS)[number]['id'];

function isGymId(value: string): value is GymId {
  return GYMS.some((gym) => gym.id === value);
}

export function Training({ focus }: { focus: string | null }): JSX.Element {
  // Il parametro di rotta può essere una palestra (#/train/logica) o
  // direttamente uno schema (#/train/cache-set-associativa), come fa il
  // bottone «esercitati» della pagina Riferimenti.
  const fromRoute: GymId | null = focus
    ? isGymId(focus)
      ? focus
      : diagramById(focus)
        ? 'schemi'
        : null
    : null;
  const [active, setActive] = useState<GymId>(fromRoute ?? 'bin');

  return (
    <section class="view">
      <p class="eyebrow">Palestra</p>
      <h1 class="h">Allenamento</h1>
      <p class="lead">
        Quattro esercizi che ricalcano i quesiti della prova. Nessuno dà il risultato: tutti fanno
        fare il procedimento e lo correggono passo per passo.
      </p>

      <div class="gym-tabs" role="tablist" aria-label="Scegli l'esercizio">
        {GYMS.map((gym) => (
          <button
            key={gym.id}
            type="button"
            role="tab"
            aria-selected={gym.id === active}
            class={`gym-tab${gym.id === active ? ' on' : ''}`}
            onClick={() => setActive(gym.id)}
          >
            <span class="gt-l">{gym.label}</span>
            <span class="gt-d">{gym.desc}</span>
          </button>
        ))}
      </div>

      {active === 'bin' && <BinaryGym />}
      {active === 'schemi' && <DiagramGym initial={focus} />}
      {active === 'logica' && <LogicGym />}
      {active === 'asm' && <AsmGym />}
    </section>
  );
}
