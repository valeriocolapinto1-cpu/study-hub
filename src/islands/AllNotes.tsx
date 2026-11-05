/** @jsxImportSource preact */
/** Vista "tutti i miei appunti": ricerca, link al contesto, eliminazione, download in Markdown. */
import { useEffect, useState } from 'preact/hooks';
import { allNotes, notesToMarkdown, saveNote, searchNotes, type NoteEntry } from '../engine/notes';
import { subscribe } from '../engine/storage';
import { localizePath } from '../i18n';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface AllNotesProps {
  lang: Lang;
  courseTitles: Record<string, string>;
}

export default function AllNotes({ lang, courseTitles }: AllNotesProps) {
  const [entries, setEntries] = useState<NoteEntry[] | null>(null);
  const [query, setQuery] = useState('');
  useEffect(() => {
    const load = () => setEntries(allNotes());
    load();
    const subs = ['global', ...Object.keys(courseTitles)].map((s) => subscribe(s, 'notes', load));
    return () => subs.forEach((u) => u());
  }, []);
  const shown = entries ? searchNotes(entries, query) : [];
  const groups = new Map<string, NoteEntry[]>();
  for (const e of shown) groups.set(e.scope, [...(groups.get(e.scope) ?? []), e]);
  const locale = lang === 'it' ? 'it-IT' : 'en-GB';

  const download = () => {
    const md = notesToMarkdown(entries ?? [], courseTitles, t(lang, 'notes.all'));
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appunti-study-hub.md';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!entries)
    return (
      <p class="sh-muted" aria-busy="true">
        {t(lang, 'engine.loading')}
      </p>
    );
  if (entries.length === 0) return <p class="sh-muted">{t(lang, 'notes.empty')}</p>;
  return (
    <section class="sh-allnotes">
      <div class="sh-filters">
        <label class="sh-filter sh-filter--wide">
          <span>{t(lang, 'notes.search')}</span>
          <input
            class="sh-input"
            type="search"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          />
        </label>
        <button type="button" class="btn" onClick={download}>
          {t(lang, 'notes.download')}
        </button>
      </div>
      <p class="sh-count" role="status" aria-live="polite">
        {t(lang, 'notes.count', { n: shown.length })}
      </p>
      {[...groups].map(([scope, list]) => (
        <section key={scope} aria-labelledby={`sh-notes-${scope}`}>
          <h2 id={`sh-notes-${scope}`}>
            {scope === 'global' ? t(lang, 'notes.general') : (courseTitles[scope] ?? scope)}
          </h2>
          <ul class="sh-items">
            {list.map((n) => (
              <li key={n.id} class="sh-card sh-noteitem">
                <h3>{n.label ?? n.id}</h3>
                <p class="sh-noteitem__text">{n.text}</p>
                <p class="sh-muted">
                  {t(lang, 'notes.updated', {
                    date: new Date(n.updatedAt).toLocaleString(locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }),
                  })}
                </p>
                <div class="sh-actions">
                  {n.page && (
                    <a class="btn btn--ghost" href={localizePath(n.page, lang)}>
                      {t(lang, 'notes.open')}
                    </a>
                  )}
                  <button
                    type="button"
                    class="btn btn--ghost"
                    aria-label={`${t(lang, 'engine.delete')}: ${n.label ?? n.id}`}
                    onClick={() => saveNote(n.scope, n.id, '', Date.now())}
                  >
                    {t(lang, 'engine.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
