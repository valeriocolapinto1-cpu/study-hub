# Sistema di design

Direzione "Quaderno" (perché: [DIRECTION.md](DIRECTION.md)). Tutti i componenti sono visibili in `/it/stile/`
(pagina noindex, usata dai test visivi e axe).

## Principi

1. **Il contenuto è l'interfaccia.** Testo, formule e figure vengono prima; l'interfaccia si fa da parte.
2. **Struttura senza scatole.** Gerarchia con tipografia, filetti e spazio; i riquadri solo per oggetti interattivi
   (esercizi, campi, dialoghi) o richiami.
3. **Un accento per corso, e basta.** Il resto è inchiostro su carta; i colori di stato hanno sempre un'icona o un testo.
4. **Leggibile ovunque.** Misura ~68ch, contrasto AA in chiaro e scuro, aree di tocco ≥ 24 px (quasi sempre 40 px),
   focus sempre visibile, movimento ridotto rispettato.
5. **Stampabile.** Formulari, teoria e prove d'esame hanno una resa A4 dedicata.

## Tipografia

| Ruolo | Famiglia | Uso |
|---|---|---|
| `--font-serif` | Source Serif 4 (opsz, wght) | titoli, testo lungo, esercizi, valori in evidenza |
| `--font-sans` | Geist | interfaccia: navigazione, pulsanti, etichette, didascalie, tabelle |
| `--font-mono` | Geist Mono | dati, numerazioni, occhielli, badge, codice |

Scala fluida `--step--2 … --step-5` (320 → 1280 px). Testo corrente a `--step-0` (16,5 → 18,4 px), interlinea
`--leading-body` 1,65; titoli `--leading-tight`. Nel testo lungo cifre in stile antico (`oldstyle-nums`), nelle tabelle
cifre tabellari. Font self-hosted da `@fontsource-variable/*` (OFL 1.1).

## Token

Tutti in `src/styles/tokens.css` (solo variabili). Colori: `--bg --surface --surface-2 --text --text-muted --border
--border-strong --accent --accent-strong --accent-soft --on-accent --success --warning --danger --info --focus`.
Regole d'uso:

- `--accent` per superfici e segni (pulsante primario, barre, indicatori), `--accent-strong` per testo e link,
  `--accent-soft` per sfondi tenui; `--on-accent` è il testo sopra `--accent`.
- `--border` per divisori, `--border-strong` per bordi di controlli (≥ 3:1 sul fondo).
- Spazi `--space-3xs … --space-3xl` (4 → 104 px), raggi `--radius-s/m/l` (4/6/10 px), ombre `--shadow-1/2` solo per
  elementi sovrapposti (dialoghi, toast).

Tema: `html[data-theme="light"|"dark"]`, senza attributo segue il sistema. Accento: `html[data-course="<id>"]` con
`src/styles/courses/<id>.css` (solo `--accent*`), caricati tutti da `BaseLayout`. Il test
`tests/unit/design-tokens.test.ts` verifica i contrasti di ogni coppia, in entrambi i temi e per ogni corso.

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
| Indice argomenti | `TopicCard.astro` in `<ol class="topic-index">` | |
| Navigazione | `Header`, `Footer`, `Breadcrumbs`, `CourseNav`, `TopicNav`, `Pagination`, `PageHeader` | |
| Varie | `SkipLink`, `ThemeToggle`, `LangSwitch`, `SearchButton`, `ReportError`, `FallbackNotice`, `Icon`, `BrandMark` | |

Layout: `BaseLayout` (meta, hreflang, canonical, icone), `CourseLayout` (accento, indice laterale da 1024 px,
cassetto `<dialog>` su mobile, percorso automatico, colonna di lettura, "Segnala un errore"), `PrintLayout`
(`variant`: `formulary`, `theory`, `exam`).

**Ricerca**: `SearchButton` è nascosto finché la ricerca non imposta `html[data-search="ready"]`; il clic e il tasto
"/" emettono `sh:search-open` su `document`.

**Icone**: set a tratto 24×24 disegnato per il sito (`Icon.astro`); solo dove aiutano a riconoscere un'azione.
Nessun logo di marchi terzi.

## Cosa evitare

- Gradienti decorativi, vetro smerigliato, bagliori, ombre colorate, sfondi animati.
- Emoji decorative e icone generiche in testa a ogni card.
- Griglie di card tutte uguali: preferire elenchi con filetti, tabelle, indici.
- Testo riempitivo ("Scopri di più", "Benvenuto!") e titoli che ripetono il contesto.
- Colori fuori dai token, `!important` fuori da utilità e stampa, Tailwind.
- Regole globali sugli `svg` (rompono frecce e radici di KaTeX).
- Formule in immagini: sempre KaTeX a build-time.
