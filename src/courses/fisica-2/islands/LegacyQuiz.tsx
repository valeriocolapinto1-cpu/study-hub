/** Storico dei quiz fatti sul sito originale (fg2-quiz, migrato in sh:v1:fisica-2:legacyQuiz). Non mostra nulla se vuoto. */
import { useEffect, useState } from 'preact/hooks';
import { read } from '../../../engine/storage';

interface Row {
  t: number;
  ok: number;
  n: number;
  voto: number;
}
interface Props {
  lang: 'it' | 'en';
  title: string;
  /** "{ok} di {n} corrette" */
  rowLabel: string;
}

export default function LegacyQuiz({ lang, title, rowLabel }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    const v = read<unknown>('fisica-2', 'legacyQuiz', []);
    setRows(Array.isArray(v) ? (v as Row[]) : []);
  }, []);
  if (!rows.length) return null;
  const date = new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'medium' });
  const num = new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-GB', { maximumFractionDigits: 1 });
  return (
    <section aria-labelledby="f2-legacy-quiz">
      <h2 id="f2-legacy-quiz">{title}</h2>
      <ul>
        {rows.map((r) => (
          <li key={r.t}>
            <strong>{num.format(r.voto)}/30</strong> ·{' '}
            {rowLabel.replace('{ok}', String(r.ok)).replace('{n}', String(r.n))} ·{' '}
            {date.format(new Date(r.t))}
          </li>
        ))}
      </ul>
    </section>
  );
}
