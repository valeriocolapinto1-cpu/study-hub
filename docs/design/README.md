# Sistema di design

Direzione **"Originale"**: la grafica dei siti di studio originali (in `legacy/`), riportata sui componenti comuni.
La precedente direzione "Quaderno" ([DIRECTION.md](DIRECTION.md)) è superata: restano i componenti, cambia la pelle.
Tutti i componenti sono visibili in `/it/stile/` (pagina noindex, usata dai test visivi e axe); le figure del kit
(`src/figures`, [FIGURE.md](../FIGURE.md)) in `/<lang>/stile/figure/`.

## Due aree

| Area | Dove | Riferimento | Aspetto |
|---|---|---|---|
| `html[data-area="hub"]` | home, chi sono, contribuisci, ringraziamenti, note legali, privacy, 404, ripasso/appunti/dati globali | `legacy/hub` | tela `#05060c`, tre sfere sfumate animate + griglia mascherata (`.bg-orbs`), barra a pillola e pannelli in vetro (`.glass`), pulsanti a pillola, primario con gradiente ciano → indaco → viola, occhielli ciano, card dei corsi con metriche |
| `html[data-area="course"]` | tutte le rotte `/<lang>/anno-N/<corso>/…` | `legacy/fisica-2` | barra sfocata con marchio, nome del corso e sue sezioni; superfici piatte con filetti; card a raggio 12 px; sommario con filo a sinistra; numerazioni in pastiglie dell'accento |

L'area la imposta `BaseLayout` (c'è `course` → corso). Le regole sono in `src/styles/originale.css`, uno strato sopra
`components.css`/`prose.css`: stesse classi, stesse props, nessun componente rinominato.

## Principi

1. **Fedeli agli originali.** Struttura, densità e colori dei vecchi siti; il contenuto resta quello attuale.
2. **Scuro di default.** Il chiaro si sceglie con l'interruttore (salvato in `sh:v1:global:theme`); non si segue il sistema.
3. **Una tela per corso.** Ogni corso ha superfici e accento del suo sito originale; i colori di stato hanno sempre un'icona o un testo.
4. **Leggibile ovunque.** Contrasto AA in chiaro e scuro (anche su vetro e sfere), aree di tocco ≥ 24 px (quasi sempre 40 px),
   focus sempre visibile, `prefers-reduced-motion` ferma sfere e transizioni.
5. **Leggero e stampabile.** Sfere e vetro in CSS puro (gradienti radiali, nessuna immagine, nessun `filter: blur`);
   in stampa niente sfondi scuri, vetro né sfocature.

## Tipografia

| Ruolo | Famiglia | Uso |
|---|---|---|
| `--font-sans` | Geist | tutto il testo: titoli (650, interlettera −0,02/−0,035 em), interfaccia, testo lungo |
| `--font-serif` | alias di `--font-sans` | solo compatibilità con contenuti e isole che lo usano |
| `--font-mono` | Geist Mono | dati, numerazioni, occhielli tecnici, badge, codice |

Scala fluida `--step--2 … --step-5`; i titoli di pagina dei corsi seguono Fisica II
(`clamp(1.8rem, 1.2rem + 2vw, 2.4rem)`), quelli del hub il vecchio study-hub (fino a 4,4–5 rem in home, con la
seconda riga in corsivo e gradiente `--brand-gradient-text`). Font self-hosted da `@fontsource-variable/*` (OFL 1.1).

## Regole di lettura

Le pagine si leggono e si scorrono con gli occhi: **nessun contenuto si toglie o si chiude** (niente `<details>` nuovi
chiusi per default), cambia solo la presentazione. Regole in `src/styles/lettura.css` (strato sopra `originale.css`);
il test `tests/e2e/lettura.spec.ts` verifica che le pagine campione contengano tutte le frasi della build di partenza.

- **Gerarchia**: titolo di pagina (Fisica II, fino a 2,4 rem) → h2 1,4–1,7 rem → h3 1,15–1,25 rem → corpo; pesi 650,
  Geist. **Corpo** della prosa 17 px su telefono e 18 px su desktop, interlinea 1,6, riga ≤ 65ch, spazio tra blocchi
  costante (0,95 em). Grassetti a 700 nel colore pieno del testo: sono gli appigli visivi del testo lungo.
