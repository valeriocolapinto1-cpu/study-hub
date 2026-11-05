import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { topics, topicById, trapsForTopic, TOPIC_GROUPS } from '~/content';
import { anchored, outline, readingMinutes } from '~/content/outline';
import { diagramById } from '~/content/diagrams';
import type { Topic, TopicCheck, TopicExercise } from '~/content/types';
import { hrefFor, navigate } from '~/lib/router';
import { isStudied, markVisited, toggleStudied, useProgress } from '~/store/progress';
import { DiagramFigure } from '~/ui/components/DiagramFigure';
import { Rich } from '~/ui/components/Rich';
import { TrapNote } from '~/ui/components/TrapNote';

export function TopicCard({ topic, index }: { topic: Topic; index: number }): JSX.Element {
  const progress = useProgress();
  const done = isStudied(progress, topic.id);
  const opened = progress.visited.includes(topic.id);

  return (
    <a class={`card${done ? ' studied' : ''}`} href={hrefFor('study', topic.id)}>
      <span class="bar" aria-hidden="true" />
      <div class="idx">
        MOD {String(index + 1).padStart(2, '0')}
        {done ? ' · ✓ studiato' : opened ? ' · aperto' : ''}
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.blurb}</p>
      <div class="ref">{readingMinutes(topic.body)} min</div>
    </a>
  );
}

/** Domanda di autoverifica: la risposta resta nascosta finché non ci provi. */
function CheckItem({ check, index }: { check: TopicCheck; index: number }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <li class="chk">
      <p class="chk-q">
        <span class="chk-n">{index + 1}</span> {check.q}
      </p>
      <button type="button" class="btn ghost mini" onClick={() => setOpen((on) => !on)}>
        {open ? 'Nascondi la risposta' : 'Mostra la risposta'}
      </button>
      {open && <Rich class="chk-a" html={check.a} />}
    </li>
  );
}

/**
 * Esercizio svolto.
 *
 * Suggerimento e svolgimento sono **due bottoni separati**: chiedere una
 * spinta non deve costringere a vedere la soluzione, altrimenti l'esercizio
 * si legge invece di farlo.
 */
function ExerciseItem({
  exercise,
  index,
}: {
  exercise: TopicExercise;
  index: number;
}): JSX.Element {
  const [hint, setHint] = useState(false);
  const [solution, setSolution] = useState(false);

  return (
    <li class="exr">
      <div class="exr-top">
        <span class="exr-n">{index + 1}</span>
        <span class={`exr-lv ${exercise.level}`}>
          {exercise.level === 'base' ? 'base' : "d'esame"}
        </span>
      </div>
      <Rich class="exr-q" html={exercise.q} as="p" />
      <div class="step-tools">
        <button type="button" class="btn ghost mini" onClick={() => setHint((on) => !on)}>
          {hint ? 'Nascondi il suggerimento' : 'Suggerimento'}
        </button>
        <button type="button" class="btn ghost mini" onClick={() => setSolution((on) => !on)}>
          {solution ? 'Nascondi lo svolgimento' : 'Svolgimento'}
        </button>
      </div>
      {hint && <Rich class="exr-h" html={exercise.hint} />}
      {solution && (
        <div class="exr-s">
          <div class="exr-sl">Svolgimento</div>
          <Rich html={exercise.solution} />
        </div>
      )}
    </li>
  );
}

