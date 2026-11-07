# Kit dei simulatori e dei circuiti

Guida per le PR di corso: come descrivere un circuito (netlist), come ottenerne lo schema e le soluzioni,
come costruire una simulazione interattiva con i componenti comuni. In fondo, l'inventario delle
simulazioni dei siti originali con i pezzi del kit che servono a rifarle.

Figure fisiche e schemi non circuitali (forze, piani inclinati, campi, cicli pV, onde, strutture dati…): kit delle
figure, [FIGURE.md](FIGURE.md).

Pagine di prova (non indicizzate): `/<lang>/stile/circuiti/` (schemi e grafici statici, zero JS) e
`/<lang>/stile/simulatori/` (isole interattive).

## Mappa dei moduli

| Modulo | Cosa contiene | Dove gira |
|---|---|---|
| `src/sim/circuits/netlist.ts` | schema **Zod** della netlist (`Netlist`, `Element`, …), `parseNetlist()` | build-time, test, content collections |
| `src/sim/circuits/model.ts` | tipi normalizzati, `normalizeNetlist()` senza Zod, `terminals()`, `nodesOf()` | ovunque (anche nel browser) |
| `src/sim/circuits/mna.ts` | `dc`, `ac`, `steadyState`, `thevenin`/`norton`, `maxPower`, `transfer`, `sweep`, `transient`, `firstOrder` | ovunque |
| `src/sim/circuits/schematic.ts` | `renderSchematic()` → SVG, `describeCircuit()` → testo per lettori di schermo | ovunque (puro, senza DOM) |
| `src/sim/circuits/complex.ts`, `linalg.ts` | numeri complessi, LU complessa | ovunque |
| `src/sim/circuits/examples.ts` | circuiti di esempio (pagine demo, test) | — |
| `src/sim/Circuit.astro` | `<Circuit netlist lang caption? />`: schema a build-time, **zero JS** | Astro |
| `src/sim/Plot.tsx` | `Plot`, `BodePlot` | SSR statico o isola |
| `src/sim/Slider.tsx` | `Slider` (lin/log, unità SI), `NumberInput` (accetta "4,7k") | isola |
| `src/sim/Controls.tsx` | avvia/pausa, passo, ricomincia, velocità | isola |
| `src/sim/PhasorPlane.tsx` | fasori statici o rotanti, catena punta-coda, proiezioni | SSR statico o isola |
| `src/sim/Scope.tsx` | oscilloscopio multi-canale con trigger, `findTrigger()` | isola |
| `src/sim/Canvas2D.tsx` | canvas con devicePixelRatio, palette dai token, animazione | isola |
| `src/sim/VectorField.tsx`, `field.ts` | campi di cariche/fili, linee di campo (RK4), griglia di frecce | isola / puro |
| `src/sim/hooks.ts` | `useReducedMotion`, `useAnimationFrame`, `useElementSize`, `useThemeVersion` | isola |
| `src/sim/draw.ts`, `scale.ts`, `units.ts`, `RichText.tsx`, `i18n.ts` | utilità (frecce, scale, prefissi SI, pedici, etichette IT/EN) | ovunque |
| `src/sim/sim.css` | stile del kit, solo token | importato dai componenti |

**Regola del peso**: nelle isole importare `mna.ts`/`model.ts`, **mai** `netlist.ts` (porterebbe Zod nel bundle).
I tipi si possono importare ovunque con `import type`.

## Scrivere una netlist

Una netlist è un oggetto (in YAML o TypeScript). I valori sono numeri SI oppure stringhe con prefisso:
`"4.7k"`, `"4,7k"`, `"100n"`, `"10u"`/`"10µ"`, `"2m"` (milli), `"1meg"`/`"1M"` (mega). La massa è il nodo `"0"`
(accettati anche `gnd`, `GND`, `massa`). Ogni elemento ha un `id` (lettera iniziale: `R1`, `Rf`, `Vin`; nello
schema diventa R₁, R_f, V_in).

```yaml
figure:
  netlist:
    title: Partitore di tensione
    elements:
      - { type: V, id: V1, a: in, b: '0', dc: 12 }
      - { type: R, id: R1, a: in, b: out, value: 2k, show: { i: true } }
      - { type: R, id: R2, a: out, b: '0', value: 1k, show: { v: 'v_{out}' } }
```

