/**
 * Dati descrittivi del corso dal sito originale (data/syllabus.json, appelli, archivio, errori,
 * risorse, pagine Corso/Esame/FAQ), in italiano e inglese. Le etichette di affidabilità
 * (UFFICIALE, STORICO, …) sono quelle del sito originale.
 */
export type L10n = { it: string; en: string };
export type Reliability =
  'ufficiale' | 'storico' | 'editore' | 'non-ufficiale' | 'inferenza' | 'da-verificare';

export const RELIABILITY: Record<Reliability, { label: L10n; tone: string; text: L10n }> = {
  ufficiale: {
    label: { it: 'Ufficiale', en: 'Official' },
    tone: 'success',
    text: {
      it: 'fonti ufficiali del corso o catalogo dei corsi',
      en: 'official course sources or the course catalogue',
    },
  },
  storico: {
    label: { it: 'Storico', en: 'Past exams' },
    tone: 'info',
    text: {
      it: "ricavato dai testi d'esame 2000–2009 e dalla struttura delle soluzioni 2015–2024: indicazione, non regola",
      en: 'derived from the 2000–2009 exam papers and the structure of the 2015–2024 solutions: a hint, not a rule',
    },
  },
  editore: {
    label: { it: 'Editore', en: 'Publisher' },
    tone: 'info',
    text: { it: 'schede di editori e librerie', en: 'publisher and bookshop pages' },
  },
  'non-ufficiale': {
    label: { it: 'Non ufficiale', en: 'Unofficial' },
    tone: 'warning',
    text: { it: 'materiale di terzi', en: 'third-party material' },
  },
  inferenza: {
    label: { it: 'Inferenza', en: 'Inference' },
    tone: 'accent',
    text: { it: 'deduzione ragionata', en: 'reasoned deduction' },
  },
  'da-verificare': {
    label: { it: 'Da verificare', en: 'To be verified' },
    tone: 'warning',
    text: { it: 'da confermare con il docente', en: 'to be confirmed with the lecturer' },
  },
};

export const FACTS: { k: L10n; v: L10n; r: Reliability }[] = [
  {
    k: { it: 'Corso di laurea', en: 'Degree programme' },
    v: {
      it: 'Ingegneria Elettronica (L-8), 2º anno, 1º semestre, obbligatorio per tutti gli orientamenti',
      en: 'Electronic Engineering (L-8), 2nd year, 1st semester, compulsory for all tracks',
    },
    r: 'ufficiale',
  },
  {
    k: { it: 'CFU e ore', en: 'Credits and hours' },
    v: {
      it: '6 CFU: 60 ore in aula, 80 di studio individuale',
      en: '6 ECTS: 60 hours in class, 80 of individual study',
    },
    r: 'ufficiale',
  },
  {
    k: { it: 'Settore', en: 'Field' },
    v: {
      it: 'ING-IND/31 (ora IIET-01/A), elettrotecnica',
      en: 'ING-IND/31 (now IIET-01/A), electrical engineering',
    },
    r: 'ufficiale',
  },
  {
    k: { it: 'Prerequisiti', en: 'Prerequisites' },
    v: {
      it: 'Analisi, algebra lineare, elettromagnetismo',
      en: 'Calculus, linear algebra, electromagnetism',
    },
    r: 'ufficiale',
  },
  {
    k: { it: 'Obiettivo', en: 'Goal' },
    v: {
      it: "Analizzare e mettere a punto semplici circuiti (filtri, reti di adattamento) e comprendere gli aspetti generali del trasporto dell'energia elettrica",
      en: 'Analyse and tune simple circuits (filters, matching networks) and understand the general aspects of electric power transport',
    },
    r: 'ufficiale',
  },
  {
    k: { it: 'Fuori programma', en: 'Not in the syllabus' },
    v: {
      it: 'Sistemi trifase, circuiti magnetici, macchine elettriche',
      en: 'Three-phase systems, magnetic circuits, electrical machines',
    },
    r: 'ufficiale',
  },
  {
    k: { it: 'Fonti che fanno fede', en: 'Authoritative sources' },
    v: {
      it: 'La pagina del corso nel catalogo, il portale degli esami e le comunicazioni dei docenti: per programma, orari e modalità d’esame valgono solo quelle',
      en: 'The course page in the catalogue, the exam portal and the lecturers’ announcements: only these are authoritative for syllabus, timetable and exam rules',
    },
    r: 'ufficiale',
  },
];

