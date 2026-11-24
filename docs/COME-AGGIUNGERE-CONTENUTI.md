# Come aggiungere contenuti

Guida pratica per scrivere o correggere teoria, esercizi, formule, flashcard e domande d'esame. Regole generali
(bilinguismo, originalità, glossario) in [`CONTRIBUTING-CONTENT.md`](CONTRIBUTING-CONTENT.md); contratto completo
degli schemi in [`ARCHITECTURE.md`](ARCHITECTURE.md#content-collections-contratto). Gli esempi sono presi dal
repository: aprili accanto a questa guida.

## Dove stanno i file di un corso

I quattro corsi hanno questi id: `teoria-circuiti`, `fondamenti-informatica`, `fisica-1`, `fisica-2`.

| Cosa | File | Esempio |
| --- | --- | --- |
| Dati del corso (titolo, frase breve, esame, date) | `src/content/courses/<corso>.yaml` | `src/content/courses/fisica-1.yaml` |
| Argomenti (titolo, riassunto, obiettivi, capitolo) | `src/content/topics/<corso>/<NN>-<argomento>.yaml` | `src/content/topics/teoria-circuiti/03-porta-e-bipolo.yaml` |
| Teoria | `src/content/theory/<corso>/<argomento>.it.mdx` e `.en.mdx` | `src/content/theory/teoria-circuiti/porta-e-bipolo.it.mdx` |
| Esercizi | `src/content/exercises/<corso>/<argomento>.yaml` | `src/content/exercises/teoria-circuiti/porta-e-bipolo.yaml` |
| Generatori di esercizi | `src/courses/<corso>/generators/*.ts` | `src/courses/fisica-1/generators/energia.ts` |
| Formule del formulario | `src/content/formulas/<corso>.yaml` | `src/content/formulas/teoria-circuiti.yaml` |
| Flashcard (ripasso) | `src/content/cards/<corso>/<argomento>.yaml` | `src/content/cards/fisica-1/pendolo-semplice.yaml` |
| Figure | kit in `src/figures/` | guida in [`FIGURE.md`](FIGURE.md) |

<!-- TODO(R4): i formulari stanno passando a una pagina per capitolo; aggiornare questa sezione dopo il merge. -->

## Regole che valgono ovunque

- **Due lingue**: ogni testo è `{ it: …, en: … }`. Se manca l'inglese il sito mostra l'italiano con un avviso, ma
  il test dei contenuti fallisce (salvo voci in `tests/content/translation-whitelist.json`). Termini tecnici dal
  glossario `src/i18n/glossary.yaml`.
- **Matematica sempre tra `$…$`** (KaTeX): `$p = v\,i$`, `$R_{eq}$`. Nei file YAML tra virgolette doppie la
  barra va raddoppiata (`"$p=v\\,i$"`); tra virgolette singole o in un blocco `>-` no. Nel testo italiano i
  decimali hanno la virgola: in una formula si scrive `8{,}314` (senza graffe KaTeX aggiunge uno spazio).
  Una formula scritta male fa fallire la build (`tests/content/formule-grezze.test.ts`).
- **Id stabili**: kebab-case (`porta-e-bipolo`, `q-i-009`), unici nel corso, **mai rinominati** dopo la
  pubblicazione. Progressi, ripasso, appunti e «Segna come studiato» sono salvati nel browser sotto questi id:
  rinominarne uno fa perdere i dati a chi studia. Per correggere un contenuto si cambia il testo, non l'id.
- **«Segna come studiato»** (R13) usa l'**id dell'argomento**; le flashcard nuove entrano nel ripasso solo
  quando il loro argomento è segnato come studiato. Una flashcard deve quindi avere il `topic` giusto.
- **Obiettivi**: ogni esercizio e flashcard cita almeno un obiettivo del suo argomento (`<argomento>.<n>`); la
  padronanza si calcola su questi.
- **Originalità**: testi, esercizi e figure originali. Gli esercizi «tipo appello» riproducono solo la
  tipologia (`origin: tipologia-appello`), mai il testo del docente.

## Argomenti: elenco fisso

Elenco, nomi, ordine e capitoli degli argomenti sono **esattamente** quelli dei siti originali e **non si
toccano**: un test li confronta con `legacy/<corso>/` (estrattori in `tools/legacy-topics/`). Si possono invece
correggere `summary` e testi degli obiettivi, e aggiungere obiettivi in coda con il numero successivo
(`porta-e-bipolo.4`), senza rinumerare quelli esistenti.

## Teoria di un argomento

Due file con lo stesso nome, uno per lingua. Frontmatter e quattro strati, in quest'ordine:

```mdx
---
course: teoria-circuiti
topic: porta-e-bipolo
lang: it
---

<Layer kind="intuizione">

<div data-note-id="porta-e-bipolo-intuizione-1">

Un bipolo è una «scatola nera» con due morsetti: … guardare il segno di $v\,i$.

</div>

</Layer>

<Layer kind="formalismo">
…
</Layer>

<Layer kind="esempio">
…
</Layer>

<Layer kind="errori">
…
</Layer>
```

- Strati: `intuizione` (Intuizione), `formalismo`, `esempio` (esempio svolto), `errori` (errori tipici). Titolo
  facoltativo con `title="…"`.
- Ogni paragrafo sta in un `<div data-note-id="…">` con un id **stabile** e unico nella pagina: è il punto a cui
  si agganciano gli appunti personali. Per un paragrafo nuovo si usa un id nuovo (per esempio il numero
  successivo), senza rinumerare gli altri.
- Righe vuote prima e dopo i tag (`<Layer>`, `<div>`), altrimenti MDX non interpreta il Markdown all'interno.
- Componenti disponibili: `Layer`, `Formula`, `Figure`, `Callout`, `Circuit`, `Diagram`, `DiagramLive`
  (figure e circuiti: [`FIGURE.md`](FIGURE.md), [`SIM.md`](SIM.md)). Un link a un altro argomento dello stesso corso
  si scrive relativo: `[algebra di Boole](../algebra-di-boole/)`.
- In fondo alla pagina il pulsante «Segna come studiato» compare da solo.

## Esercizio statico

Si aggiunge in coda al file dell'argomento. Due forme: **scelta multipla** (`choices`, almeno una `correct: true`)
o **risposta numerica/testuale** (`answer`). Lo svolgimento (`steps`) è obbligatorio.

```yaml
- id: q-i-009                      # stabile e unico nel corso
  topic: porta-e-bipolo
  objectives:
    - porta-e-bipolo.2
  difficulty: 1                    # 1, 2 o 3
  kind: static
  statement:
    it: "Con la convenzione degli utilizzatori la potenza $p=v\\,i$ è:"
    en: "With the passive sign convention the power $p=v\\,i$ is:"
  steps:
    - title: { it: Spiegazione, en: Explanation }
      body:
        it: 'Corrente entrante nel morsetto $+$: $p=vi$ è assorbita.'
        en: 'Current entering the $+$ terminal: $p=vi$ is absorbed.'
  choices:
    - text: { it: assorbita dal bipolo, en: absorbed by the one-port }
      correct: true
      explanation: { it: …, en: … }  # facoltativa
    - text: { it: erogata dal bipolo, en: delivered by the one-port }
      correct: false
  origin: originale
```

Con risposta numerica (da `src/content/exercises/fisica-2/corrente-stazionaria.yaml`, `quiz-q207`):

```yaml
  answer:
    - label: { it: Risultato, en: Result }
      value: 6
      unit: Ω
      tol: 0.03                      # tolleranza relativa; senza, vale 0.01 (1 %)
```

- Le alternative si rimescolano; `fixedLast: true` tiene in fondo «Tutte le precedenti».
- Per risposte come codici binari o nomi: `kind: text` e le forme alternative in `accept`.
- Figura facoltativa: `figure:` con **una sola** fra `netlist` (circuito), `diagram` (kit delle figure) e `svg`.

## Esercizio generato (generatore)

Un generatore crea un esercizio diverso a ogni seme. Si scrive in TypeScript in `src/courses/<corso>/generators/`
e si registra da solo (`loadAllGenerators()` importa tutti i file della cartella). Esempio ridotto da
`src/courses/fisica-1/generators/energia.ts`:

```ts
import { registerGenerator } from '../../../engine/generators/registry';
import { createRng } from '../../../engine/random';
import { L, ans, exercise, q, step } from '../lib/gen';

export const frenata = registerGenerator({
  id: 'fisica-1/lavoro-frenata',                 // <corso>/<nome>, stabile
  topic: 'lavoro-energia-cinetica',
  objectives: ['lavoro-energia-cinetica.3', 'lavoro-energia-cinetica.6'],
  generate(seed, lang) {
    const r = createRng(seed);                   // mai Math.random: stesso seme, stesso esercizio
    const m = r.nice(600, 2000, 2);
    // … calcoli …
    return exercise(L(lang, 'Testo italiano con $m = …$', 'English text with $m = …$'), [step(…)], [ans(…)]);
  },
});
```

Poi una voce nel file YAML dell'argomento, che punta al generatore:

```yaml
- id: lavoro-frenata-variante
  topic: lavoro-energia-cinetica
  objectives:
    - lavoro-energia-cinetica.1
    - lavoro-energia-cinetica.2
  difficulty: 2
  kind: generated
  generator: fisica-1/lavoro-frenata
  origin: tipologia-appello
```

Un test (`tests/unit/formule-generatori.test.ts`) esegue ogni generatore su più semi e lingue e controlla che le
formule siano valide; i corsi hanno anche test propri in `tests/unit/<corso>/`. Le funzioni d'aiuto di ogni
corso (`lib/gen.ts`, `lib/figures.ts`, …) sono diverse: parti da un generatore dello stesso corso.

## Formula del formulario

Voce in `src/content/formulas/<corso>.yaml` (un solo file per corso):

```yaml
- id: lambda
  topic: modellamento-costanti-concentrate
  latex: \lambda=\frac{c}{f}          # TeX puro, senza $
  label: { it: Lunghezza d'onda, en: Wavelength }
  symbols:                            # facoltativi: simboli e unità, uso, errore tipico, nota
    it: λ lunghezza d'onda [m]; c ≈ 3·10⁸ m/s; f frequenza [Hz]
    en: λ wavelength [m]; c ≈ 3·10⁸ m/s; f frequency [Hz]
  usage: { it: 'Verifica del modello a costanti concentrate: serve L ≪ λ.', en: … }
  pitfall: { it: Applicare Kirchhoff ad alta frequenza., en: … }
```

Se `latex` contiene parole italiane (`\text{…}`) o decimali con la virgola, aggiungi `latexEn` con la versione
inglese. Nei campi di testo (`symbols`, `usage`, …) la matematica va tra `$…$`.

## Flashcard (scheda di ripasso)

Voce in `src/content/cards/<corso>/<argomento>.yaml`:

```yaml
- id: pendolo-semplice-esposizione
  topic: pendolo-semplice
  objectives: [pendolo-semplice.1, pendolo-semplice.2]
  kind: orale                          # definizione | formula | orale | concetto
  front: { it: "Esponi all'orale: «Pendolo semplice».", en: … }
  back:
    it: >-
      Testo della risposta, anche su più paragrafi, con **grassetto**, elenchi e $\omega = \sqrt{g/L}$.
    en: >-
      …
```

## Domanda d'esame

La prova simulata pesca dal materiale del corso secondo `exam.structure` in `src/content/courses/<corso>.yaml`:
una domanda per voce. La `kind` della voce decide il tipo: `crocetta`/`quiz`/`vero-falso`… → scelta multipla;
`orale`/`domande`/`teoria`… → domanda aperta (flashcard o esercizio in autovalutazione); `esercizio`/`problema` →
esercizio con risposta (regole complete in [`ENGINE.md`](ENGINE.md)). Quindi:

- **una domanda in più per la prova** = un esercizio o una flashcard del tipo giusto nell'argomento giusto;
- **una tipologia precisa** (per esempio «schema da completare» di Fondamenti di Informatica): la voce ha un
  `tag` e gli esercizi adatti lo dichiarano in `examTags`:

```yaml
# src/content/courses/fondamenti-informatica.yaml
    - label: { it: 'Esercizio: schema da completare', en: 'Exercise: diagram to complete' }
      points: 2.5
      kind: esercizio
      tag: schema-da-completare

# src/content/exercises/fondamenti-informatica/aritmetica-hardware.yaml
- id: aritmetica-hardware-es-1
  …
  examTags:
    - tabella-espressione
```

Ogni `tag` deve avere almeno un esercizio e ogni `examTags` una voce: lo controlla il test dei contenuti.
Le **date degli appelli** vanno in `examDates` (`- 2027-01-20`); quelle passate si nascondono da sole.

## Provare in locale

Serve Node 22 (`.nvmrc`). Una volta: `npm ci`.

```sh
npm run dev            # sito su http://localhost:4321/study-hub/ (si aggiorna a ogni salvataggio)
npm run test:content   # schema, id, obiettivi, traduzioni, argomenti legacy (veloce)
npm test               # tutti i test unitari e dei contenuti
npm run check          # astro check + TypeScript (per i generatori)
npm run lint           # ESLint
npm run format         # Prettier: sistema la formattazione (YAML compresi; i .md sono esclusi)
npm run build          # build completa in dist/
```

Prima di una PR: `npm run check && npm run lint && npm run format:check && npm test && npm run build`.

## Cosa controlla la CI

A ogni PR il workflow **CI** (`.github/workflows/ci.yml`) esegue:

1. **Controlli**: `astro check`, `tsc`, ESLint, Prettier (YAML compresi; i file `.md` sono esclusi in `.prettierignore`).
2. **Dipendenze**: `npm audit`.
3. **Test unitari** (vitest) con soglie di copertura sul motore.
4. **Build e test dei contenuti**: build con la CSP, schema e riferimenti, traduzioni, argomenti legacy, formule
   grezze, peso delle pagine, link interni.
5. **Playwright**: pagine campione, accessibilità (axe) in tema chiaro e scuro, confronto visivo.
6. **Lighthouse**: ≥ 0,95 in tutte le categorie.

Solo su `main` e solo con tutto verde parte la **Pubblicazione su GitHub Pages**. Se un test visivo fallisce
perché la pagina è cambiata di proposito, le baseline si rigenerano con il workflow «Aggiorna baseline visive»
(o un commit con `[baseline]` nel messaggio).
