/** @jsxImportSource preact */
/**
 * Appunti personali su paragrafi, formule ed esercizi.
 *
 * Aggiunge un pulsante a ogni elemento con `data-note-id` (facoltativo
 * `data-note-label`; se contiene un elemento vuoto `data-note-slot` il pulsante
 * va lì) e mostra l'appunto salvato sotto l'elemento; il testo si
 * modifica in un `<dialog>` modale nativo (focus e Esc gestiti dal browser).
 * I testi d'interfaccia arrivano dalle props: niente dizionari nel bundle,
 * perché l'isola sta anche sulle pagine di teoria (budget JS).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { loadNotes, saveNote, type NotesState } from '../engine/notes';
import { subscribe } from '../engine/storage';
import './islands.css';

export interface NotesLabels {
  add: string;
  edit: string;
  title: string;
  placeholder: string;
  save: string;
  delete: string;
  cancel: string;
  saved: string;
  deleted: string;
}

export interface NotesLayerProps {
  /** Scope di storage: id del corso. */
  scope: string;
  /** Percorso della pagina senza base né lingua (per i link dalla vista "tutti gli appunti"). */
  page: string;
  labels: NotesLabels;
  /** Contenitore in cui cercare gli ancoraggi (default: `main`). */
  root?: string;
}

const PENCIL =
  '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>';

function labelOf(el: HTMLElement): string {
  return (el.dataset.noteLabel ?? el.querySelector('h1,h2,h3,h4')?.textContent ?? el.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

export default function NotesLayer({ scope, page, labels, root = 'main' }: NotesLayerProps) {
  const [notes, setNotes] = useState<NotesState | null>(null);
  const [editing, setEditing] = useState<{ id: string; label: string; anchor: string } | null>(null);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  /** Ancoraggio a cui restituire il focus dopo la chiusura (i pulsanti vengono ricreati). */
  const restore = useRef<string | null>(null);

  useEffect(() => {
    const load = () => setNotes(loadNotes(scope));
    load();
    return subscribe(scope, 'notes', load);
  }, [scope]);

  // Pulsanti e anteprime accanto agli ancoraggi (DOM fuori dall'albero Preact).
  // Idempotente e ripetuto a ogni mutazione: le isole che si idratano dopo
  // (es. ExercisePlayer client:visible) possono ricreare il proprio markup.
  useEffect(() => {
    if (!notes) return;
    const container = document.querySelector(root) ?? document.body;
    const inject = () => {
      for (const el of container.querySelectorAll<HTMLElement>('[data-note-id]')) {
        const id = el.dataset.noteId!;
        const note = notes.notes[id];
        const label = labelOf(el);
        if (!el.querySelector(`.sh-note-btn[data-note-for="${CSS.escape(id)}"]`)) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `sh-note-btn${note ? ' has-note' : ''}`;
          btn.innerHTML = PENCIL;
          btn.setAttribute('aria-label', `${note ? labels.edit : labels.add}: ${label}`);
          btn.setAttribute('aria-haspopup', 'dialog');
          btn.dataset.noteFor = id;
          btn.addEventListener('click', () => {
            opener.current = btn;
            setEditing({ id, label, anchor: el.id });
            setDraft(notes.notes[id]?.text ?? '');
          });
          el.classList.add('sh-note-anchor');
          // Negli elementi resi da altre isole il pulsante va nello slot vuoto dedicato.
          (el.querySelector('[data-note-slot]') ?? el).append(btn);
        }
        const next = el.nextElementSibling as HTMLElement | null;
        const hasPreview = next?.classList.contains('sh-note-preview') && next.dataset.noteFor === id;
        if (note && !hasPreview) {
          const preview = document.createElement('aside');
          preview.className = 'sh-note-preview';
          preview.dataset.noteFor = id;
          preview.setAttribute('aria-label', labels.title);
          preview.textContent = note.text;
          el.after(preview);
        }
      }
    };
    inject();
    if (restore.current) {
      container
        .querySelector<HTMLElement>(`.sh-note-btn[data-note-for="${CSS.escape(restore.current)}"]`)
        ?.focus();
      restore.current = null;
    }
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        inject();
      });
    });
    observer.observe(container, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      container.querySelectorAll('.sh-note-btn, .sh-note-preview').forEach((n) => n.remove());
    };
  }, [notes, root]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (editing && !d.open) d.showModal?.();
    if (!editing && d.open) d.close();
  }, [editing]);

  const close = () => {
    const id = opener.current?.dataset.noteFor ?? null;
    // Chiusura sincrona: il dialog restituisce il focus al pulsante prima che venga ricreato.
    if (dialog.current?.open) dialog.current.close();
    setEditing(null);
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`.sh-note-btn[data-note-for="${CSS.escape(id ?? '')}"]`)?.focus(),
    );
    restore.current = id;
  };
  const commit = (text: string) => {
    if (!editing) return;
    setNotes(
      saveNote(scope, editing.id, text, Date.now(), {
        page: editing.anchor ? `${page}#${editing.anchor}` : page,
        label: editing.label,
      }),
    );
    setStatus(text.trim() ? labels.saved : labels.deleted);
    close();
  };

  return (
    <>
      <dialog
        ref={dialog}
        class="sh-dialog"
        aria-labelledby="sh-note-title"
        onClose={() => editing && close()}
      >
        {editing && (
          <form
            method="dialog"
            onSubmit={(e) => {
              e.preventDefault();
              commit(draft);
            }}
          >
            <h2 id="sh-note-title" class="sh-dialog__title">
              {labels.title}
            </h2>
            <p class="sh-muted">{editing.label}</p>
            <label class="sh-visually-hidden" for="sh-note-text">
              {labels.title}
            </label>
            <textarea
              id="sh-note-text"
              class="sh-input"
              rows={8}
              value={draft}
              placeholder={labels.placeholder}
              onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)}
              autoFocus
            />
            <div class="sh-actions">
              <button type="submit" class="btn btn--primary">
                {labels.save}
              </button>
              {notes?.notes[editing.id] && (
                <button type="button" class="btn" onClick={() => commit('')}>
                  {labels.delete}
                </button>
              )}
              <button type="button" class="btn btn--ghost" onClick={close}>
                {labels.cancel}
              </button>
            </div>
          </form>
        )}
      </dialog>
      <p class="sh-visually-hidden" role="status" aria-live="polite">
        {status}
      </p>
    </>
  );
}