/** Pesi dei blocchi del programma (stima dalla struttura storica delle prove, non un dato ufficiale). */
export const BLOCK_WEIGHTS: { group: string; weight: number }[] = [
  { group: 'I', weight: 5 },
  { group: 'II', weight: 15 },
  { group: 'III', weight: 25 },
  { group: 'IV', weight: 18 },
  { group: 'V', weight: 17 },
  { group: 'VI', weight: 20 },
];

export const EXAM_KNOWN: { text: L10n; r: Reliability[] }[] = [
  {
    text: {
      it: 'La valutazione è un «esame». Dopo lo scritto di ottobre 2026 è prevista una discussione e verbalizzazione; se sia un vero orale per tutti non è specificato.',
      en: 'The assessment is an "exam". After the October 2026 written test there is a discussion and grade recording; whether it is a real oral exam for everyone is not specified.',
    },
    r: ['ufficiale', 'da-verificare'],
  },
  {
    text: {
      it: "Formato storico (testi 2000–2009): un esercizio d'analisi da 30 punti; tre domande per circa 30 punti in totale, più una domanda facoltativa da 3 punti. Spesso ogni domanda ha una parte teorica (enunciato, dimostrazione, spiegazione) e una applicata a un circuito dato.",
      en: 'Historical format (2000–2009 papers): one 30-point analysis exercise; three questions worth about 30 points in total, plus an optional 3-point question. Each question often has a theory part (statement, proof, explanation) and a part applied to a given circuit.',
    },
    r: ['storico'],
  },
  {
    text: {
      it: "Per evitare copiature c'erano gruppi (A–I / L–Z), compiti A e B, fino a 5 versioni dell'esercizio nello stesso appello.",
      en: 'To prevent copying there were groups (A–I / L–Z), papers A and B, up to 5 versions of the exercise in the same session.',
    },
    r: ['storico'],
  },
  {
    text: {
      it: "Esercizio recente (2015–2024): una raccolta di 14 esercizi risolti di 11 appelli; è disponibile solo l'esercizio, non le domande.",
      en: 'Recent exercise (2015–2024): a collection of 14 solved exercises from 11 sessions; only the exercise is available, not the questions.',
    },
    r: ['storico'],
  },
  {
    text: {
      it: "Appunti di studenti del 2022/23 parlano di una «parte teorica dell'esame»: è un indizio, non una regola.",
      en: 'Student notes from 2022/23 mention a "theory part of the exam": a hint, not a rule.',
    },
    r: ['non-ufficiale'],
  },
  {
    text: {
      it: "Il sito usa il formato storico per le prove simulate, ma non è garantito per l'esame attuale. Il voto in trentesimi è solo una stima proporzionale.",
      en: 'The site uses the historical format for mock exams, but it is not guaranteed for the current exam. The mark out of 30 is only a proportional estimate.',
    },
    r: ['inferenza'],
  },
];

export const EXAM_UNKNOWN: L10n = {
  it: "Durata, punteggi e soglie attuali, forma dell'orale o della discussione, calcolatrice o formulario ammessi, esonero in itinere, modalità di verbalizzazione.",
  en: 'Current duration, points and pass marks, form of the oral exam or discussion, whether a calculator or formula sheet is allowed, mid-term tests, grade recording.',
};

export const LECTURER_QUESTIONS: L10n[] = [
  {
    it: "L'esame è solo scritto o c'è un orale? Come funziona la discussione dopo lo scritto?",
    en: 'Is the exam written only, or is there an oral part? How does the discussion after the written test work?',
  },
  {
    it: 'Il testo comprende ancora le domande di teoria? Quanti punti vale ciascuna parte?',
    en: 'Does the paper still include theory questions? How many points is each part worth?',
  },
  { it: 'Qual è la durata della prova?', en: 'How long is the test?' },
  {
    it: 'Sono ammessi calcolatrice, formulario o appunti?',
    en: 'Are a calculator, formula sheet or notes allowed?',
  },
  { it: "Esistono esoneri o prove in itinere quest'anno?", en: 'Are there mid-term tests this year?' },
  {
    it: 'La raccolta di esercizi risolti è la versione aggiornata? Ne usciranno altre?',
    en: 'Is the collection of solved exercises up to date? Will more be published?',
  },
  {
    it: 'Quali sono le prossime date degli appelli di gennaio/febbraio 2027?',
    en: 'What are the next exam dates in January/February 2027?',
  },
  {
    it: 'Qual è la 2ª edizione di riferimento del Martinelli–Salerno, visto che è fuori catalogo?',
    en: 'Which 2nd edition of Martinelli–Salerno is the reference, since it is out of print?',
  },
];

