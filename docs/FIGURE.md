# Kit delle figure

Figure fisiche e schemi generati **dai dati**: una funzione pura `parametri → SVG`, la stessa a build-time
(teoria, esercizi, prima variante dei generati) e nel browser (solo per «Nuova variante»). Stesso approccio
di `<Circuit>` (docs/SIM.md), che resta il modo di disegnare i circuiti.

Catalogo con tutti i tipi ed esempi: `/<lang>/stile/figure/` (noindex, fuori dal menu e dalla sitemap), coperto da
test visivi (390 e 1280 px, chiaro e scuro), axe in IT/EN e `tests/e2e/figure.spec.ts`.

## Mappa dei moduli

| Modulo | Cosa contiene | Dove gira |
|---|---|---|
| `src/figures/types.ts` | `DIAGRAM_TYPES`, `isDiagramType()` (senza Zod) | ovunque |
| `src/figures/schemas.ts` | schemi **Zod** dei parametri, `parseDiagram()`, `DiagramSpecSchema`, tipi `DiagramParams`/`DiagramSpec` | build-time, test, collection `exercises` |
| `src/figures/core.ts` | costruttore SVG (`Svg`), toni dai token, etichette con pedici, frecce, quote, archi, `finish()` | ovunque |
| `src/figures/axes.ts` | assi con tacche "belle", griglia, etichette con unità | ovunque |
| `src/figures/types/*.ts` | disegnatori per gruppo: `mechanics`, `plots`, `thermo`, `em`, `fields` (Gauss, campi uniformi, induzione), `waves`, `optics`, `cs`, `signals` (Bode, poli e zeri, diagrammi temporali), `structures` (Karnaugh, campi di bit, pipeline, grafi) | ovunque |
| `src/figures/schemas-signals.ts` | schemi Zod dei tipi di `signals` e `structures` (registrati in `DIAGRAM_SCHEMAS`) | build-time |
| `src/figures/render.ts` | `renderDiagram(type, params, opts)` sincrono (tutti i gruppi) | build-time |
| `src/figures/lazy.ts` | `renderDiagramAsync(type, params, opts)`: importa solo il gruppo necessario | browser |
| `src/figures/Diagram.astro` | `<Diagram type params caption? title? id? lang? />`: valida e disegna, **zero JS** | Astro, MDX |
| `src/figures/DiagramLive.astro`, `live/*.tsx` | varianti interattive (isole `client:visible`) | browser |
| `src/figures/examples.ts` | esempi di ogni tipo (catalogo e test) | — |

**Regola del peso**: nel browser non si importa mai `schemas.ts` (porterebbe Zod) né `render.ts` (tutti i
gruppi): si usa `lazy.ts` o, nelle isole, direttamente il gruppo (`types/mechanics` + `finish`).

## Usare una figura

### Nella teoria (MDX)

`Diagram` e `DiagramLive` sono già nella mappa dei componenti delle pagine di teoria (e della loro stampa):

```mdx
<Diagram
  type="inclined-plane"
  params={{ angle: 30, friction: true, components: true, motion: 'down' }}
  caption="Forze su un blocco che scende lungo un piano scabro"
/>

<DiagramLive kind="inclined-plane" />
```

La lingua viene dall'URL; i parametri sono validati a build-time (un errore ferma la build e indica il
campo sbagliato). Se la stessa figura compare due volte nella pagina, passare `id` diversi.
Nella versione stampabile `DiagramLive` diventa la figura statica con i parametri iniziali.

### Negli esercizi (YAML)

```yaml
- id: piano-scabro
  # …
  figure:
    diagram:
      type: inclined-plane
      params: { angle: 30, friction: true, motion: down }
```

`figure` accetta **una sola** tra `netlist`, `diagram`, `svg`. Testi da tradurre dentro i parametri
(flowchart, schemi a blocchi, titoli della memoria) si scrivono come `{ it, en }`.

### Nei generatori

```ts
generate(seed, lang) {
  const r = createRng(seed);
  const angle = r.int(20, 45);
  return {
    statement: …,
    figure: { diagram: { type: 'inclined-plane', params: { angle, friction: true } } },
    steps: […], answer: […],
  };
}
```

La prima variante è resa a build-time (`withPregenerated`); «Nuova variante» carica `lazy.ts` e solo il
gruppo della figura.