function TopicDetail({ topic }: { topic: Topic }): JSX.Element {
  // Aprire un modulo lo segna come **visitato**, non come studiato: la
  // spunta della carriera la mette lo studente.
  useEffect(() => markVisited(topic.id), [topic.id]);
  const progress = useProgress();
  const done = isStudied(progress, topic.id);

  const linked = trapsForTopic(topic);
  const sections = outline(topic.body);
  const position = topics.findIndex((item) => item.id === topic.id);
  const previous = position > 0 ? topics[position - 1] : undefined;
  const next = position < topics.length - 1 ? topics[position + 1] : undefined;
  const prerequisites = (topic.prereq ?? [])
    .map((id) => topicById(id))
    .filter((item): item is Topic => item !== undefined);
  const diagrams = (topic.diagramIds ?? [])
    .map((id) => diagramById(id))
    .filter((diagram) => diagram !== undefined);

  return (
    <>
      <div class="detail-head" style="margin-top:6px">
        <div>
          <p class="eyebrow">
            Modulo {position + 1} di {topics.length}
          </p>
          <h1 class="h" style="font-size:clamp(26px,3.4vw,34px)">{topic.title}</h1>
        </div>
        <a class="btn ghost mini" href={hrefFor('study')}>
          ← Tutti i moduli
        </a>
      </div>

      <div class="recap">
        <h2>In due minuti</h2>
        <ul>
          {topic.summary.map((line, index) => (
            <li key={index}>
              <Rich as="span" html={line} />
            </li>
          ))}
        </ul>
        <p class="recap-note">
          Se il giorno prima dell'esame leggi solo questo riquadro, hai già in mano l'essenziale.
        </p>
      </div>

      {/*
        Due colonne sopra i 1080px: a sinistra si legge, a destra sta tutto il
        contorno e resta agganciato allo scorrimento. Sotto, la griglia
        collassa e la barra torna sopra il testo — nel DOM viene comunque
        prima, quindi la sequenza è la stessa a qualunque larghezza.
      */}
      <div class="study-grid">
        <aside class="study-rail">
          <div class="rail-card">
            <p class="rail-t">La tua carriera</p>
            <button
              type="button"
              class={`btn ${done ? 'ghost' : 'primary'} mini`}
              aria-pressed={done}
              onClick={() => toggleStudied(topic.id)}
            >
              {done ? '✓ Studiato — togli la spunta' : 'Segna come studiato'}
            </button>
            <p class="fn" style="margin:9px 0 0">
              {readingMinutes(topic.body)} min di lettura · {topic.exercises.length} esercizi ·{' '}
              <a href={hrefFor('carriera')}>a che punto sei</a>
            </p>
          </div>

          {prerequisites.length > 0 && (
            <div class="rail-card">
              <p class="rail-t">Prima di questo</p>
              <div class="rail-links">
                {prerequisites.map((item) => (
                  <a key={item.id} href={hrefFor('study', item.id)}>
                    {item.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {sections.length >= 4 && (
            <nav class="toc" aria-label={`Indice di ${topic.title}`}>
              <p class="toc-t">In questo modulo</p>
              <ol>
                {[
                  ...sections,
                  { id: 'autoverifica', title: 'Autoverifica' },
                  { id: 'esercizi', title: `Esercizi (${topic.exercises.length})` },
                ].map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#/study/${topic.id}`}
                      onClick={(event) => {
                        // Il router vive nell'hash, quindi un `href="#ancora"`
                        // cambierebbe rotta invece di scorrere: si scorre a mano.
                        event.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({ block: 'start' });
                      }}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </aside>

        <div class="study-col">
          <article class="prose">
            <Rich html={anchored(topic.body)} />
            {linked.map((trap) => (
              <TrapNote key={trap.id} trap={trap} />
            ))}
          </article>

          {diagrams.length > 0 && (
            <>
              <h2 class="sec">Schemi di questo modulo</h2>
              <p class="lead">
                Studiali finché li rifai a memoria. Saper ridisegnare uno schema è il modo più
                spiccio di scoprire se hai capito come sono collegate le parti, o se hai solo
                letto il paragrafo.
              </p>
              {diagrams.map((diagram) => (
                <div key={diagram.id} style="margin-bottom:22px">
                  <DiagramFigure diagram={diagram} />
                  <a class="btn ghost mini" href={hrefFor('train', diagram.id)}>
                    Esercitati a completarlo ▶
                  </a>
                </div>
              ))}
            </>
          )}

          <h2 class="sec" id="autoverifica">
            Autoverifica
          </h2>
          <p class="lead">
            Rispondi <b>prima</b> di scoprire la soluzione: riconoscere una risposta giusta è
            facile, produrla è un'altra cosa — ed è quella che serve sul foglio.
          </p>
          <ol class="checks">
            {topic.checks.map((check, index) => (
              <CheckItem key={index} check={check} index={index} />
            ))}
          </ol>

          <h2 class="sec" id="esercizi">
            Esercizi
          </h2>
          <p class="lead">
            {topic.exercises.length} esercizi ·{' '}
            {topic.exercises.filter((item) => item.level === 'base').length} di base,{' '}
            {topic.exercises.filter((item) => item.level === 'esame').length} nel formato della
            prova. Fai il conto <b>sul foglio</b>, poi confronta: il suggerimento è lì per
            rimetterti in moto senza bruciare la soluzione.
          </p>
          <ol class="exrlist">
            {topic.exercises.map((exercise, index) => (
              <ExerciseItem key={exercise.id} exercise={exercise} index={index} />
            ))}
          </ol>

          <div class="btn-row">
            <button type="button" class="btn primary" onClick={() => navigate('exam', 'quick')}>
              Mettiti alla prova ▶
            </button>
            <a class="btn ghost" href={hrefFor('def')}>
              Definizioni
            </a>
          </div>

          <nav class="pager" aria-label="Moduli vicini">
            {previous ? (
              <a class="pg" href={hrefFor('study', previous.id)}>
                <span class="pg-l">← Precedente</span>
                <span class="pg-t">{previous.title}</span>
              </a>
            ) : (
              <span />
            )}
            {next && (
              <a class="pg next" href={hrefFor('study', next.id)}>
                <span class="pg-l">Successivo →</span>
                <span class="pg-t">{next.title}</span>
              </a>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}

export function Study({ topicId }: { topicId: string | null }): JSX.Element {
  const topic = topicId ? topicById(topicId) : undefined;
  const progress = useProgress();

  if (topic) {
    return (
      <section class="view">
        <TopicDetail topic={topic} />
      </section>
    );
  }

  const read = topics.filter((item) => isStudied(progress, item.id)).length;
  const totalMinutes = topics.reduce((sum, item) => sum + readingMinutes(item.body), 0);

  return (
    <section class="view">
      <p class="eyebrow">Moduli di studio</p>
      <h1 class="h">La teoria, spiegata per essere usata</h1>
      <p class="lead">
        Diciassette moduli in ordine di studio, dal binario alle prestazioni: ognuno con il
        ripasso «in due minuti», la teoria distesa e le domande per verificare da solo se hai
        capito. In tutto circa {totalMinutes} minuti di lettura — <b>{read} su {topics.length}</b>{' '}
        già segnati come studiati nella{' '}
        <a href={hrefFor('carriera')}>tua carriera</a>.
      </p>

      {TOPIC_GROUPS.map((group) => (
        <div key={group.id}>
          <h2 class="sec">{group.title}</h2>
          <p class="lead">{group.note}</p>
          <div class="cards" style="margin-top:14px">
            {group.topicIds.map((id) => {
              const item = topicById(id);
              if (!item) return null;
              return (
                <TopicCard
                  key={id}
                  topic={item}
                  index={topics.findIndex((entry) => entry.id === id)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