export const PROCEDURE: L10n[] = [
  {
    it: 'Semplifica la parte difficile (nullore, doppio bipolo, trasformatore) con il suo equivalente.',
    en: 'Simplify the hard part (nullor, two-port, transformer) with its equivalent.',
  },
  {
    it: 'Regime per $t<0$: continua con $C$ aperto e $L$ in corto, sinusoide con i fasori; frequenze diverse separatamente.',
    en: 'Steady state for $t<0$: DC with $C$ open and $L$ shorted, sinusoid with phasors; different frequencies separately.',
  },
  {
    it: 'Condizione iniziale $v_C(0^-)$ o $i_L(0^-)$: il valore a $t=0$, non il modulo del fasore.',
    en: 'Initial condition $v_C(0^-)$ or $i_L(0^-)$: the value at $t=0$, not the magnitude of the phasor.',
  },
  {
    it: 'Circuito per $t>0$: indipendenti spenti, condizione iniziale come generatore; $R_{eq}$ con il generatore di prova.',
    en: 'Circuit for $t>0$: independent sources off, initial condition as a source; $R_{eq}$ with the test source.',
  },
  {
    it: '$\\tau=R_{eq}C$ o $L/R_{eq}$ e $K=v_{out}(0^+)$: $V_{out}(s)=K/(s+1/\\tau)$.',
    en: '$\\tau=R_{eq}C$ or $L/R_{eq}$ and $K=v_{out}(0^+)$: $V_{out}(s)=K/(s+1/\\tau)$.',
  },
  {
    it: 'Antitrasformata: $v_{out}(t)=K\\,e^{-t/\\tau}u_{-1}(t)$.',
    en: 'Inverse transform: $v_{out}(t)=K\\,e^{-t/\\tau}u_{-1}(t)$.',
  },
  {
    it: "Risposta su tutto l'asse dei tempi: $t<0$ e $t>0$.",
    en: 'Response over the whole time axis: $t<0$ and $t>0$.',
  },
  {
    it: 'Verifica: $\\tau>0$, continuità di $v_C$ o $i_L$ (non di $v_{out}$), segni e ordini di grandezza.',
    en: 'Check: $\\tau>0$, continuity of $v_C$ or $i_L$ (not of $v_{out}$), signs and orders of magnitude.',
  },
];