### Convenzioni

- Bipoli con morsetti `a`, `b`: tensione `v = v(a) − v(b)`, corrente `i` **da a verso b attraverso l'elemento**
  (convenzione degli utilizzatori, come nel sito di Teoria dei circuiti). Le potenze calcolate sono **assorbite**:
  un generatore che eroga ha potenza negativa.
- Generatori di corrente (`I`, `G`, `F`): la corrente scorre da `a` verso `b` dentro il generatore, cioè **esce da `b`**
  (come in SPICE). Per iniettare corrente nel nodo `n`: `{ type: I, a: '0', b: n }`.
- Fasori: modulo = **ampiezza di picco** (default) o valore efficace con `phasor: rms`; fase in **gradi**.
  Potenza complessa: S = ½·V·I* (picco) oppure V·I* (efficaci).
- Pulsazione del circuito: `omega` [rad/s] oppure `freq` [Hz].

### Elementi

| `type` | Campi | Note |
|---|---|---|
| `R`, `C`, `L` | `a`, `b`, `value` | `C.v0`, `L.i0`: condizioni iniziali per `initial: 'ic'` |
| `V`, `I` | `a`, `b`, `dc?`, `ac?`, `wave?` | `ac: 10` oppure `{ mag: 10, phase: 30 }`; `wave` per il transitorio |
| `E` (VCVS) | `a`, `b`, `cp`, `cn`, `gain` | v(a,b) = gain·v(cp,cn) |
| `G` (VCCS) | `a`, `b`, `cp`, `cn`, `gain` [S] | i(a→b) = gain·v(cp,cn) |
| `H` (CCVS) | `a`, `b`, `ctrl`, `gain` [Ω] | v(a,b) = gain·i(ctrl); `ctrl` = id di un bipolo qualsiasi |
| `F` (CCCS) | `a`, `b`, `ctrl`, `gain` | i(a→b) = gain·i(ctrl) |
| `SW` | `a`, `b`, `closed`, `toggleAt?` | stato iniziale; cambia stato all'istante `toggleAt` (incluso) |
| `AM`, `VM` | `a`, `b` | amperometro (corto) e voltmetro (aperto) ideali |
| `K` | `l1`, `l2`, `k` oppure `m` | accoppiamento; pallini sui morsetti `a` dei due induttori |
| `T` | `p1a`, `p1b`, `p2a`, `p2b`, `n` | trasformatore ideale n:1: v1 = n·v2, i1 = −i2/n |
| `OA` | `plus`, `minus`, `out`, `gain?` | op-amp ideale (v+ = v−) o a guadagno finito; uscita riferita a massa |
| `N` | `na`, `nb`, `ra`, `rb` | nullore: nullatore na–nb, noratore ra–rb |
| `P` | `p1a`, `p1b`, `p2a`, `p2b`, `kind`, `m` | doppio bipolo `Z`, `Y`, `H` o `ABCD` (matrice 2×2) |

Forme d'onda (`wave`): `{ kind: dc, value }`, `{ kind: sin, offset?, amp, omega?|freq?, phase? }`
(x = offset + amp·cos(ωt + fase)), `{ kind: step, before?, after, at? }`,
`{ kind: pulse, low?, high, delay?, rise?, fall?, width, period? }`, `{ kind: pwl, points: [[t, v], …] }`.
Senza `wave`, un generatore vale `dc + |ac|·cos(ωt + fase)` per ogni t.

### Annotazioni sullo schema

