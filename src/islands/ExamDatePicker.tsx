/** @jsxImportSource preact */
/** Data dell'esame: appelli suggeriti dal corso oppure una data personale (salvata in sh:v1:global:examDates). */
import { useState } from 'preact/hooks';
import { daysUntil } from '../engine/mastery';
import { useExamDates } from './lib/course-state';
import { useNow } from './lib/hooks';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface ExamDatePickerProps {
  lang: Lang;
  courseId: string;
  suggested: string[];
}

const fmt = (iso: string, lang: Lang) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function ExamDatePicker({ lang, courseId, suggested }: ExamDatePickerProps) {
  const uid = `date-${courseId}`;
  const [customMode, setCustomMode] = useState(false);
  const [dates, setDate] = useExamDates();
  const now = useNow();
  const current = dates[courseId] ?? '';
  const upcoming = now ? suggested.filter((d) => (daysUntil(d, now) ?? -1) >= 0) : suggested;
  const isCustom = customMode || (current !== '' && !suggested.includes(current));
  const left = current && now ? daysUntil(current, now) : null;

  return (
    <fieldset class="sh-datepicker">
      <legend>{t(lang, 'date.title')}</legend>
      {upcoming.length === 0 && <p class="sh-help">{t(lang, 'date.noSuggested')}</p>}
      {upcoming.length > 0 && <p class="sh-help">{t(lang, 'date.suggested')}</p>}
      {upcoming.map((d) => (
        <label class="sh-check" key={d}>
          <input
            type="radio"
            name={`${uid}-d`}
            checked={!isCustom && current === d}
            onChange={() => {
              setCustomMode(false);
              setDate(courseId, d);
            }}
          />
          <span>{fmt(d, lang)}</span>
        </label>
      ))}
      <label class="sh-check">
        <input
          type="radio"
          name={`${uid}-d`}
          checked={isCustom}
          onChange={() => {
            setCustomMode(true);
            if (!current)
              setDate(courseId, upcoming[0] ?? new Date(now || Date.now()).toISOString().slice(0, 10));
          }}
        />
        <span>{t(lang, 'date.custom')}</span>
      </label>
      {isCustom && (
        <label class="sh-filter">
          <span>{t(lang, 'date.custom')}</span>
          <input
            class="sh-input"
            type="date"
            value={current}
            onChange={(e) => setDate(courseId, (e.target as HTMLInputElement).value || null)}
          />
        </label>
      )}
      <label class="sh-check">
        <input
          type="radio"
          name={`${uid}-d`}
          checked={!isCustom && current === ''}
          onChange={() => {
            setCustomMode(false);
            setDate(courseId, null);
          }}
        />
        <span>{t(lang, 'date.none')}</span>
      </label>
      <p class="sh-countdown" role="status" aria-live="polite">
        {left === null
          ? ''
          : left > 0
            ? t(lang, 'date.countdown', { n: left })
            : left === 0
              ? t(lang, 'date.today')
              : t(lang, 'date.past')}
      </p>
    </fieldset>
  );
}