export const MISTAKES: {
  id: string;
  title: L10n;
  step: number;
  wrong: L10n;
  right: L10n;
  topics: string[];
}[] = [
  {
    id: 'E1',
    step: 1,
    topics: ['generatori-controllati', 'teorema-di-thevenin'],
    title: { it: 'Spegnere anche i generatori controllati', en: 'Switching off the controlled sources too' },
    wrong: {
      it: 'Per $R_{th}$ di un circuito con un VCCS ($i=\\tfrac12v_o$ tra $o$ e massa) e $R_1=2\\,\\Omega$ spengo anche il VCCS: $R_{th}=R_1=2\\,\\Omega$.',
      en: 'For $R_{th}$ of a circuit with a VCCS ($i=\\tfrac12v_o$ between $o$ and ground) and $R_1=2\\,\\Omega$ I switch off the VCCS too: $R_{th}=R_1=2\\,\\Omega$.',
    },
    right: {
      it: 'Si spengono solo gli *indipendenti*. Il VCCS equivale a $2\\,\\Omega$ verso massa e resta: $R_{th}=2\\parallel2=1\\,\\Omega$ (verifica con generatore di prova: $v/i=1$).',
      en: 'Only the *independent* sources are switched off. The VCCS is equivalent to $2\\,\\Omega$ to ground and stays: $R_{th}=2\\parallel2=1\\,\\Omega$ (check with a test source: $v/i=1$).',
    },
  },
  {
    id: 'E2',
    step: 7,
    topics: ['circuiti-primo-ordine'],
    title: { it: 'Dimenticare la risposta per $t<0$', en: 'Forgetting the response for $t<0$' },
    wrong: {
      it: '$v_{out}(t)=6\\,e^{-t/6}\\,u_{-1}(t)$ come unica risposta.',
      en: '$v_{out}(t)=6\\,e^{-t/6}\\,u_{-1}(t)$ as the only answer.',
    },
    right: {
      it: "Si chiede $v_{out}$ per *tutto l'asse dei tempi*: $v_{out}(t)=\\begin{cases}6&t<0\\\\6\\,e^{-t/6}&t>0\\end{cases}$.",
      en: '$v_{out}$ is asked over *the whole time axis*: $v_{out}(t)=\\begin{cases}6&t<0\\\\6\\,e^{-t/6}&t>0\\end{cases}$.',
    },
  },
  {
    id: 'E3',
    step: 3,
    topics: ['fasori', 'sovrapposizione-frequenze-diverse'],
    title: {
      it: 'Condizione iniziale sbagliata in regime sinusoidale',
      en: 'Wrong initial condition in sinusoidal steady state',
    },
    wrong: {
      it: 'RC con $v_C=\\tfrac12\\cos t+\\tfrac12\\sin t$ per $t<0$: prendo $v_C(0^-)=|\\dot V_C|=\\tfrac1{\\sqrt2}\\approx0{,}71$.',
      en: 'RC with $v_C=\\tfrac12\\cos t+\\tfrac12\\sin t$ for $t<0$: I take $v_C(0^-)=|\\dot V_C|=\\tfrac1{\\sqrt2}\\approx0.71$.',
    },
    right: {
      it: "Serve il valore all'istante $t=0$, cioè la parte reale del fasore: $v_C(0^-)=\\tfrac12$.",
      en: 'You need the value at the instant $t=0$, i.e. the real part of the phasor: $v_C(0^-)=\\tfrac12$.',
    },
  },
  {
    id: 'E4',
    step: 2,
    topics: ['applicabilita-fasori', 'sovrapposizione-frequenze-diverse'],
    title: { it: 'Sommare fasori di frequenze diverse', en: 'Adding phasors at different frequencies' },
    wrong: {
      it: 'Con $v_g=\\cos t+\\cos2t$ calcolo $\\dot V_C=\\dfrac{1+1}{1+j}$ sommando i fasori.',
      en: 'With $v_g=\\cos t+\\cos2t$ I compute $\\dot V_C=\\dfrac{1+1}{1+j}$ by adding the phasors.',
    },
    right: {
      it: 'I due generatori hanno frequenze diverse: si calcolano separatamente ($\\omega=1$ e $\\omega=2$) e si sommano le risposte *nel tempo*.',
      en: 'The two sources have different frequencies: they are computed separately ($\\omega=1$ and $\\omega=2$) and the responses are added *in time*.',
    },
  },
  {
    id: 'E5',
    step: 8,
    topics: ['relazioni-costitutive', 'teorema-di-thevenin'],
    title: {
      it: 'Confondere la continuità di $v_C$/$i_L$ con quella di $v_{out}$',
      en: 'Confusing the continuity of $v_C$/$i_L$ with that of $v_{out}$',
    },
    wrong: {
      it: 'Uscita sul resistore: impongo $v_{out}(0^+)=v_{out}(0^-)=4\\,\\mathrm V$.',
      en: 'Output across the resistor: I impose $v_{out}(0^+)=v_{out}(0^-)=4\\,\\mathrm V$.',
    },
    right: {
      it: "È continua la variabile di stato ($v_C$ o $i_L$), non l'uscita in generale. Con $C$ sostituito da un generatore pari a $v_C(0^-)$ e indipendenti spenti si ottiene $v_{out}(0^+)=-8\\,\\mathrm V$.",
      en: 'It is the state variable ($v_C$ or $i_L$) that is continuous, not the output in general. Replacing $C$ with a source equal to $v_C(0^-)$ and switching off the independent sources gives $v_{out}(0^+)=-8\\,\\mathrm V$.',
    },
  },
  {
    id: 'E6',
    step: 4,
    topics: ['condizioni-iniziali-generatori'],
    title: {
      it: 'Usare male il generatore del modello di Laplace',
      en: 'Misusing the source of the Laplace model',
    },
    wrong: {
      it: 'Condensatore con $v_C(0^-)=4$: metto in serie un generatore $4$ (non diviso per $s$).',
      en: 'Capacitor with $v_C(0^-)=4$: I put a source $4$ in series (not divided by $s$).',
    },
    right: {
      it: 'Il generatore è $v_C(0^-)/s=4/s$ in serie a $1/(sC)$ (oppure $Cv_C(0^-)$ in parallelo a $sC$).',
      en: 'The source is $v_C(0^-)/s=4/s$ in series with $1/(sC)$ (or $Cv_C(0^-)$ in parallel with $sC$).',
    },
  },
  {
    id: 'E7',
    step: 1,
    topics: ['teorema-di-thevenin'],
    title: {
      it: "Applicare Thevenin senza verificare l'accoppiamento",
      en: 'Applying Thévenin without checking for coupling',
    },
    wrong: {
      it: 'Riduco con Thevenin un bipolo il cui generatore controllato è pilotato da una grandezza del carico.',
      en: 'I reduce with Thévenin a one-port whose controlled source is driven by a quantity of the load.',
    },
    right: {
      it: "Thevenin richiede un bipolo lineare non accoppiato con il carico (nessun controllo incrociato): altrimenti si risolve il circuito intero (o si include il carico nell'equivalente).",
      en: 'Thévenin requires a linear one-port not coupled with the load (no cross control): otherwise solve the whole circuit (or include the load in the equivalent).',
    },
  },
  {
    id: 'E8',
    step: 1,
    topics: ['doppi-bipoli-z-y'],
    title: {
      it: 'Segni e convenzioni di verso nelle matrici dei doppi bipoli',
      en: 'Signs and direction conventions in two-port matrices',
    },
    wrong: {
      it: '$Z=\\begin{pmatrix}4&3\\\\3&5\\end{pmatrix}$ con $i_2$ presa *uscente* dalla porta 2 e uso $v_2=3i_1+5i_2$.',
      en: '$Z=\\begin{pmatrix}4&3\\\\3&5\\end{pmatrix}$ with $i_2$ taken as *leaving* port 2, and I use $v_2=3i_1+5i_2$.',
    },
    right: {
      it: 'Le matrici $Z$, $Y$ sono definite con correnti *entranti* in entrambe le porte; con $i_2$ uscente va cambiato il segno: $v_2=3i_1-5i_2$.',
      en: 'The $Z$, $Y$ matrices are defined with currents *entering* both ports; with $i_2$ leaving, the sign must be changed: $v_2=3i_1-5i_2$.',
    },
  },
  {
    id: 'E9',
    step: 2,
    topics: ['potenza-complessa'],
    title: {
      it: 'Valore efficace e valore di picco nelle potenze',
      en: 'RMS and peak values in power computations',
    },
    wrong: {
      it: '$v=20\\cos\\omega t$, $i=4\\cos(\\omega t-\\varphi)$, $\\cos\\varphi=0{,}6$: $P=20\\cdot4\\cdot0{,}6=48\\,\\mathrm W$.',
      en: '$v=20\\cos\\omega t$, $i=4\\cos(\\omega t-\\varphi)$, $\\cos\\varphi=0.6$: $P=20\\cdot4\\cdot0.6=48\\,\\mathrm W$.',
    },
    right: {
      it: 'Con valori di picco serve $\\tfrac12$: $P=\\tfrac12\\cdot80\\cdot0{,}6=24\\,\\mathrm W$ (con efficaci $P=VI\\cos\\varphi$).',
      en: 'With peak values the factor $\\tfrac12$ is needed: $P=\\tfrac12\\cdot80\\cdot0.6=24\\,\\mathrm W$ (with RMS values $P=VI\\cos\\varphi$).',
    },
  },
  {
    id: 'E10',
    step: 8,
    topics: ['stabilita-poli'],
    title: {
      it: "Poli sull'asse immaginario nella stabilità",
      en: 'Poles on the imaginary axis and stability',
    },
    wrong: {
      it: '$D(s)=s^2+4$ ha poli in $\\pm2j$ (parte reale nulla, non positiva): è stabile.',
      en: '$D(s)=s^2+4$ has poles at $\\pm2j$ (zero real part, not positive): it is stable.',
    },
    right: {
      it: "Non è asintoticamente stabile: la risposta oscilla senza smorzarsi (marginale); con poli multipli sull'asse immaginario diverge.",
      en: 'It is not asymptotically stable: the response oscillates without damping (marginal); with multiple poles on the imaginary axis it diverges.',
    },
  },
  {
    id: 'E11',
    step: 6,
    topics: ['poli-complessi-coniugati'],
    title: {
      it: 'Antitrasformate con poli complessi coniugati',
      en: 'Inverse transforms with complex-conjugate poles',
    },
    wrong: {
      it: '$F=\\dfrac{s+3}{s^2+2s+5}$: scrivo $f=e^{-t}(\\cos2t+3\\sin2t)$.',
      en: '$F=\\dfrac{s+3}{s^2+2s+5}$: I write $f=e^{-t}(\\cos2t+3\\sin2t)$.',
    },
    right: {
      it: 'Con $(s+1)^2+4$ il coefficiente del seno è $(b-a\\alpha)/\\omega=(3-1)/2=1$: $f=e^{-t}(\\cos2t+\\sin2t)$.',
      en: 'With $(s+1)^2+4$ the sine coefficient is $(b-a\\alpha)/\\omega=(3-1)/2=1$: $f=e^{-t}(\\cos2t+\\sin2t)$.',
    },
  },
];