- `show: { v: true | 'v_{x}', i: true | 'i_x', name: false, value: false }` sull'elemento: segni + e − della
  tensione (sul lato opposto all'etichetta) e freccia della corrente (sul reoforo dal lato di `a`, verso a→b).
- `label: '2R'` sostituisce il valore stampato (utile per esercizi letterali).
- `ports: [{ id: AB, plus: c, minus: '0', label: 'A–B' }]`: morsetti aperti disegnati (Thévenin, carichi).
- `probes: [{ kind: v, plus, minus, label }]`, `[{ kind: i, element, label }]`: grandezze evidenziate.
- `nodes: { out: { label: 'A' } }`: nome di un nodo con pallino.
- I generatori pilotati evidenziano da soli la grandezza di controllo (se `cp`–`cn` coincide con un bipolo, ne
  marca la tensione `v_{id}`; per `H`/`F` la corrente `i_{ctrl}`).
- Nel markup delle etichette `_x` o `_{xy}` diventa pedice.

### Layout dello schema

`layout.mode`:

- **`auto`** (default se non tutti gli elementi hanno `at`): disposizione "a binari". Massa in basso come
  binario unico con un simbolo (`layout.ground: symbols` per un simbolo su ogni morsetto), generatori a sinistra
  con il + in alto, nodi da sinistra a destra in ordine di visita dai generatori (o `layout.order: [a, b, …]`),
  un elemento in serie sul binario tra nodi consecutivi, derivazioni verticali, paralleli e retroazioni ad
  archi sopra (i più corti più in basso). Op-amp e doppi bipoli vanno sul binario; le retroazioni dell'op-amp
  finiscono sopra il triangolo. Copre serie, parallelo, scala, partitori, filtri, amplificatori invertenti e
  non invertenti, integratori/derivatori, trasformatori e doppi bipoli.
- **`bridge`**: ponte di Wheatstone (generatore a sinistra, due rami verticali, elemento di ponte orizzontale).
  Se la topologia non è un ponte si ripiega su `auto`.
- **`manual`** (default se ogni elemento ha `at`): `at: { x, y, dir, len?, label? }` in unità di griglia (20 px):
  `(x, y)` è il morsetto `a` (y verso il basso), `dir` la direzione del corpo (`right|left|up|down`), `len` la
  lunghezza (default 4). Op-amp: `(x, y)` è il punto medio tra gli ingressi (− in alto, `flip: true` per + in alto),
  uscita a `(x+5, y)`. `T`/`P`: `(x, y)` è `p1a`, `p1b` a `(x, y+4)`, porta 2 a `x + len` (default 4 per T, 6 per P).
  Nullore: `at` per il nullatore, `at2` per il noratore.

I fili sono instradati da soli (albero ortogonale per nodo che evita corpi, morsetti e fili degli altri nodi; pallini
sulle giunzioni). Per un nodo si può imporre il percorso con `layout.wires: [{ node, points: [[x, y], …] }]`.

Coerenza garantita dai test (`tests/unit/schematic.test.ts`): ogni elemento è disegnato, ogni nodo è un'unica
componente connessa, nessun filo tocca morsetti o fili di altri nodi. Aggiungendo un circuito a `examples.ts`
lo si mette automaticamente sotto questi controlli.

## Usare il risolutore

```ts
import { ac, dc, firstOrder, sweep, thevenin, transient } from '../../sim/circuits/mna';

const s = dc(net);                 // continua
s.v('out'); s.vd('a', 'b'); s.i('R1'); s.power('V1'); s.powerBalance(); // ≈ 0 (Tellegen)

const p = ac(net, { omega: 1000 }); // fasori (Complex: re, im, abs(), argDeg())
p.power('R1');                      // { p, q, s, apparent, pf }
p.impedance('L1');

thevenin(net, 'c', '0');            // { vth, zth, isc, yn } (zth = Infinity se Norton puro)
maxPower(net, 'c');                 // { pmax, zLoad } (adattamento coniugato)

transfer(net, 'Vin', { v: 'out' }, omega);                 // H(jω)
sweep(net, 'Vin', { v: 'out' }, { fMin: 10, fMax: 1e6 });   // { freq, omega, H, magDb, phaseDeg (srotolata) }

const tr = transient(net, { tEnd: 5e-3, dt: 1e-6 });  // trapezi, Eulero implicito dopo ogni discontinuità
tr.t; tr.v('c'); tr.i('L1'); tr.at(tr.v('c'), 1e-3);

const fo = firstOrder(net, { v: 'out' });  // { tau, req, y0, yss(t), at(t) } — caso misto incluso
```

- Stato iniziale del transitorio (`initial`): `steady` (default, regime per t < 0 con continua **e** sinusoidi,
  configurazione degli interruttori prima delle commutazioni), `zero`, `ic` (`v0`/`i0`). Il primo campione è t = 0⁺.
- Analisi statiche (`dc`, `ac`, `thevenin`) con interruttori: stato iniziale, oppure `{ t }` per lo stato a un istante.
- Nodi flottanti in continua (condensatori in serie): si aggiunge automaticamente una conduttanza minima (gmin)
  come in SPICE. Sistemi davvero singolari danno un `CircuitError` con le cause tipiche.
- Aritmetica in virgola mobile (doppia precisione). Il sito originale di Teoria dei circuiti usa razionali esatti per
  generare esercizi con risultati "puliti": la PR del corso può tenere quella logica nel proprio generatore e usare
  questo MNA per verifica, schema e simulazioni.

Test di riferimento in `tests/unit/mna.test.ts` (partitori, ponte, pilotati, op-amp, nullore, trasformatore, doppi
bipoli Z/Y/H/ABCD equivalenti, Thévenin/Norton, potenza massima DC e AC, risonanza, rifasamento, mutua induttanza,
sovrapposizione di frequenze, Bode, RC/RL/RLC nel tempo contro le soluzioni analitiche, caso misto).

## Lo schema in una pagina

```astro
---
import Circuit from '../../sim/Circuit.astro';
---
<Circuit netlist={exercise.figure.netlist} lang={lang} caption="Circuito dell'esercizio" />
```

A runtime (generatori di esercizi, isole): `renderSchematic(net, { lang }).svg` restituisce la stringa SVG
(`dangerouslySetInnerHTML` in Preact). Lo SVG usa solo `currentColor` e token CSS: segue il tema e stampa in nero;
contiene `<title>` e `<desc>` (descrizione generata dalla netlist, IT/EN).

## Costruire una simulazione

Le simulazioni di corso stanno in `src/courses/<courseId>/sims/*.tsx` e si montano con `client:visible`.
Schema minimo (vedi `src/sim/demo/*.tsx`):

```tsx
import { useMemo, useState } from 'preact/hooks';
import { sweep } from '../../../sim/circuits/mna';
import { BodePlot } from '../../../sim/Plot';
import { Slider } from '../../../sim/Slider';
import '../../../sim/sim.css';

export default function FiltroRC({ lang }: { lang: 'it' | 'en' }) {
  const [R, setR] = useState(1000);
  const sw = useMemo(() => sweep({ elements: [
    { type: 'V', id: 'Vin', a: 'i', b: '0', ac: 1 },
    { type: 'R', id: 'R1', a: 'i', b: 'o', value: R },
    { type: 'C', id: 'C1', a: 'o', b: '0', value: 1e-7 },
  ] }, 'Vin', { v: 'o' }, { fMin: 10, fMax: 1e6 }), [R]);
  return (
    <section class="sim" aria-labelledby="rc">
      <h3 class="sim__title" id="rc">Filtro RC</h3>
      <Slider lang={lang} label="R" value={R} min={100} max={1e5} log unit="Ω" onInput={setR} />
      <BodePlot lang={lang} title="Filtro RC" x={sw.freq} curves={[{ label: 'H', magDb: sw.magDb, phaseDeg: sw.phaseDeg }]} />
    </section>
  );
}
```

Linee guida:

- **Accessibilità**: ogni canvas ha `label` (e una descrizione come figli); ogni grafico ha `title` e la tabella dei
  dati; i controlli sono nativi (range, button, select) con etichette; valori letti con l'unità (`aria-valuetext`).
- **Movimento**: le animazioni partono **ferme** se `prefers-reduced-motion` (mostrare `Controls` con
  `reducedMotion`); `useAnimationFrame` si ferma da solo fuori schermo, a scheda nascosta e allo smontaggio.
- **Prestazioni**: calcoli in `useMemo`; per animazioni pesanti disegnare su `Canvas2D` invece di aggiornare SVG.
  Pesi indicativi (minimizzati, non compressi): runtime Preact + Astro ~22 KB, MNA completo ~22 KB (il tree-shaking
  toglie le analisi non usate), `Plot` ~7,5 KB, `Canvas2D` + hook ~5 KB. Il budget Lighthouse è 50 KB per pagina:
  una o due isole per pagina, e per figure statiche `<Circuit>`/`Plot` senza `client:`.
- **Colori**: solo token (`var(--accent)`, … o `colors` di `Canvas2D`); nessun colore scritto a mano.
- **Grafici senza JS**: `Plot`, `BodePlot`, `PhasorPlane` usati in un `.astro` senza direttiva `client:` producono
  SVG statico.
- **Testi**: etichette dei componenti del kit già in IT/EN (`src/sim/i18n.ts`); i testi della simulazione si passano
  per lingua (`lang`).

## Inventario delle simulazioni legacy

| Sito / simulazione | Cosa fa | Componenti del kit |
|---|---|---|
| **Fisica 1** #2 Moto armonico | massa su molla + traccia x(t) che scorre; cursori A, ω, φ | `Canvas2D` (animato), `Controls`, `Slider` — vedi `demo/OscillatorDemo.tsx` |
| Fisica 1 #4 Pendolo | pendolo esatto (integrazione semi-implicita) vs armonico, periodo con correzione | `Canvas2D`, `Controls`, `Slider`; integrazione nel componente di corso |
| Fisica 1 #6 Oscillatore smorzato | x(t) nei tre regimi con inviluppo e punto animato | `Plot` (serie + inviluppo tratteggiato, `markers`), `Slider`; oppure `transient` di un RLC (analogo elettrico) |
| Fisica 1 #7 Risonanza | A(Ω) al variare di γ, picco e scansione animata | `Plot` (`markers` per Ω_ris e il punto mobile), `Slider`, `useAnimationFrame` |
| Fisica 1 #13 Gara sul piano inclinato | sfera, disco, anello: a = g sinθ/(1+β) | `Canvas2D`, `Controls`, `Slider`, `arrow()` |
| Fisica 1 #20 Rotolamento | campo delle velocità sulla ruota (contatto v = 0) | `Canvas2D`, `arrow()` di `draw.ts`, `Slider` |
| Fisica 1 #21 Urti centrali | due masse, coefficiente di restituzione, energia conservata | `Canvas2D`, `Controls`, `Slider` |
| Fisica 1 #30 Ciclo di Carnot | ciclo p–V con area riempita e punto che lo percorre | `Plot` (serie con `fill`, `markers`), `Slider`, `useAnimationFrame` |
| **Teoria dei circuiti** — esercizi generati | netlist → solutore esatto → schema SVG dalla stessa netlist | `netlist.ts`, `mna.ts` (verifica, Thévenin, transitori, `firstOrder` per il caso misto), `schematic.ts`/`<Circuit>` |
| Teoria dei circuiti — verifica con simulatore (trapezi) | simulazione nel tempo indipendente per controllare la soluzione esatta | `transient()` (stesso metodo: trapezi + Eulero dopo la discontinuità) |
| Teoria dei circuiti — `simulatori/` | esportazione SPICE (LTspice/ngspice) di un esercizio | resta nella PR di corso (formato SPICE) usando la netlist del kit |
| Teoria dei circuiti — nullore, trasformatore, doppi bipoli Z/Y | elementi dei template A/B/C | `N`, `T`, `P` della netlist, layout `manual` con `at`/`at2` per ricalcare le figure originali |
| **Fisica 2** | nessun simulatore interattivo nel sito originale (solo "simula l'esame") | per nuove simulazioni: `VectorField` + `field.ts` (cariche, fili, linee di campo), `PhasorPlane` (circuiti in AC), `Scope`, `Plot` |
| **AE·FIN** — `DatapathHero` | sfondo decorativo con segnali animati (SMIL), nascosto con movimento ridotto | non serve il kit: SVG statico; eventuale animazione con `useReducedMotion` |
| AE·FIN — `asmSim` (3 mini-programmi) | esecuzione di LOOP, MUL/CMP/BEQ, LSL/LSR per calcolare le risposte | logica pura nella PR di corso; per un'esecuzione passo-passo `Controls` (`onStep`) |
| AE·FIN — `Simulator` | simulazione d'esame (prova a tempo), non fisica | non pertinente al kit |
