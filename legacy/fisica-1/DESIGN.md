---
version: 1
name: fisica1-orale-trainer-design
description: "Sistema di design di «Fisica 1 — Orale Trainer»: un'unica pagina dark, sempre in tema scuro, costruita su un fondo quasi-nero bluastro (#05060c) con aurora animata, griglia prospettica e scanline. Le superfici sono vetro semitrasparente con bordi hairline lavanda; l'identità cromatica è una coppia ciano (#3ce6ff) + violetto (#8b93ff → #c86bff) usata su gradienti, bagliori e stati attivi. Tipografia di sistema (nessun webfont, l'app deve aprirsi offline con doppio clic), numeri tabellari, monospace per timer e punteggi. Il registro è «HUD sci-fi da cabina di pilotaggio»: denso di informazioni ma con gerarchia netta, micro-animazioni ovunque e molleggio elastico su ogni interazione."

colors:
  canvas: "#05060c"
  canvas-soft: "#080a12"
  card: "rgba(18,21,36,.6)"
  card-hover: "rgba(26,30,50,.74)"
  surface-1: "rgba(255,255,255,.045)"
  surface-2: "rgba(255,255,255,.08)"
  surface-3: "rgba(255,255,255,.13)"
  hairline: "rgba(140,160,255,.12)"
  hairline-strong: "rgba(140,170,255,.26)"
  ink: "#eaf0ff"
  ink-muted: "#94a0c0"
  ink-subtle: "#5e688a"
  accent: "#8b93ff"
  accent-light: "#b7bcff"
  accent-violet: "#c483ff"
  accent-cyan: "#3ce6ff"
  accent-magenta: "#ff6bd6"
  accent-soft: "rgba(139,147,255,.16)"
  state-0: "#5a647a"
  state-1: "#ff6b6b"
  state-2: "#ffb454"
  state-3: "#37e0a0"
  area-a: "#7fb0ff"
  area-b: "#4fe3ac"
  area-c: "#ffc266"
  area-d: "#cf9bff"

gradients:
  grad: "linear-gradient(135deg,#6d7bff 0%,#a366ff 60%,#c86bff 100%)"
  grad-neon: "linear-gradient(135deg,#5cc8ff 0%,#8b7bff 45%,#c86bff 100%)"
  grad-txt: "linear-gradient(115deg,#9fe9ff 0%,#b7bcff 40%,#e0a8ff 100%)"
  grad-soft: "linear-gradient(135deg,rgba(109,123,255,.20),rgba(200,107,255,.13))"

typography:
  root: "17px"
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif"
  mono: "'SF Mono', ui-monospace, Menlo, Consolas, monospace"
  display:
    fontSize: 3.6rem
    fontWeight: 800
    fontFamily: mono
    use: "timer di simulazione, punteggio finale del quiz"
  h2:
    fontSize: 1.9rem
    fontWeight: 800
    lineHeight: 1.22
    letterSpacing: -0.02em
    fill: grad-txt
  scheda-title:
    fontSize: 1.62rem
    fontWeight: 800
    fill: grad-txt
  question:
    fontSize: 1.16rem
    fontWeight: 750
    lineHeight: 1.45
  h3:
    fontSize: 1.14rem
    fontWeight: 700
  body:
    fontSize: 1rem
    lineHeight: 1.65
    letterSpacing: 0.005em
  small:
    fontSize: 0.86rem
    color: ink-muted
  eyebrow:
    fontSize: 0.72rem
    fontWeight: 800
    letterSpacing: 0.16em
    textTransform: uppercase
    color: accent-cyan
  tag:
    fontSize: 0.7rem
    fontWeight: 800
    letterSpacing: 0.03em

radius:
  xs: 10px
  sm: 14px
  md: 20px
  pill: 999px

motion:
  duration: 0.24s
  spring: "cubic-bezier(.34,1.4,.5,1)"
  view-enter: "0.5s spring"
  flip: "0.62s spring"
  aurora: "26s ease-in-out infinite alternate"
  grid-drift: "34s linear infinite"

layout:
  content-max: 840px
  sidebar: 250px
  tabbar-height: 66px
  breakpoint-sidebar: 900px
  breakpoint-footer: 520px
---

## Panoramica