export const STUDY_PLAN: { weeks: string; content: L10n; practice: L10n }[] = [
  {
    weeks: '1–2',
    content: {
      it: 'Blocchi I–II: componenti, topologia, Tellegen, nodi e maglie',
      en: 'Blocks I–II: components, topology, Tellegen, nodes and meshes',
    },
    practice: {
      it: 'Reti resistive in continua; nullore e partitori',
      en: 'Resistive DC networks; nullor and dividers',
    },
  },
  {
    weeks: '3–4',
    content: { it: 'Thevenin/Norton e doppi bipoli Z, Y', en: 'Thévenin/Norton and Z, Y two-ports' },
    practice: {
      it: '$V_{th}$ e $R_{th}$ su reti con matrice data',
      en: '$V_{th}$ and $R_{th}$ on networks with a given matrix',
    },
  },
  {
    weeks: '5–6',
    content: { it: 'Fasori, potenze, rifasamento', en: 'Phasors, power, power-factor correction' },
    practice: { it: 'Parte «$t<0$» dell’esercizio', en: 'The "$t<0$" part of the exercise' },
  },
  {
    weeks: '7–9',
    content: {
      it: 'Laplace, funzioni di rete, stabilità, risposta in frequenza, risonanza',
      en: 'Laplace, network functions, stability, frequency response, resonance',
    },
    practice: { it: 'Parte «$t>0$» e domande di teoria', en: 'The "$t>0$" part and theory questions' },
  },
  {
    weeks: '10–12',
    content: { it: 'Prove complete a tempo', en: 'Full timed mock exams' },
    practice: { it: 'Simulazioni d’esame del sito', en: 'The site’s mock exams' },
  },
];

