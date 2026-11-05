import type { JSX } from 'preact';
import { useMemo } from 'preact/hooks';
import { BANK_IDS, topics } from '~/content';
import { readingMinutes } from '~/content/outline';
import { computeReadiness, daysUntil, type ReadinessSlice } from '~/engine/readiness';
import { fmtNumber } from '~/lib/i18n';
import { hrefFor } from '~/lib/router';
import { isStudied, setExamDate, useProgress } from '~/store/progress';
import { Gauge } from './Gauge';

const LONG_DATE = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** «fra 19 giorni», «domani», «oggi». */
function countdown(days: number): { big: string; small: string } {
  if (days < 0) return { big: '—', small: 'data passata' };
  if (days === 0) return { big: 'oggi', small: "è il giorno dell'appello" };
  if (days === 1) return { big: 'domani', small: 'manca un giorno' };
  return { big: String(days), small: 'giorni all’appello' };
}

function Leg({ slice }: { slice: ReadinessSlice }): JSX.Element {
  return (
    <li class={`leg${slice.measured ? '' : ' na'}`}>
      <span class="leg-l">
        {slice.label}
        {!slice.measured && <> · <span class="leg-na">non ancora misurata</span></>}
      </span>
      <span class="leg-w">
        {slice.points.toFixed(0)} / {slice.weight} punti
      </span>
      <span class="leg-bar">
        <span style={`width:${slice.percent}%`} />
      </span>
    </li>
  );
}

/**
 * Calcolatore di preparazione.
 *
 * Non è un punteggio decorativo: mette il programma chiuso, la banca domande
 * già affrontata e la resa nelle prove contro i giorni che restano, e ne
 * ricava il **ritmo** da tenere. Il numero da solo direbbe poco; quello che
 * serve è «ti restano N moduli in M giorni, cioè tot al giorno».
 *
 * Tutto si calcola qui in memoria dai dati già salvati nel browser: nessun
 * conto viene mandato da nessuna parte.
 */
export function Preparation(): JSX.Element {
  const progress = useProgress();

  const studied = topics.filter((topic) => isStudied(progress, topic.id)).length;
  const minutesLeft = useMemo(
    () =>
      topics
        .filter((topic) => !isStudied(progress, topic.id))
        .reduce((sum, topic) => sum + readingMinutes(topic.body), 0),
    [progress],
  );

  // Solo le voci ancora in catalogo: se una domanda viene ritirata, averla
  // vista un anno fa non deve gonfiare la percentuale di oggi.
  const bankSeen = Object.keys(progress.bank).filter((id) => BANK_IDS.has(id)).length;

  const full = progress.exams.filter(
    (exam): exam is typeof exam & { score30: number } => exam.score30 !== undefined,
  );
  const averageScore = full.length
    ? full.reduce((sum, exam) => sum + exam.score30, 0) / full.length
    : null;

  const daysLeft =
    progress.examDate !== undefined ? daysUntil(progress.examDate, new Date()) : null;

  const readiness = computeReadiness({
    studiedTopics: studied,
    totalTopics: topics.length,
    minutesLeft,
    bankSeen,
    bankTotal: BANK_IDS.size,
    averageScore,
    fullExamsTaken: full.length,
    daysLeft,
  });

  const clock = daysLeft !== null ? countdown(daysLeft) : null;

  return (
    <div class="prep">
      <div class="prep-top">
        <div>
          <p class="prep-eyebrow">Preparazione</p>
          <div class="prep-score">
            {readiness.percent}
            <span>%</span>
          </div>
        </div>

        <div class="prep-when">
          {clock && (
            <div class="prep-days">
              {clock.big}
              <small>{clock.small}</small>
            </div>
          )}
          <div class="prep-date">
            <label for="data-esame">
              {progress.examDate === undefined ? 'Quando hai l’appello?' : 'Appello'}
            </label>
            <input
              id="data-esame"
              type="date"
              value={progress.examDate ?? ''}
              onChange={(event) => {
                const next = (event.currentTarget as HTMLInputElement).value;
                setExamDate(next === '' ? null : next);
              }}
            />
            {progress.examDate !== undefined && (
              <button
                type="button"
                class="btn quiet mini"
                onClick={() => setExamDate(null)}
              >
                togli
              </button>
            )}
          </div>
        </div>
      </div>

      <p class="prep-verdict">{readiness.verdict}</p>
      {progress.examDate !== undefined && daysLeft !== null && daysLeft >= 0 && (
        <p class="fn" style="margin:6px 0 0">
          Appello di {LONG_DATE.format(new Date(`${progress.examDate}T12:00:00`))}
        </p>
      )}

      <div class="gauges">
        <Gauge
          hue="copper"
          percent={readiness.slices[0]?.percent ?? 0}
          label="Argomenti studiati"
          detail={`${studied} su ${topics.length} moduli`}
        />
        <Gauge
          hue="cyan"
          percent={readiness.slices[1]?.percent ?? 0}
          label="Domande già affrontate"
          detail={`${bankSeen} su ${BANK_IDS.size} voci`}
        />
      </div>

      <ul class="prep-legs">
        {readiness.slices.map((slice) => (
          <Leg key={slice.id} slice={slice} />
        ))}
      </ul>

      {readiness.pace && (
        <div class="prep-pace">
          {readiness.pace.minutesPerDay > 0 && (
            <div class={`pace-box${readiness.pace.tight ? ' tight' : ''}`}>
              <div class="pace-n">
                {fmtNumber(readiness.pace.minutesPerDay)}
                <small>min</small>
              </div>
              <p class="pace-l">al giorno di lettura, per chiudere il programma in tempo</p>
            </div>
          )}
          {readiness.pace.modulesPerWeek > 0 && (
            <div class={`pace-box${readiness.pace.tight ? ' tight' : ''}`}>
              <div class="pace-n">
                {readiness.pace.modulesPerWeek}
                <small>moduli</small>
              </div>
              <p class="pace-l">
                a settimana — <a href={hrefFor('study')}>sono in ordine di studio</a>
              </p>
            </div>
          )}
          {readiness.pace.examsSuggested > 0 && (
            <div class="pace-box">
              <div class="pace-n">
                {readiness.pace.examsSuggested}
                <small>prove</small>
              </div>
              <p class="pace-l">
                complete da qui all’appello —{' '}
                <a href={hrefFor('exam', 'full')}>generane una</a>
              </p>
            </div>
          )}
        </div>
      )}

      {readiness.pace?.tight && (
        <p class="fn" style="margin-top:12px;color:var(--color-amber)">
          ⚠︎ A questo ritmo il piano è più un auspicio che un piano. Meglio saperlo adesso:
          o si comincia oggi, o si punta all’appello dopo.
        </p>
      )}
    </div>
  );
}