Applicazione a **pagina singola** (`index.html`, nessun build, nessun backend, nessun account) per preparare l'orale di Fisica 1. Otto viste — Oggi, Argomenti, Simula, Quiz, Teoria, Flashcard, Dimostra, Formule — vivono nella stessa pagina e si alternano con `.vista.attiva`; le schede argomento si aprono in un overlay a schermo intero.

Il sistema è **dark-only** (`color-scheme: dark`, nessun tema chiaro): l'unica eccezione è la stampa, che ribalta tutto su carta bianca e mostra il solo formulario.

**Caratteristiche chiave**

- Fondo quasi-nero bluastro `#05060c` con tre livelli decorativi fissi dietro il contenuto: griglia prospettica in dissolvenza radiale, aurora a quattro macchie animata, scanline orizzontali all'`.022` di opacità.
- Superfici in **vetro**: fondo semitrasparente + `backdrop-filter: blur(16px) saturate(1.25)` + hairline lavanda a 1px + riflesso interno sul bordo superiore.
- Accento **doppio ma coordinato**: ciano `#3ce6ff` per stato attivo, focus concettuale e dati; violetto `#8b93ff → #c86bff` per azioni primarie e riempimenti. Non sono due palette, sono i due estremi dello stesso gradiente.
- **Bagliore come segnale, non come decorazione**: il glow appare su hover, su elemento attivo e sui valori di progresso — mai a riposo su superfici statiche.
- Titoli e numeri grandi sono **testo in gradiente** (`grad-txt`) con `drop-shadow` colorato: è la firma visiva del progetto.
- Ogni riga interattiva risponde con **spostamento fisico** (`translateX(3–4px)` sulle liste, `translateY(-2px)` sui bottoni primari) e rimbalzo elastico `cubic-bezier(.34,1.4,.5,1)`.
- Emoji usate come icone dei tab e dei titoli: scelta deliberata, zero peso, zero sprite, coerente su iOS e desktop.

## 1. Atmosfera

- **Densità: 7/10** — «cabina di pilotaggio». La dashboard mostra countdown, barra di preparazione, quattro anelli d'area e piano del giorno senza scroll infinito. Le schede argomento sono invece lunghe e sezionate.
- **Varianza: 4/10** — impianto simmetrico e prevedibile: contenuto in colonna singola centrata a 840px. La sorpresa sta nel colore e nel movimento, non nella struttura.
- **Motion: 7/10** — fluido e continuo: aurora e griglia si muovono sempre, le barre hanno uno scorrimento infinito del gradiente, ogni comparsa è a cascata.

Il tono è **studio notturno**: si usa al buio, la sera prima dell'esame, spesso da telefono. Da qui il fondo profondo, i contrasti alti sui testi e i target touch generosi.

## 2. Colore

### Fondali

| Token | Valore | Uso |
|---|---|---|
| `--bg` | `#05060c` | Fondo pagina, sotto tutti i livelli decorativi |
| `--bg-soft` | `#080a12` | Fondo dell'overlay scheda a schermo intero |
| `--card` | `rgba(18,21,36,.6)` | Vetro delle card e delle righe argomento |
| `--card-2` | `rgba(26,30,50,.74)` | Vetro in hover |
| `--surface` / `-2` / `-3` | bianco al `.045` / `.08` / `.13` | Scala di elevazione per chip, bottoni, tracce |

Il nero puro `#000000` non compare mai. La profondità nasce dalla **scala di trasparenze bianche** su fondo scuro, non da ombre nette.

### Bordi

- `--border` `rgba(140,160,255,.12)` — hairline standard a 1px su ogni superficie.
- `--border-2` `rgba(140,170,255,.26)` — hairline in hover / stato aperto.

I bordi sono **lavanda, mai grigi**: è ciò che tiene insieme vetro e accento.

### Testo (contrasto misurato su `--bg`)

| Token | Valore | Contrasto | Uso consentito |
|---|---|---|---|
| `--fg` | `#eaf0ff` | 17.7:1 | Testo corrente, titoli, numeri |
| `--fg2` | `#94a0c0` | 7.8:1 | Testo secondario, didascalie, legende |
| `--fg3` | `#5e688a` | 3.7:1 | **Solo** decorativo o ≥ 1.15rem: frecce, meta minime, riga finale del footer. Sotto AA per il testo piccolo |

### Accenti