- **Maiuscoletto spaziato solo per gli occhielli** (riga del corso, etichette degli strati, obiettivi, etichette dei
  fatti). Capitoli, titoli degli argomenti e sezioni restano in minuscolo.
- **Un solo livello di riquadri**: la prosa sta sulla tela, senza card attorno; dentro restano figure, richiami e
  dimostrazioni (un livello). Gli **strati della teoria** sono sezioni con filo colorato a sinistra (2 px, tinta dello
  strato) ed etichetta; padding ridotto su telefono.
- **Riga del corso**: pulsante «Indice», percorso e occhiello in una riga (`.course-bar`); sotto i 1024 px il
  percorso mostra solo il livello superiore («← Teoria»), il resto è già nell'intestazione e nel titolo.
- **Indice del corso una volta sola nel DOM**: `<aside popover>` che da 1024 px è la barra laterale e sotto si apre
  come menu (Popover API: Esc, clic fuori, `aria-expanded`; ripiego con `data-open` dove manca).
- **Indici compatti**: indice della pagina con ancore (`.page-toc`) in panoramica, teoria ed esercizi; mappa degli
  argomenti a righe numerate (titolo + descrizione più piccola e più chiara nello stesso blocco, capitoli fissi in alto);
  elenco esercizi a righe raggruppate per capitolo e argomento (`#t-<argomento>`), con stato e difficoltà disegnati in
  CSS (nessun SVG per riga: centinaia di righe per pagina).
- **Coppie etichetta/valore** (`dl.facts`): su telefono etichetta in linea all'inizio del valore, da 40em due colonne.
  Mai tabelle a due colonne strette che vanno a capo parola per parola.
- **Matematica**: inline in sommari e obiettivi con `<InlineTex>` (KaTeX a build-time); nei metadati, nelle opzioni dei
  `<select>` e nei titoli degli esercizi testo semplice con `texToPlain` (`src/lib/inline-tex.ts`). Formule display
  con più respiro e scorrimento orizzontale con ombre ai bordi.
- **Colori**: nel testo i link hanno il colore del testo e la sottolineatura dell'accento; l'accento pieno resta per
  azioni, occhielli e voce corrente. Matite degli appunti piccole e attenuate (piene al passaggio, al tocco o col focus).
- **Telefono**: piè di pagina con i link su tre colonne, meno spazio vuoto tra contenuto e piè di pagina.

## Token

Tutti in `src/styles/tokens.css` (solo variabili). `:root` è il tema scuro, `:root[data-theme="light"]` il chiaro.
Colori del contratto: `--bg --surface --surface-2 --surface-3 --text --text-muted --border --border-strong --accent
--accent-strong --accent-soft --accent-2 --on-accent --success --warning --danger --info --focus --header-bg`.
Marchio e vetro: `--brand-cyan --brand-indigo --brand-violet --brand-gradient --brand-gradient-text --brand-cyan-text
--glass --glass-solid --glass-hi --glass-shadow --hair --hair-strong --orb-opacity`.

- `--accent` per superfici e segni, `--accent-strong` per testo e link, `--accent-soft` per sfondi tenui,
  `--accent-2` per la seconda tinta dei gradienti (barre di avanzamento); `--on-accent` è il testo sopra `--accent`.
- `--border` per divisori, `--border-strong` per bordi di controlli (≥ 3:1 sul fondo).
- Raggi `--radius-s/m/l/xl` (6/9/12/22 px) e `--radius-pill`; ombre `--shadow-1/2`.

Corsi: `html[data-course="<id>"]:not([data-theme="light"])` (scuro) e `html[data-course="<id>"][data-theme="light"]`
in `src/styles/courses/<id>.css`, che ridefiniscono superfici, testo, filetti e accento:

| Corso | Scuro | Chiaro |
|---|---|---|
| Fisica 1 | tela `#07080f`, indaco `#8b93ff` | indaco `#4b50d6` |
| Fisica II | neutri `#0a0a0a`/`#111113`, blu `#4f9dff` | blu `#0062d1` su `#fafafa` |
| Teoria dei Circuiti | blu notte `#0b1530`/`#14244f`, ambra `#ffb84d` | ambra scura `#9a5b00` su `#f6f7fb` |
| Fondamenti di Informatica | ardesia `#0e1116`/`#151b23`, rame `#d69a63` | rame `#96582a` |

