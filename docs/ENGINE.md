# Motore di studio

Motore comune a tutti i corsi: correzione degli esercizi, ripasso spaziato, prove d'esame, padronanza,
piano di studio, appunti, esportazione/QR. Il codice di dominio è TypeScript puro in `src/engine/`
(testato con vitest, copertura ≥ 90 % delle righe); l'interfaccia sono isole Preact in `src/islands/`;
le PR di corso **non** riscrivono nulla di tutto questo: forniscono contenuti (collections) e generatori.

## Cosa ottiene un corso senza scrivere codice

Appena esistono `src/content/courses/<id>.yaml` e i contenuti, le pagine generiche
`src/pages/[lang]/[anno]/[course]/…` producono per ogni corso e lingua:

| Percorso | Componente | Isole |
|---|---|---|
| `esercizi/` | `CourseExercises` | `ExerciseList` (client:load) |
| `esercizi/<topic>/` | `TopicExercises` | `ExercisePlayer` (client:visible), `NotesLayer` |
| `ripasso/` | `CourseReview` | `ReviewSession` |
| `esame/` | `CourseExam` | `ExamRunner` (dati da `dati.json`) |
| `progressi/` | `CourseProgress` | `ExamDatePicker`, `StudyPlan`, `MasteryMap` |
| `dati.json` | endpoint | dati del corso localizzati, testi già in HTML |

Pagine globali: `/<lang>/ripasso/` (coda FSRS di tutti i corsi), `/<lang>/appunti/` (tutti gli appunti),
`/<lang>/i-miei-dati/` (export/import, QR), `/<lang>/stampa/prova/?…` (stampa della prova, `noindex`).
La home mostra `ProgressDashboard` (via `HomeDashboard.astro`) quando esiste almeno un corso.

Un corso che vuole una pagina diversa crea un file **statico** allo stesso percorso (es.
`src/pages/[lang]/anno-2/fisica-2/esame/index.astro`): le rotte statiche hanno la precedenza su quelle dinamiche.
Può comunque riusare i componenti:

```astro
---
import CourseLayout from '../../../../../layouts/CourseLayout.astro';
import CourseExam from '../../../../../components/course/CourseExam.astro';
import { getCourse } from '../../../../../lib/course-data';
const lang = Astro.params.lang as 'it' | 'en';
const course = await getCourse('fisica-2');
---
<CourseLayout lang={lang} course={course} title="…">
  <div class="container page">
    <p>Introduzione specifica del corso…</p>
    <CourseExam lang={lang} courseId="fisica-2" />
  </div>
</CourseLayout>
```

## Appunti sulle pagine di teoria e formulario

Ogni elemento con `data-note-id` (id stabile, `^[a-z0-9][a-z0-9\-.:/]*$`) riceve il pulsante appunti;
`data-note-label` dà un'etichetta leggibile (altrimenti il titolo o il testo dell'elemento). Una volta per pagina:

```astro
---
import Notes from '../components/course/Notes.astro';
---
<section data-note-id="teoria/legge-di-gauss/flusso" data-note-label="Flusso del campo" id="flusso">…</section>
<Notes lang={lang} scope="fisica-2" />
```

Se l'elemento ha un `id`, il link da "I miei appunti" porta esattamente lì. `NotesLayer` riceve i testi
dalle props (nessun dizionario nel bundle): pesa ~1,6 KB gzip + Preact, compatibile col budget della teoria.
Negli elementi resi da un'altra isola, un `<span data-note-slot />` vuoto indica dove mettere il pulsante.

## Contenuti: cosa il motore si aspetta

- **Esercizi** (`exercises`): `answer[]` con `value` numero (anche `0.002`) o stringa complessa (`'3+4j'`,
  `'5∠53.13'`); `unit` qualunque unità riconosciuta da `units.ts` (anche composte: `V/m`, `Ω·m`, `rad/s`);
  `tol` relativa (default 0,01). In alternativa `choices[]` (una o più corrette). Nessuna risposta e nessuna
  scelta = esercizio in **autovalutazione** (la soluzione si confronta a mano).