Copertura per corso: `tests/unit/fisica-2/figure.test.ts` e `tests/unit/figure-corsi/<corso>.test.ts` controllano
che ogni esercizio statico abbia una figura valida in IT ed EN (eccezioni elencate con il motivo), che ogni
generatore ne produca una per più semi e che la teoria IT ed EN abbia le stesse figure del kit
(`theoryDiagrams()` in `tests/unit/figure-corsi/helpers.ts`). `validateGenerated` controlla che il tipo esista; i test del corso dovrebbero passare
i parametri a `parseDiagram` per qualche seme (vedi `tests/unit/figures.test.ts`).

### In codice Astro o TypeScript

```ts
import { renderDiagram } from '../figures/render';
const { svg, title, description } = renderDiagram('wave', { kind: 'standing', harmonic: 3 }, { lang });
```

## Tipi e parametri

Angoli in gradi, 0° = verso destra, antiorario. Le etichette (`label`, `…Label`) accettano pedici e apici:
`F_N`, `v_{0x}`, `x^2`. Tutti i booleani sono facoltativi; il default è indicato tra parentesi.

| Tipo | Parametri principali |
|---|---|
| `free-body` | `forces[{label, angle, magnitude? (0,1–3), kind? weight\|normal\|friction\|tension\|applied\|other}]`, `body? block\|point\|sphere`, `bodyLabel?`, `axes?`, `axesAngle?`, `ground?`, `acceleration?{angle, label?}` |
| `inclined-plane` | `angle` (5–75), `friction?`, `forces? (sì)`, `components?`, `motion? up\|down\|none`, `pulley?` (carrucola in cima e massa sospesa), `massLabel?`, `hangingLabel?`, `angleLabel?` |
| `spring-mass` | `orientation? horizontal\|vertical`, `displacement?` (−1…1, positivo = allungata/verso il basso), `equilibrium? (sì)`, `force? (sì)`, `damper?`, `kLabel?`, `massLabel?`, `xLabel?` |
| `pendulum` | `angle` (−80…80), `forces? (sì)`, `components?`, `arc? (sì)`, `lengthLabel?`, `massLabel?`, `angleLabel?` |
| `projectile` | `v0` [m/s], `angle` (0–90), `h0?` [m], `g?` (9,81), `vectors?` (0–7, default 3), `components? (sì)`, `apex? (sì)`, `range? (sì)`, `values? (sì)`; gittata, quota massima e tempo di volo nella descrizione |
| `circular-motion` | `angle`, `velocity? (sì)`, `centripetal? (sì)`, `tangential? none\|speeding\|slowing`, `direction? ccw\|cw`, `radiusLabel?`, `angleLabel?`, `showAngle? (sì)` |
| `motion-graphs` | `segments[{duration, a}]` (moto a tratti con a costante), `x0?`, `v0?`, `show? ['x','v','a']` |
| `function-plot` | `x{min, max, label?, unit?}`, `y?{min?, max?, label?, unit?}`, `series[]` di tipo `points{points}`, `poly{coeffs}`, `sin{amp, omega?, phase?, offset?}`, `exp{a, b, c?}`, `damped{amp, alpha, omega?, phase?, offset?}` (offset + amp·e^(−αx)·cos(ωx + fase): transitori del secondo ordine) (+ `label?`, `tone?`, `dash?`); `markers?`, `vlines?`, `hlines?`, `area?{series, from, to, label?}`, `grid? (sì)` |
| `collision` | `before[]`, `after[]` di `{label, mass?, v, angle?}` (con `angle` urto nel piano, altrimenti lungo x con il segno di v), `values? (sì)`, `unit?` |
| `pv-cycle` | `states[{id, p, V}]`, `processes[{from, to, kind isothermal\|adiabatic\|isochoric\|isobaric\|linear}]`, `gamma?` (1,4), `work? (sì)` (area del ciclo o sotto le trasformazioni), `isotherms?`, `units?{p, V}` (kPa, L), `values? (sì)`. Lo schema verifica che gli stati siano coerenti con le trasformazioni (2 %) |
| `point-charges` | `charges[{x, y, q, label?}]` (\|q\| ≤ 5), `bounds?`, `lines?` (per unità di carica, default 8), `equipotentials?` (default 4), `testPoint?{x, y, label?}` |
| `capacitor` | `geometry parallel\|spherical\|cylindrical`, `field? (sì)`, `charges? (sì)`, `dielectric? none\|full\|half\|layers\|side-by-side` (half = lastra a metà spessore; layers = due strati in serie; side-by-side = due metà in parallelo), `dielectricLabels?` (1–2), `battery? (sì)` (no = armature isolate), `fringe?`, `dLabel?`, `areaLabel?`, `innerLabel?`, `outerLabel?`, `voltageLabel?` |
| `magnetic-field` | `source wire\|wire-section\|loop\|solenoid\|wire-pair\|coax\|toroid\|hairpin`, `current? positive\|negative` (U: positivo = orario sul semicerchio), `current2?` (coppia di fili), `forces? (sì)` (coppia), `gap?` (toroide con traferro), `rightHand?`, `turns?` (3–14), `fieldLines? (sì)`, `currentLabel?`, `fieldLabel?`, `radiusLabel?` (conduttore spesso, U, raggio medio del toroide), `innerLabel?`/`outerLabel?`/`shellLabel?` (coassiale a, b, c; lato della sezione del toroide), `gapLabel?`, `distanceLabel?` |
| `charge-distribution` | `shape sphere\|shell\|cylinder\|plane\|wire\|ring\|rod\|sphere-in-shell`, `conductor?`, `charge? positive\|negative`, `gaussian?` (raggio della superficie di Gauss in unità del raggio esterno, 0 = nessuna, default 1,5), `field? (sì)`, `radiusLabel?`, `innerLabel?`, `outerLabel?`, `gaussLabel?`, `densityLabel?`, `point?{distance, label?, distanceLabel?}` (anello, segmento), `connected?` (sfera nel guscio). Il campo sulla superficie di Gauss è proporzionale a E(r) |
| `uniform-field` | `field B-in\|B-out\|B-right\|E-up\|E-down\|E-right`, `object particle\|dipole\|loop\|none` (particella con B ⊥ al foglio → circonferenza, con E verticale → parabola; dipolo con `E-right`; spira con `B-right`), `charge?`, `trajectory? (sì)`, `angle?` (p o μ rispetto al campo), `forces? (sì)`, etichette `fieldLabel`, `velocityLabel`, `radiusLabel`, `chargeLabel`, `momentLabel`. Verso di rotazione e forze calcolati da F = q v × B |
| `induction` | `setup sliding-bar\|rotating-rod\|rotating-loop\|loop-near-wire\|loop-in-field`, `field? in\|out`, `velocity? right\|left`, `rotation? ccw\|cw`, `motion? away\|toward\|none`, `trend? increasing\|decreasing\|constant`, `angle?`, `loop? circle\|square`, `induced? (sì)`; etichette `fieldLabel`, `lengthLabel`, `widthLabel`, `distanceLabel`, `velocityLabel`, `resistanceLabel`, `omegaLabel`, `currentLabel` (filo), `inducedLabel`, `forceLabel` (forza applicata). Verso della corrente indotta (Lenz) e polarità della sbarra calcolati |
| `wave` | `kind traveling\|standing\|electromagnetic\|spherical`; progressiva: `wavelengths?`, `direction?`; stazionaria: `harmonic?`, `boundary? fixed-fixed\|fixed-free\|free-free`, `snapshots?`; `lambda? (sì)`, `amplitude? (sì)`, `nodes? (sì)`; elettromagnetica: E e B in fase e ortogonali (`wavelengths?`); sferica: `sourceLabel?`, `distanceLabel?` |
| `refraction` | `n1`, `n2` (1–4, mezzo sopra e sotto), `incidence` (0–89°), `reflected? (sì)`, `polarization?` (punti e trattini; a Brewster il riflesso ha solo punti), `critical?` (rifratto radente tratteggiato), `values? (sì)`, `mediumLabels?[2]`. Snell, angolo limite e Brewster calcolati |
| `slits` | `slits 1\|2`, `width?` e `separation?` (in λ), `pattern? (sì)` (profilo di intensità sullo schermo), `plate?` (lastrina davanti alla fenditura superiore: frange spostate), etichette `widthLabel`, `separationLabel`, `distanceLabel`, `fringeLabel`, `plateLabel` |
| `polarizers` | `axes[]` (1–4, gradi dalla verticale), `unpolarized? (sì)`, `intensities? (sì)` (legge di Malus), `intensityLabel?` |
| `vectors` | `vectors[{id?, label?, x?, y?, dx, dy, from?, tone?, components?, dashed?}]`, `sum?{of[], label?, parallelogram?}`, `frames?[{x, y, angle?, length?, labels?, origin?}]`, `range?`, `grid?`, `axes? (sì)`, `axisLabels?` |
| `flowchart` | `nodes[{id, kind start\|end\|process\|decision\|io\|call, text}]`, `edges[{from, to, label?}]`; disposizione automatica (primo successore sotto, gli altri a destra, ritorni a sinistra) |
| `block-diagram` | `blocks[{id, text, col, row, span?, emphasis?}]`, `links[{from, to, label?, both?}]` su griglia |
| `memory` | `kind array\|memory\|stack\|queue`, `cells[{value, label?, highlight?}]`, `title?`, `orientation?`, `indices?`, `pointers?[{label, index}]` (pila: `top` di default; coda: testa e coda) |
| `linked-list` | `nodes[{value, highlight?}]`, `doubly?`, `circular?`, `head?`, `tail?`, `nullLabel?` |
| `tree` | `root{value, highlight?, children?[nodo \| null]}`, `binary?` (i `null` tengono il posto del figlio mancante) |
| `truth-table` | `inputs[]` (1–5), `outputs[{label, values[0\|1\|'x'\|'-']}]` (2ⁿ valori, primo ingresso = bit più significativo), `highlight?[righe]` |
| `scene` | schizzo a primitive in coordinate del mondo (x a destra, y in alto, scala automatica): `items[]` con `kind` = `surface` (tratteggio a destra del verso from→to), `line{points, closed?, fill?, arrow? mid\|end, label?}`, `rod`, `block{at, w, h, angle?}`, `disc{at, r, style? disc\|ring\|sphere, hole?, radius?}`, `pivot{style? hinge\|support\|pin}`, `spring`, `vector{from, to, vkind? (toni delle forze, velocity, acceleration)}`, `rotation{at, r (px), from, to}`, `arc`, `dim`, `angle`, `dot`, `label{text}`; `title?`, `description?` ({it, en}), `width?`, `maxHeight?`. La descrizione accessibile elenca da sola gli elementi con etichetta |
| `heat-engine` | `kind engine\|refrigerator\|heat-pump`, `reservoirs[{label, heat?, side hot\|cold, flow? in\|out}]` (2–4, calde in alto e fredde in basso), `work?` (default `W`, vuoto = senza freccia), `engineLabel?` |
| `bode` | forma K·(s)ⁿ·Π(1+s/z)/Π(1+s/p): `gain?` (1), `zeros?[]`, `poles?[]` di `{w, zeta?}` (con `zeta` coppia complessa 1+2ζ(s/ω)+(s/ω)²), `origin?` (−2…2, zeri o poli nell'origine), `range?{min, max}` [rad/s], `show? ['mag','phase']`, `asymptotes?`, `markers?[{w, label?}]`, `label?` (H) |
| `pole-zero` | `poles?[]`, `zeros?[]` di `{re, im, label?}` (le coppie coniugate si elencano entrambe), `stableRegion?` (semipiano sinistro evidenziato), `range?`, `axisLabels?` (σ, jω) |
| `timing` | `signals[]` di `{label, kind: 'clock'}`, `{label, wave: '01x.z'}` (`.` ripete il livello, `x` indefinito, `z` alta impedenza) o `{label, bus: ['A', 'A', 'B']}`; `steps?` (mezzi periodi del clock), `markers?[{at, label?}]` |
| `karnaugh` | `vars[]` (2–4, la prima è la più significativa: righe = prime ⌊n/2⌋ variabili, colonne = le altre, in codice Gray), `values[]` per mintermine (0, 1, `x`/`-` indifferenza), `groups?[{cells[], label?, tone?}]` (1, 2, 4, 8 o 16 celle; i gruppi che girano oltre il bordo sono disegnati in più pezzi), `output?` |
| `bitfield` | `bits` (dal più significativo; `0`, `1`, `?`, spazi ignorati; ≤ 32), `fields?[{msb, lsb, label, tone?}]` (bit numerati da destra a partire da 0), `indices? (sì)`, `caption?` |
| `pipeline` | `rows[{label, start, stages[]}]` (uno stadio per ciclo da `start`, `-` = stallo), `forwards?[{from: [riga, ciclo], to: [riga, ciclo]}]` |
| `graph` | `nodes[{id, label?, x?, y?}]` (posizioni 0–10 per tutti o per nessuno: altrimenti in cerchio), `edges[{from, to, label?, highlight?, dashed?}]` (lati paralleli curvati), `directed?` |

Toni disponibili per `tone`: `ink`, `muted`, `accent`, `accent2`, `info`, `success`, `warning`, `danger`.

### Figure ricorrenti di un corso

Quando la stessa situazione torna in teoria, esercizi e generatori conviene un costruttore nel corso che
restituisce `{ type, params }` (di solito una `scene`): Fisica 1 li ha in `src/courses/fisica-1/lib/figures.ts`
(carrucola, asta incernierata, scala, trave, rotolamento, giro della morte, pendolo balistico, tubo a U,
riferimenti accelerati, cicli pV dai parametri…). Nelle pagine MDX si importano e si passano con lo spread:

```mdx
import * as Fig from '../../../courses/fisica-1/lib/figures';

<Diagram {...Fig.ladder({ angle: 60 })} caption="…" />
```

I test del corso (`tests/unit/fisica-1/figures.test.ts`) verificano che ogni esercizio statico abbia una figura
(eccezioni in una whitelist motivata) e che ogni generatore ne restituisca una valida per più semi.

## Varianti interattive

`<DiagramLive kind="…" />` con `kind` = `inclined-plane` (θ, μ → accelerazione), `spring-mass` (x, k → forza
ed energia), `pv-cycle` (ciclo di Carnot: rapporto dei volumi, rapporto delle temperature → rendimento),
`point-charges` (due cariche: valore della seconda e distanza), `refraction` (θ₁, n₁, n₂ → angolo rifratto o riflessione totale). Isole `client:visible`: il JS (~10–15 KB gzip
con Preact) arriva solo quando la figura entra nello schermo. Una nuova variante: un file in `live/` che usa
`LiveFrame`, `Slider` del kit e il disegnatore del gruppo, più una riga in `DiagramLive.astro` e
`DiagramLiveStatic.astro`.

## Linee guida

**Quando una figura è utile**: quando la situazione fisica ha una geometria (forze, versi, angoli, campi),
quando un grafico rende visibile un andamento (leggi orarie, cicli, transitori), quando una struttura dati
o un algoritmo si capiscono meglio disegnati (puntatori, alberi, flussi). Non serve per ripetere a parole
quello che il testo dice già, né come decorazione.

**Stile coerente**:

- un concetto per figura; al massimo 5–6 vettori; etichette brevi (simboli, non frasi);
- i colori distinguono i segni, il testo resta sempre nel colore del testo: per le forze peso = `danger`,
  normale = `info`, attrito = `warning`, tensione = `success`, applicata = `accent`; tratteggio per componenti
  e grandezze ausiliarie, grigio (`muted`) per riferimenti e quote;
- mai colori scritti a mano: solo token (lo verifica `tests/unit/figures.test.ts`), così le figure seguono
  tema chiaro/scuro e la stampa;
- valori numerici solo se servono all'esercizio (`values: false` per le figure qualitative);
- `caption` per dire cosa guardare; `title` e `<desc>` sono generati (IT/EN) e descrivono la figura a chi
  usa un lettore di schermo: se i parametri cambiano, cambia anche la descrizione.

## Aggiungere un tipo

1. Nome in `DIAGRAM_TYPES` (`types.ts`) e schema in `DIAGRAM_SCHEMAS` (`schemas.ts`), con `superRefine`
   per i vincoli tra campi.
2. Disegnatore nel gruppo giusto di `types/` (`(params, ctx) → { svg, title, description }`), registrato in
   `render.ts` e `lazy.ts`.
3. Almeno un esempio in `examples.ts` (entra da solo nel catalogo e nei test) e una riga nella tabella sopra.
4. Le baseline visive del catalogo si rigenerano in CI (commit «[baseline]»).