- `--cyan` `#3ce6ff` (13.5:1) — tab attivo, eyebrow di sezione, valori numerici, freccia in hover, countdown.
- `--accent` `#8b93ff` (7.4:1) e `--accent-chiaro` `#b7bcff` (11.2:1) — testi su selezione, bordo dei passi di derivazione.
- `--grad` — riempimento delle azioni primarie e degli stati selezionati (segmentato, voti, chip).
- `--grad-neon` — barre di avanzamento e riga luminosa del footer.
- `--grad-txt` — riempimento **solo testuale**: `h2`, titolo scheda, timer, punteggio, brand.

Regola: **un elemento porta un solo gradiente**. Un bottone primario in `--grad` non ha anche testo in `--grad-txt`.

### Semantica: i 4 stati di studio

`--st0` `#5a647a` mai visto · `--st1` `#ff6b6b` debole · `--st2` `#ffb454` consolidato · `--st3` `#37e0a0` padroneggiato.

Compaiono come pallino da 11px con alone del proprio colore, come bordo interno sinistro da 3px (`.bordo-st-*`) e come colore degli anelli. **La scala è ordinale**: rosso → arancio → verde non è un giudizio, è una progressione. Non introdurre altri colori in questa scala.

### Semantica: le 4 aree del programma

`--areaA` `#7fb0ff` cinematica · `--areaB` `#4fe3ac` energia · `--areaC` `#ffc266` corpo rigido · `--areaD` `#cf9bff` fluidi e termodinamica.

Usate solo nei tag (`.tag-A…D`, testo pieno + fondo al 13–14% + bordo al 34%) e negli anelli di copertura. Non usarle per bottoni o fondali.

## 3. Tipografia

- **Nessun webfont.** Stack di sistema per il corpo, `SF Mono`/`ui-monospace` per timer e punteggi. L'app deve funzionare aperta da file locale, senza rete; l'unica risorsa esterna è MathJax per le formule.
- Radice a `17px`, interlinea `1.65`, `letter-spacing: .005em`: testo lungo (definizioni, derivazioni) leggibile da telefono.
- Titoli con `line-height: 1.22` e `letter-spacing: -.02em`; gerarchia affidata a **peso e colore**, non alla sola dimensione: 800 per i titoli, 750 per le domande, 650–550 per il corpo delle righe.
- **Numeri sempre `font-variant-numeric: tabular-nums`** — countdown, percentuali, punteggi, timer, meta del quiz. Nessun numero che balla mentre si aggiorna.
- **Eyebrow** (`.etichetta-sez`, `.quiz-tipo-tag`, `h4` della spiegazione): `.68–.76rem`, maiuscolo, tracking `.12–.16em`, ciano. È l'etichetta di sistema dell'interfaccia.
- Le formule LaTeX vivono in `mjx-container` con `overflow-x: auto`: **la formula scorre, la pagina no**.

## 4. Superfici, profondità e forme

| Livello | Trattamento | Uso |
|---|---|---|
| 0 | Nessun fondo, nessun bordo | Testo corrente, liste puntate |
| 1 | `--surface` + hairline, raggio `--r-xs` 10px | Chip, checklist, opzioni di quiz |
| 2 | `--card` + blur 16px + hairline + `--shadow`, raggio `--r` 20px | Card, `details.sezione`, righe argomento (raggio `--r-sm` 14px) |
| 3 | `--grad-soft` + bordo lavanda al 30% + `--shadow` + `--glow` | Avvisi e blocco «L'idea in sintesi» |
| 4 | Vetro con blur 18–22px e saturazione 1.4–1.5 | Header mobile, tab bar, barra sticky della scheda |

- **Raggi**: 20px per i contenitori, 14px per righe e bottoni, 10px per i chip, 999px per tag e pillole. Nessun angolo vivo, nessun raggio superiore a 20px.
- **Ombre**: `--shadow` `0 14px 44px -16px rgba(0,0,0,.7)` — diffusa, mai netta. Il bagliore `--glow` / `--glow-cyan` è additivo e **compare solo in hover o su stato attivo**.
- Ogni card porta un `::before` che disegna un bordo interno luminoso in alto (`linear-gradient(180deg,rgba(255,255,255,.06),transparent 40%)` in mask-composite): è il riflesso del vetro, va conservato quando si crea un nuovo contenitore.

## 5. Componenti