- Testi (`statement`, `steps`, `front`/`back`): Markdown minimo (paragrafi, elenchi, `**`, `*`, `` ` ``) e
  matematica `$…$`, `$$…$$`, `\(…\)`, `\[…\]`, resi a build-time con KaTeX (`strict: error`: un TeX
  sbagliato rompe la build, come per la teoria). L'HTML nei testi viene sempre sottoposto a escape.
- **Figure**: `figure.svg` è inserito così com'è (contenuto del repository, fidato).
- **Prove**: `courses.exam.structure` = una domanda per voce. La `kind` decide il tipo:
  `quiz|crocett…|scelta…|test|vero-falso|multipl…` → scelta multipla; `oral…|domand…|teoria|definizion…|
  concett…|apert…|dimostrazion…` → domanda aperta (flashcard o esercizio in autovalutazione); tutto il resto
  (`esercizio`, `problema`, …) → esercizio con risposta. Senza materiale del tipo richiesto si ripiega sugli altri.
  `points` assenti ovunque = 1 punto per domanda. Voto in trentesimi solo per la prova completa.
- Ordine: argomenti come in `topics.order`; esercizi per argomento, difficoltà, id; carte per argomento, id.

## Generatori

```ts
// src/courses/teoria-circuiti/generators/partitore.ts
import { registerGenerator } from '../../../engine/generators/registry';
import { createRng } from '../../../engine/random';

export default registerGenerator({
  id: 'teoria-circuiti/partitore',
  topic: 'resistori',
  objectives: ['resistori.2'],
  generate(seed, lang) {
    const r = createRng(seed);
    const R1 = r.e12(2, 4); // valore E12 tra 100 Ω e 10 kΩ
    const V = r.nice(5, 24, 2);
    // …
    return { statement: '…$V_2$…', steps: [{ title: '…', body: '…' }], answer: [{ label: 'V_2', value: V2, unit: 'V' }] };
  },
});
```

Nel browser `loadCourseGenerators(courseId)` carica solo i generatori di quel corso (chunk separati);
KaTeX viene caricato in modo lazy solo se il testo generato contiene matematica. Il seme iniziale nella
pagina è `hashString(id)` (SSR e client coincidono); "Nuova variante" usa `randomSeed()`.
`Rng` offre `next/int/float/pick/shuffle/chance/sample/weighted/sign/nice/e12`; `deriveSeed(...parti)` e
`hashString` per semi derivati.

## API del motore (src/engine)

| Modulo | Cosa offre |
|---|---|
| `units.ts` | `parseNumber` (virgola/punto, `e`, `·10^`, apici, frazioni, migliaia), `parseUnit`/`parseQuantity` (prefissi SI e binari, unità composte, °C/°F affini, angolo come dimensione propria: `Hz ≠ rad/s`), `convert`, `formatNumber`/`formatSI`, complessi (`parseComplex` cartesiana `3+j4`/`3-4i`, polare `5∠53°`/`5∠0,9 rad`/`∠π/2`, esponenziale `5e^(j30°)`; aritmetica `cAdd…cParallel`; `formatComplex`) |
| `grading.ts` | `gradeField`, `gradeAnswers` (più campi, credito medio), `gradeChoice` (multipla: (giuste−sbagliate)/corrette), tolleranze relativa/assoluta, `sigFigs`, `diagnoseNumber` → codici `sign`, `factor-2pi`, `factor-sqrt2`, `factor-2`, `reciprocal`, `magnitude`, `unit-prefix`, `unit-wrong`, `unit-missing`, `rounding`, `conjugate`, `phase`, `modulus`, `deg-rad`, `sigfigs`; testi in `FEEDBACK` (IT/EN) |
| `fsrs.ts` | FSRS-5 (parametri di default, compatibile v4): `review`, `preview`, `retrievability`, `buildQueue` (scadute dalla meno ricordata, poi nuove), `stats`, `formatInterval`; opzione `notAfter` per non programmare oltre l'esame |
| `progress.ts` | aree `progress` (tentativi per esercizio, `exerciseStatus`) e `srs` (carte + log) con `save*`/`load*`/`sanitize*` |
| `exam.ts` | `assembleExam` (deterministico; modalità `completa`/`personalizzata`/`mirata`; `forcedRefs` per ristampare), `gradeExam`, `analyze`, timer (`remainingMs`, `formatClock`), sessione e storico (area `exam`), `printQuery`/`parsePrintQuery` |
| `mastery.ts` | `computeMastery` (esercizi, prove, carte; decadimento con emivita 21 g; prior), `topicMastery`, `weakSpots`, `buildStudyPlan` (giorni fino all'esame, carico, richiami, simulazioni) |
| `notes.ts` | appunti per scope (area `notes`), `allNotes`, `searchNotes`, `notesToMarkdown` |
| `exportImport.ts` | `buildExport` (schema `{format:'study-hub', version:1, data}`), `validateExport`, `applyImport` (`merge` area per area o `replace`), `summarize` |
| `qr.ts` | `compressText` (deflate + base64url), frame `SH1:i/n:crc:…` (`splitFrames`, `FrameCollector`), `encodeForQr` (null oltre 24 QR → file), `decodePasted`, `matrixToSvg` |
| `rich.ts` | `renderRich` (Markdown minimo + matematica iniettata), `plainText` |
| `storage.ts` | (PR1) + `readAll`, `clearScope`, `usageBytes`, `isStorageAvailable`; l'evento `sh:storage` con scope `*` notifica tutti (dopo un'importazione) |
| `migrate.ts` | (PR1) + `registerMigration(m)` per aggiungere voci da `src/courses/<id>/migrations.ts`, `jsonTransform` |

Aree di storage: per corso `progress`, `srs`, `exam`, `notes`, `settings` (`dailyMinutes`); globali
`examDates` (`{ <courseId>: 'AAAA-MM-GG' }`), `settings` (`newPerDay`), `theme`, `lang`, `migrations`.

## Dati per le isole (src/lib/course-data.ts)

`getCourseData(courseId, lang)` → `CourseData` (`src/engine/course-data.ts`): riepilogo del corso
(`paths` con tutti i percorsi già localizzati), argomenti con obiettivi, esercizi e carte con testi in HTML
e flag `fallback` quando manca l'inglese. `courseSummary`, `coursePaths`, `courseTopics`, `exerciseData`,
`cardData`, `courseStaticPaths` sono esportati per pagine personalizzate.

## Stampa delle prove

`ExamRunner` apre `/<lang>/stampa/prova/?corso=…&seme=…&modo=…&q=e:id,c:id&parte=prova|soluzioni`: la
pagina ricostruisce la stessa prova (seme + riferimenti) da `dati.json`, la impagina con `print.css` e
chiama `window.print()` (il browser offre "Salva come PDF"). Le soluzioni sono un documento separato.

## Test

- `tests/unit/engine/*.test.ts` — motore (`npm run test:coverage`, soglia 90 % righe).
- `tests/e2e/engine/engine.spec.ts` — tutte le isole sul corso finto `tests/fixtures/content` (+ generatore
  `tests/fixtures/generators/`), compilato con `npm run build:fixtures` in `dist-fixtures/` e servito sulla porta
  4322 (progetto Playwright `engine`), con axe WCAG 2.2 AA in tema chiaro e scuro.
  In locale: `npm run build:fixtures && PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test --project=engine`.