/** Archivio degli appelli storici: solo data e argomenti, con parole nostre (nessun testo d'esame). */
export const ARCHIVE: { date: string; topics: string[]; note?: L10n }[] = [
  { date: '2000-06-01', topics: ['Tellegen', 'fasori', 'potenze'] },
  { date: '2000-06-12', topics: ['massimo trasferimento', 'stabilità', 'connessioni di doppi bipoli'] },
  { date: '2000-07-04', topics: ['Thevenin', 'funzioni di rete', 'circuiti risonanti'] },
  { date: '2000-07-14', topics: ['Laplace', 'costante di tempo', 'potenze'] },
  { date: '2000-09-15', topics: ['stabilità', 'doppi bipoli Z/Y', 'potenze'] },
  { date: '2001-02-13', topics: ['Norton', 'connessioni di doppi bipoli', 'potenze'] },
  { date: '2001-07-03', topics: ['metodo dei nodi', 'risposta in frequenza', 'costante di tempo'] },
  { date: '2001-10-25', topics: ['circuiti risonanti', 'nullore'] },
  { date: '2002-02-13', topics: ['Thevenin', 'fasori', 'potenze'] },
  {
    date: '2002-04-29',
    topics: ['Thevenin / Norton', 'fasori', 'Laplace', 'stabilità', 'risposta in frequenza'],
    note: { it: 'gruppi A–I e L–Z', en: 'groups A–I and L–Z' },
  },
  {
    date: '2002-06-19',
    topics: ['massimo trasferimento', 'Tellegen', 'rifasamento', 'risposta in frequenza'],
  },
  { date: '2002-07-17', topics: ['doppi bipoli', 'risposta in frequenza'] },
  { date: '2002-09-18', topics: ['topologia', 'risposta impulsiva', 'costante di tempo'] },
  { date: '2002-10-30', topics: ['Thevenin', 'massimo trasferimento', 'topologia', 'trasformatore ideale'] },
  {
    date: '2003-04-24',
    topics: ['topologia', 'stabilità', 'risposta in frequenza', 'proprietà dei circuiti'],
  },
  { date: '2003-07-03', topics: ['metodo dei nodi', 'risposta in frequenza', 'doppi bipoli'] },
  {
    date: '2003-09-25',
    topics: ['circuiti risonanti', 'risposta permanente e transitoria', 'proprietà dei circuiti'],
  },
  {
    date: '2003-11-19',
    topics: ['risposta impulsiva', 'risposta in frequenza', 'connessioni', 'teorema di sostituzione'],
  },
  {
    date: '2005-07-12',
    topics: ['topologia', 'potenze', 'risposta permanente e transitoria', 'proprietà dei circuiti'],
  },
  { date: '2007-07-12', topics: ['Tellegen', 'potenze', 'connessioni', 'teorema di sostituzione'] },
  { date: '2007-09-25', topics: ['metodo dei nodi', 'potenze', 'Laplace', 'costante di tempo'] },
  { date: '2008-02-11', topics: ['potenze', 'risposta in frequenza', 'proprietà dei circuiti'] },
  { date: '2008-04-17', topics: ['metodo dei nodi', 'Laplace', 'costante di tempo'] },
  {
    date: '2008-07-07',
    topics: [
      'metodo dei nodi',
      'circuiti risonanti',
      'risposta permanente e transitoria',
      'proprietà dei circuiti',
    ],
  },
  { date: '2008-09-23', topics: ['massimo trasferimento', 'Tellegen', 'doppi bipoli', 'fasori'] },
  {
    date: '2009-04-24',
    topics: [
      'Thevenin / Norton',
      'massimo trasferimento',
      'trasformatore ideale',
      'risposta permanente e transitoria',
      'proprietà dei circuiti',
    ],
    note: { it: 'compiti A e B', en: 'papers A and B' },
  },
];
/** Traduzione degli argomenti dell'archivio (le chiavi sono quelle italiane). */
export const ARCHIVE_TOPICS_EN: Record<string, string> = {
  Tellegen: 'Tellegen',
  fasori: 'phasors',
  potenze: 'power',
  'massimo trasferimento': 'maximum power transfer',
  stabilità: 'stability',
  'connessioni di doppi bipoli': 'two-port connections',
  Thevenin: 'Thévenin',
  'funzioni di rete': 'network functions',
  'circuiti risonanti': 'resonant circuits',
  Laplace: 'Laplace',
  'costante di tempo': 'time constant',
  'doppi bipoli Z/Y': 'Z/Y two-ports',
  Norton: 'Norton',
  'metodo dei nodi': 'node method',
  'risposta in frequenza': 'frequency response',
  nullore: 'nullor',
  'Thevenin / Norton': 'Thévenin / Norton',
  rifasamento: 'power-factor correction',
  'doppi bipoli': 'two-ports',
  topologia: 'topology',
  'risposta impulsiva': 'impulse response',
  'trasformatore ideale': 'ideal transformer',
  'proprietà dei circuiti': 'circuit properties',
  'risposta permanente e transitoria': 'steady-state and transient response',
  connessioni: 'connections',
  'teorema di sostituzione': 'substitution theorem',
};