Il test `tests/unit/design-tokens.test.ts` verifica tutte le coppie di contrasto in entrambi i temi, anche sul
risultato unito di ogni corso.

## Componenti

CSS in `src/styles/components.css` (blocchi `.nome`, modificatori `--`, stati via ARIA), testo lungo in `prose.css`,
stampa in `print.css`. Le isole Preact usano le stesse classi.

| Componente | Classe / file | Note |
|---|---|---|
| Pulsanti | `.btn`, `--primary`, `--ghost`, `--danger`, `--sm`, `--lg`, `.icon-btn` | `:disabled` e `aria-disabled` |
| Campi | `.field`, `.input`, `.select`, `.textarea`, `.check`, `aria-invalid` | `.input--mono` per numeri |
| Interruttore | `.switch` (checkbox o `role="switch"`) | |
| Badge, chip | `.badge--accent/success/warning/danger/info`, `.chip[aria-pressed]` | |
| Schede | `.tabs__list`, `.tabs__tab[aria-selected]` | |
| Controllo segmentato | `.segmented > button[aria-pressed]` | |
| Avanzamento | `.progress`, `.progress__fill` con `--value` | `role="progressbar"` |
| Dialogo, toast | `.dialog` (su `<dialog>`), `.toast-region`, `.toast[data-tone]` | |
| Tabella dati | `.data-table-wrap > .data-table`, `.num` | intestazione fissa |
| Callout | `Callout.astro` (`nota`, `attenzione`, `errore`, `ok`, `esame`) | icona + titolo |
| Strati | `Layer.astro` (`intuizione`, `formalismo`, `esempio`, `errori`) | simbolo + colore |
| Formula | `Formula.astro` (`tex`, slot o collezione `formulas`) | ancora `#f-<id>`, numero |
| Figura | `Figure.astro` | didascalia numerata |
| Note a margine | `<aside class="sidenote">` in `.reading--margin` | nel margine da 1440 px |
| Indice argomenti | `TopicCard.astro` in `<ol class="topic-index">` (indice della teoria); `.topic-map` (panoramica) | righe compatte, capitoli fissi |
| Navigazione | `Header` (prop `course`: barra del corso), `Footer`, `Breadcrumbs` (`data-parent`), `CourseNav`, `TopicNav`, `Pagination` (prop `middle`), `PageHeader`, `.course-bar`, `.page-toc` | |
| Varie | `SkipLink`, `ThemeToggle`, `LangSwitch`, `SearchButton`, `ReportError`, `FallbackNotice`, `Icon`, `BrandMark` | `BrandMark` è la V con gradiente (prop `gradientId` se compare due volte) |
| Vetro | `.glass` (solo area hub) | pannelli, statistiche, card dei corsi; ripiego opaco senza `backdrop-filter` |
| Sfondo | `.bg-orbs > .orb.orb--1/2/3 + .bg-orbs__grid` | inserito da `BaseLayout` fuori dai corsi |

Layout: `BaseLayout` (meta, hreflang, canonical, icone), `CourseLayout` (accento, indice del corso una volta sola:
barra laterale da 1024 px e menu popover sotto, riga unica con indice, percorso e occhiello — prop `eyebrow` —,
colonna di lettura, "Segnala un errore"), `PrintLayout`
(`variant`: `formulary`, `theory`, `exam`).

**Ricerca**: `SearchButton` è nascosto finché la ricerca non imposta `html[data-search="ready"]`; il clic e il tasto
"/" emettono `sh:search-open` su `document`.

**Icone**: set a tratto 24×24 disegnato per il sito (`Icon.astro`); solo dove aiutano a riconoscere un'azione.
Nessun logo di marchi terzi.

## Cosa evitare

- Vetro, sfere e gradienti dentro i corsi: lì valgono le superfici piatte di Fisica II.
- Testo colorato sopra il vetro senza verificarne il contrasto anche con le sfere sotto (chiaro e scuro).
- `filter: blur()` animati o immagini di sfondo: le sfere sono gradienti radiali.
- Emoji decorative e icone generiche in testa a ogni card; testo riempitivo ("Scopri di più", "Benvenuto!").
- Colori fuori dai token, `!important` fuori da utilità, movimento ridotto e stampa, Tailwind.
- Regole globali sugli `svg` (rompono frecce e radici di KaTeX).
- Formule in immagini: sempre KaTeX a build-time.
