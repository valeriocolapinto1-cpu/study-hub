/**
 * Calcolatore di preparazione.
 *
 * Mette insieme le tre cose che decidono come va un appello — quanto programma
 * hai chiuso, quanta banca domande hai già affrontato, come sei andato nelle
 * prove — e le confronta con i giorni che mancano, per dire non solo «a che
 * punto sei» ma **a che ritmo devi andare**.
 *
 * Funzioni pure: niente DOM, niente `Date.now()` implicito. Il giorno di oggi
 * si passa da fuori, altrimenti i test dipenderebbero da quando li esegui.
 */

/** Quanto pesa ciascuna gamba sul totale. Somma 100. */
export const WEIGHTS = { studio: 45, pratica: 30, resa: 25 } as const;

export interface ReadinessInput {
  /** Moduli dichiarati studiati e totale del programma. */
  studiedTopics: number;
  totalTopics: number;
  /** Minuti di lettura dei moduli non ancora segnati. */
  minutesLeft: number;
  /** Voci di banca già incontrate almeno una volta, e quante ce ne sono. */
  bankSeen: number;
  bankTotal: number;
  /** Media in trentesimi delle prove complete, `null` se non ne hai fatte. */
  averageScore: number | null;
  /** Prove complete svolte. */
  fullExamsTaken: number;
  /** Giorni che mancano all'appello, `null` se la data non è stata messa. */
  daysLeft: number | null;
}

export interface ReadinessSlice {
  id: 'studio' | 'pratica' | 'resa';
  label: string;
  /** Avanzamento della gamba, 0–100. */
  percent: number;
  /** Peso sul totale. */
  weight: number;
  /** Punti effettivamente maturati, 0–`weight`. */
  points: number;
  /**
   * `false` quando il dato non esiste ancora (nessuna prova svolta). La gamba
   * vale comunque zero — vedi `computeReadiness` — ma la UI lo dice invece di
   * far credere che tu abbia sbagliato tutto.
   */
  measured: boolean;
}

export interface Pace {
  /** Minuti di studio al giorno per chiudere il programma in tempo. */
  minutesPerDay: number;
  /** Moduli da chiudere ogni settimana. */
  modulesPerWeek: number;
  /** Prove complete consigliate da qui all'appello. */
  examsSuggested: number;
  /** `true` quando il ritmo richiesto è fuori scala. */
  tight: boolean;
}

export interface Readiness {
  /** Preparazione complessiva, 0–100. */
  percent: number;
  slices: ReadinessSlice[];
  /** Frase di sintesi, già in italiano. */
  verdict: string;
  /** `null` se manca la data o se l'appello è passato. */
  pace: Pace | null;
}

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

/** Percentuale intera di `part` su `total`, con `total = 0` che vale 0. */
export function share(part: number, total: number): number {
  if (total <= 0) return 0;
  return clampPercent(Math.round((part / total) * 100));
}

/**
 * Giorni che mancano a `dateISO` (`AAAA-MM-GG`) rispetto a `today`.
 *
 * Il conto è **fra giorni di calendario**, non fra istanti: mancano zero
 * giorni per tutto il giorno dell'esame, non solo a mezzanotte. Le due date si
 * normalizzano a mezzogiorno locale, così il cambio dell'ora legale — che
 * sposta una mezzanotte di un'ora — non fa comparire o sparire un giorno.
 */
export function daysUntil(dateISO: string, today: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!match) return null;
  const [, year, month, day] = match;
  const target = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

function verdictFor(percent: number, daysLeft: number | null): string {
  if (daysLeft !== null && daysLeft < 0) {
    return 'La data che hai messo è passata: aggiornala con quella del prossimo appello.';
  }
  if (daysLeft === 0) {
    return 'È oggi. Rileggi i riquadri «in due minuti» e fermati: a poche ore dalla prova si consolida, non si impara.';
  }
  if (percent >= 85) {
    return 'Ci sei. Tieni il ritmo sulle prove complete e non mollare i moduli già chiusi.';
  }
  if (percent >= 60) {
    return 'A buon punto. Quello che manca adesso è soprattutto svolgere prove intere a tempo.';
  }
  if (percent >= 30) {
    return 'A metà strada. Chiudi i moduli in ordine e comincia a mescolarci qualche prova.';
  }
  if (percent > 0) {
    return 'Si comincia. Prendi i moduli in ordine: sono pensati per essere letti uno dopo l’altro.';
  }
  return 'Non hai ancora segnato niente come studiato. Apri il primo modulo e parti da lì.';
}

/**
 * Ritmo necessario per arrivare in fondo al programma entro l'appello.
 *
 * `null` quando non c'è una data, quando è passata, o quando non resta niente
 * da studiare: un ritmo da tenere su zero moduli non è un'informazione.
 */
function paceFor(input: ReadinessInput): Pace | null {
  const { daysLeft } = input;
  if (daysLeft === null || daysLeft < 0) return null;

  const modulesLeft = Math.max(0, input.totalTopics - input.studiedTopics);
  // Il giorno dell'esame non è un giorno di studio: se manca solo quello, il
  // ritmo si calcola su un giorno per non dividere per zero.
  const days = Math.max(1, daysLeft);
  const weeks = days / 7;

  const examsSuggested = Math.max(0, Math.min(8, Math.ceil(days / 7) + 1) - input.fullExamsTaken);
  const minutesPerDay = Math.ceil(input.minutesLeft / days);
  const modulesPerWeek = Math.ceil(modulesLeft / weeks);

  if (modulesLeft === 0 && examsSuggested === 0) return null;

  return {
    minutesPerDay,
    modulesPerWeek,
    examsSuggested,
    // Oltre le due ore al giorno o i sei moduli a settimana il piano non è un
    // piano: è un modo per accorgersi tardi che non ci si sta.
    tight: minutesPerDay > 120 || modulesPerWeek > 6,
  };
}

export function computeReadiness(input: ReadinessInput): Readiness {
  const studioPercent = share(input.studiedTopics, input.totalTopics);
  const praticaPercent = share(input.bankSeen, input.bankTotal);

  /*
   * La resa vale zero finché non hai svolto una prova completa, e **non** viene
   * ridistribuita sulle altre gambe. Rinormalizzare farebbe segnare il 100 % a
   * chi ha letto tutto senza essersi mai messo alla prova: è proprio la
   * persona che questo calcolatore dovrebbe mettere in guardia.
   */
  const resaMeasured = input.averageScore !== null && input.fullExamsTaken > 0;
  const resaPercent = resaMeasured ? clampPercent(Math.round((input.averageScore! / 30) * 100)) : 0;

  const slices: ReadinessSlice[] = [
    {
      id: 'studio',
      label: 'Programma studiato',
      percent: studioPercent,
      weight: WEIGHTS.studio,
      points: (studioPercent / 100) * WEIGHTS.studio,
      measured: true,
    },
    {
      id: 'pratica',
      label: 'Banca domande affrontata',
      percent: praticaPercent,
      weight: WEIGHTS.pratica,
      points: (praticaPercent / 100) * WEIGHTS.pratica,
      measured: true,
    },
    {
      id: 'resa',
      label: 'Resa nelle prove',
      percent: resaPercent,
      weight: WEIGHTS.resa,
      points: (resaPercent / 100) * WEIGHTS.resa,
      measured: resaMeasured,
    },
  ];

  const percent = clampPercent(Math.round(slices.reduce((sum, s) => sum + s.points, 0)));

  return {
    percent,
    slices,
    verdict: verdictFor(percent, input.daysLeft),
    pace: paceFor(input),
  };
}
