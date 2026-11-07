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
| `src/figures/types/*.ts` | disegnatori per gruppo: `mechanics`, `plots`, `thermo`, `em`, `waves`, `cs` | ovunque |
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
gruppo della figura. `validateGenerated` controlla che il tipo esista; i test del corso dovrebbero passare
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
| `function-plot` | `x{min, max, label?, unit?}`, `y?{min?, max?, label?, unit?}`, `series[]` di tipo `points{points}`, `poly{coeffs}`, `sin{amp, omega?, phase?, offset?}`, `exp{a, b, c?}` (+ `label?`, `tone?`, `dash?`); `markers?`, `vlines?`, `hlines?`, `area?{series, from, to, label?}`, `grid? (sì)` |
| `collision` | `before[]`, `after[]` di `{label, mass?, v, angle?}` (con `angle` urto nel piano, altrimenti lungo x con il segno di v), `values? (sì)`, `unit?` |
| `pv-cycle` | `states[{id, p, V}]`, `processes[{from, to, kind isothermal\|adiabatic\|isochoric\|isobaric\|linear}]`, `gamma?` (1,4), `work? (sì)` (area del ciclo o sotto le trasformazioni), `isotherms?`, `units?{p, V}` (kPa, L), `values? (sì)`. Lo schema verifica che gli stati siano coerenti con le trasformazioni (2 %) |
| `point-charges` | `charges[{x, y, q, label?}]` (\|q\| ≤ 5), `bounds?`, `lines?` (per unità di carica, default 8), `equipotentials?` (default 4), `testPoint?{x, y, label?}` |
| `capacitor` | `geometry parallel\|spherical\|cylindrical`, `field? (sì)`, `charges? (sì)`, `dielectric? none\|full\|half` (half = lastra a metà spessore), `fringe?`, `dLabel?`, `areaLabel?`, `innerLabel?`, `outerLabel?`, `voltageLabel?` |
| `magnetic-field` | `source wire\|wire-section\|loop\|solenoid`, `current? positive\|negative`, `rightHand?`, `turns?` (3–14), `fieldLines? (sì)`, `currentLabel?`, `fieldLabel?` |
| `wave` | `kind traveling\|standing`; progressiva: `wavelengths?`, `direction?`; stazionaria: `harmonic?`, `boundary? fixed-fixed\|fixed-free\|free-free`, `snapshots?`; `lambda? (sì)`, `amplitude? (sì)`, `nodes? (sì)` |
| `vectors` | `vectors[{id?, label?, x?, y?, dx, dy, from?, tone?, components?, dashed?}]`, `sum?{of[], label?, parallelogram?}`, `frames?[{x, y, angle?, length?, labels?, origin?}]`, `range?`, `grid?`, `axes? (sì)`, `axisLabels?` |
| `flowchart` | `nodes[{id, kind start\|end\|process\|decision\|io\|call, text}]`, `edges[{from, to, label?}]`; disposizione automatica (primo successore sotto, gli altri a destra, ritorni a sinistra) |
| `block-diagram` | `blocks[{id, text, col, row, span?, emphasis?}]`, `links[{from, to, label?, both?}]` su griglia |
| `memory` | `kind array\|memory\|stack\|queue`, `cells[{value, label?, highlight?}]`, `title?`, `orientation?`, `indices?`, `pointers?[{label, index}]` (pila: `top` di default; coda: testa e coda) |
| `linked-list` | `nodes[{value, highlight?}]`, `doubly?`, `circular?`, `head?`, `tail?`, `nullLabel?` |
| `tree` | `root{value, highlight?, children?[nodo \| null]}`, `binary?` (i `null` tengono il posto del figlio mancante) |
| `truth-table` | `inputs[]` (1–5), `outputs[{label, values[0\|1\|'x'\|'-']}]` (2ⁿ valori, primo ingresso = bit più significativo), `highlight?[righe]` |

Toni disponibili per `tone`: `ink`, `muted`, `accent`, `accent2`, `info`, `success`, `warning`, `danger`.

## Varianti interattive

`<DiagramLive kind="…" />` con `kind` = `inclined-plane` (θ, μ → accelerazione), `spring-mass` (x, k → forza
ed energia), `pv-cycle` (ciclo di Carnot: rapporto dei volumi, rapporto delle temperature → rendimento),
`point-charges` (due cariche: valore della seconda e distanza). Isole `client:visible`: il JS (~10–15 KB gzip
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