**Bottoni** — `min-height: 48px`, raggio 14px, peso 650. Base: `--surface-2`, hover `--surface-3`, `active: scale(.96)`.
- `.btn-primario`: riempimento `--grad`, testo bianco, ombra violetta proiettata + luce interna in alto; in hover sale di 2px, cambia l'alone verso il ciano e passa un riflesso obliquo (`sheen`, 0.9s).
- `.btn-fantasma`: nessun fondo, testo `--fg2`, si accende in hover. Per le azioni secondarie.
- `.btn-largo`: larghezza piena, per l'azione conclusiva di una card.
- Una sola azione primaria per schermata.

**Righe di lista** (`.riga-argomento`, `.chip-arg`, `.checklist-sim li`) — vetro + hairline, `min-height` 48–56px, e in hover **scivolano a destra** di 3–4px mentre la freccia diventa ciano. È il gesto ricorrente dell'app.

**Tag** — pillola `.7rem`/800, colore d'area su fondo tinto al 13–14%. Sempre testo, mai solo colore.

**Sezioni collassabili** (`details.sezione`) — marker nativo rimosso, chevron `›` che ruota di 90° all'apertura; da aperta il bordo passa a `--border-2` e il titolo a `--accent-chiaro`. Il corpo entra con `corpoIn` (0.32s).

**Controllo segmentato** (`.segmentato`) — contenitore `--surface` con padding 5px; il segmento selezionato prende `--grad` e `--glow`. Usato per difficoltà, tipo di quiz, filtri d'area.

**Opzioni di quiz** (`.quiz-opt`) — riga da 54px con lettera in quadrato da 28px; corretta = bordo `--st3` + alone verde, errata = bordo `--st1`, le altre scendono a `opacity: .42`. Il feedback è **immediato e cromatico**, mai un modale.

**Barre di avanzamento** (`.barra-totale`, `.quiz-barra`) — traccia `--surface-2` con hairline, riempimento in gradiente animato in scorrimento infinito, alone ciano, transizione della larghezza in `1s` con molla.

**Anelli di progresso** — SVG da 76px ruotato di -90°, `stroke-linecap: round`, `drop-shadow` viola; la percentuale al centro **conta da 0** con easing cubico (saltato se `prefers-reduced-motion`).

**Flashcard** — scena in `perspective: 1600px`, carta che ruota di 180° in 0.62s con molla, due facce in `backface-visibility: hidden`.

**Overlay scheda** — copre lo schermo, entra da 26px sotto con `scale(.985)`; barra superiore sticky in vetro con `safe-area-inset-top`.

**Simulazioni** — canvas a larghezza piena su fondo `rgba(12,15,26,.72)`, controlli in righe da 46px con label al 34%, slider `accent-color: var(--accent)` e valore a destra in ciano tabellare.

**Stati vuoti** — `.vuoto`: testo in corsivo `--fg2` che dice cosa fare, mai «nessun dato».

## 6. Layout

- Contenuto in **colonna singola**, `max-width: 840px`, padding `20px 16px 44px`. Vale anche per l'overlay scheda e per il footer: tutto incolonnato sulla stessa misura.
- **Mobile (< 900px)**: header sticky in vetro con titolo e countdown; navigazione in **tab bar fissa in basso** alta 66px + `safe-area-inset-bottom`, otto voci icona-sopra-etichetta, indicatore luminoso sul bordo superiore del tab attivo.
- **Desktop (≥ 900px)**: l'header sparisce, la tab bar diventa **sidebar da 250px** a tutta altezza con brand in gradiente in cima e countdown spinto in fondo con `margin-top: auto`; il `body` guadagna `padding-left` pari alla sidebar. L'indicatore attivo si sposta sul bordo sinistro.
- Griglie: anelli `repeat(4,1fr)`, griglia di stati `repeat(2,1fr)`, azioni del footer in `flex-wrap`. Niente `calc()` percentuali, niente colonne che non collassano.
- `overflow-x: hidden` sul body e scroll orizzontale **confinato** dove serve (formule, formulario, canvas).
- **Stampa**: fondo bianco, decorazioni e navigazione nascoste (`.no-print`), visibile il solo `#vista-formulario` con card a bordo grigio e testo nero.

## 7. Motion