export const BOOKS: {
  title: string;
  authors: string;
  publisher: string;
  role: L10n;
  note?: L10n;
  r: Reliability;
}[] = [
  {
    title: 'Fondamenti di elettrotecnica, Vol. I e II',
    authors: 'G. Martinelli, M. Salerno',
    publisher: 'Siderea',
    role: { it: 'Riferimento', en: 'Reference' },
    note: {
      it: '2ª ed. (Vol. I 1995, Vol. II 1996); fuori catalogo, reperibile in biblioteca o usato.',
      en: '2nd ed. (Vol. I 1995, Vol. II 1996); out of print, available in libraries or second-hand.',
    },
    r: 'ufficiale',
  },
  {
    title: 'Circuiti elettrici (3ª ed.)',
    authors: 'R. Perfetti',
    publisher: 'Zanichelli, 2024',
    role: { it: 'Teoria', en: 'Theory' },
    note: {
      it: 'ISBN 9788808299666, 672 pp.; svolgimenti digitali per l’editore.',
      en: 'ISBN 9788808299666, 672 pp.; digital solutions from the publisher.',
    },
    r: 'editore',
  },
  {
    title: 'Linear and Nonlinear Circuits (ed. italiana)',
    authors: 'L. O. Chua, C. A. Desoer, E. S. Kuh',
    publisher: 'McGraw-Hill',
    role: { it: 'Teoria', en: 'Theory' },
    r: 'ufficiale',
  },
  {
    title: 'Circuiti elettrici',
    authors: 'C. K. Alexander, M. N. O. Sadiku',
    publisher: 'McGraw-Hill, 2014',
    role: { it: 'Teoria', en: 'Theory' },
    r: 'ufficiale',
  },
  {
    title: 'Esercizi di elettrotecnica',
    authors: 'M. Panella, A. Rizzi',
    publisher: 'Esculapio (2ª ed. 2014; 3ª ed. 2022, ISBN 9788893852876)',
    role: { it: 'Esercizi', en: 'Exercises' },
    r: 'editore',
  },
];
export const BOOKS_NOTE: L10n = {
  it: 'Per questi libri non esiste un PDF legale gratuito. Il sito non rimanda a siti di download non autorizzati: sono spesso illegali e a volte pericolosi.',
  en: 'There is no free legal PDF of these books. The site does not link to unauthorised download sites: they are often illegal and sometimes dangerous.',
};
export const RESOURCES: {
  title: string;
  by: string;
  lang: string;
  kind: L10n;
  licence: string;
  url: string;
  covers: string[];
  note: L10n;
}[] = [
  {
    title: 'MIT OpenCourseWare 6.002 Circuits and Electronics (Spring 2007)',
    by: 'MIT, A. Agarwal',
    lang: 'en',
    kind: { it: 'corso aperto', en: 'open course' },
    licence: 'CC BY-NC-SA',
    url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/resources',
    covers: [
      'teorema-di-thevenin',
      'teorema-di-norton',
      'circuiti-primo-ordine',
      'fasori',
      'impedenza-ammettenza',
      'risposta-in-frequenza-filtri',
      'nullore-e-amplificatore-operazionale',
      'potenza-complessa',
    ],
    note: {
      it: 'Thevenin/Norton (lez. 3), primo e secondo ordine (12, 15), regime sinusoidale (16), impedenza (17), filtri (18), op-amp (19–20), energia e potenza (22). Mancano topologia, Tellegen, Laplace, doppi bipoli; taglio elettronico; in inglese.',
      en: 'Thévenin/Norton (lecture 3), first and second order (12, 15), sinusoidal steady state (16), impedance (17), filters (18), op-amps (19–20), energy and power (22). No topology, Tellegen, Laplace or two-ports; electronics-oriented.',
    },
  },
  {
    title: 'Appunti di Teoria dei Circuiti (S. Pastore, 2006/07)',
    by: 'Università di Trieste',
    lang: 'it',
    kind: { it: 'dispense', en: 'lecture notes' },
    licence: 'non dichiarata',
    url: 'https://moodle2.units.it/pluginfile.php/450976/mod_resource/content/0/Appunti_TC.pdf',
    covers: [
      'grafo-maglie-tagli',
      'albero-coalbero',
      'matrici-a-b',
      'teorema-di-tellegen',
      'doppi-bipoli-z-y',
      'altre-rappresentazioni-doppi-bipoli',
      'connessioni-doppi-bipoli',
      'laplace-definizione-proprieta',
      'circuiti-risonanti',
    ],
    note: {
      it: 'La fonte gratuita più vicina al programma. Non è il corso ufficiale; accesso da verificare (potrebbe richiedere login).',
      en: 'The free source closest to the syllabus. Not the official course; access to be checked (it may require a login).',
    },
  },
  {
    title: 'Falstad CircuitJS',
    by: 'P. Falstad',
    lang: 'en',
    kind: { it: 'simulatore', en: 'simulator' },
    licence: 'gratuito',
    url: 'https://www.falstad.com/circuit/',
    covers: ['circuiti-primo-ordine', 'fasori', 'risposta-in-frequenza-filtri', 'circuiti-risonanti'],
    note: {
      it: 'Verifica di transitori, risonanze, risposta in frequenza. Non sostituisce lo svolgimento a mano.',
      en: 'Checking transients, resonances, frequency response. It does not replace working by hand.',
    },
  },
  {
    title: 'LTspice',
    by: 'Analog Devices',
    lang: 'en',
    kind: { it: 'simulatore', en: 'simulator' },
    licence: 'gratuito',
    url: 'https://www.analog.com/en/resources/design-tools-and-calculators/ltspice-simulator.html',
    covers: ['circuiti-primo-ordine', 'fasori', 'risposta-in-frequenza-filtri', 'circuiti-risonanti'],
    note: {
      it: 'Simulatore SPICE gratuito per verificare gli esercizi generati.',
      en: 'Free SPICE simulator to check the generated exercises.',
    },
  },
];