- Durata standard `--dur .24s`; molla `--spring cubic-bezier(.34,1.4,.5,1)` su tutto ciò che si sposta o si scala.
- **Ingresso vista**: `appare` 0.5s da `translateY(14px) scale(.99)`. **Liste**: cascata con `.stagger`.
- **Loop perpetui**, tutti lenti e a bassa opacità: aurora 26s, deriva della griglia 34s, scorrimento del gradiente nelle barre 3–4s.
- Si animano solo `transform`, `opacity`, `stroke-dashoffset`, `width` delle barre e `background-position`. Mai `top`/`left`.
- Feedback tattile: `active { transform: scale(.96) }` sui bottoni, `.98` sul primario dopo il sollevamento.
- **`prefers-reduced-motion` è vincolante**: azzera tutte le durate, ferma aurora e griglia, disattiva l'ingresso vista e il conteggio delle percentuali. Ogni nuova animazione deve avere una via d'uscita in questo blocco.

## 8. Responsive

- Collasso a colonna singola sotto i 768px: nell'app è già la norma, ma vale per ogni nuova griglia.
- Target touch **minimo 44px** (48px per i bottoni, 46px per le righe slider). Nessuna eccezione.
- `env(safe-area-inset-*)` su header, tab bar e barra della scheda: l'app si usa su iPhone con notch.
- Sotto i 520px il footer si impila e i suoi bottoni vanno a larghezza piena.
- Nessuno scroll orizzontale di pagina: se un contenuto sfora (formula, canvas, tabella) scorre dentro il proprio contenitore.

## 9. Do / Don't

**Do**

- Riusare i token `var(--…)`: colore, raggio, durata e molla esistono già, non reintrodurli come letterali.
- Dare a ogni nuovo contenitore hairline `--border` + raggio `--r` + il riflesso `::before`.
- Accendere il ciano per «attivo / selezionato / valore», il violetto per «azione».
- Scrivere i numeri in tabellare e le etichette di sistema in maiuscoletto ciano.
- Prevedere lo stato vuoto e quello di errore prima di scrivere il markup.
- Aggiungere ogni nuova animazione anche al blocco `prefers-reduced-motion`.
- Mantenere l'italiano in interfaccia e nei nomi di classe (`.riga-argomento`, `.quiz-opt`): il codice è tutto in italiano.

**Don't**

- Niente nero puro, niente grigi caldi: la scala neutra è bluastra e chiusa.
- Niente terzo colore d'accento. Verde, arancio e rosso sono **riservati** agli stati di studio; i quattro colori d'area sono riservati alle aree.
- Niente bagliore a riposo: il glow è uno stato, non uno stile.
- Niente doppio gradiente sullo stesso elemento, niente `grad-txt` sotto `1rem` (illeggibile).
- Niente ombre nette o bordi da 2px+ sui contenitori.
- Niente scroll orizzontale di pagina, niente `h-screen`/`100vh` per sezioni piene su iOS: usare `100dvh`.
- Niente librerie CSS o webfont: il file resta uno solo e deve aprirsi offline.
- Niente spinner circolari generici: l'attesa qui non esiste, i dati sono locali.
- Niente testo in `--fg3` sotto `1rem` per contenuti che vanno letti davvero.

**Deroghe consapevoli alle regole «anti-slop» generiche**

Questo progetto **usa deliberatamente** tre pattern che le linee guida generiche vietano: bagliori neon, testo in gradiente sui titoli ed emoji come icone. Sono l'identità dell'app — un HUD sci-fi — non un residuo di generazione automatica. Chi interviene sul design li rispetti invece di «ripulirli».

## 10. Lacune note

- **Nessuno stile di focus.** Non esiste una regola `:focus-visible` in tutto il file: la navigazione da tastiera non ha anello visibile. Da colmare con un anello ciano a 2px + offset, prima di qualsiasi altro lavoro di accessibilità.
- **Emoji senza etichetta.** Le icone dei tab e i simboli nei titoli non hanno `aria-hidden` né testo alternativo: uno screen reader le legge tutte.
- `--fg3` (3.7:1) e `--st0` (3.4:1) restano sotto AA per il testo piccolo.
- **MathJax da CDN**: al primo caricamento serve rete; senza, le formule restano in LaTeX grezzo. Nessun fallback previsto.
- Il contrasto dei testi dentro le superfici in vetro è calcolato su `--bg`, non sulla composizione reale con l'aurora sotto: sui punti più chiari dell'aurora il margine si riduce.
