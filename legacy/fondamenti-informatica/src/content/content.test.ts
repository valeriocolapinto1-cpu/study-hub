import { describe, expect, it } from 'vitest';
import { asmWrite, links, mcq, open, topics, traps, TOPIC_GROUPS, validateContent } from './index';
import { definitions } from './definitions';
import { diagrams, diagramById } from './diagrams';
import { outline } from './outline';

describe('content layer', () => {
  it('supera tutti i controlli di integrità', () => {
    // Se questo test fallisce, il messaggio elenca esattamente cosa correggere.
    expect(validateContent()).toEqual([]);
  });

  it('parte già popolato ai volumi richiesti', () => {
    expect(mcq.length).toBeGreaterThanOrEqual(90);
    expect(open.length).toBeGreaterThanOrEqual(19);
    expect(asmWrite.length).toBeGreaterThanOrEqual(2);
    expect(topics.length).toBeGreaterThanOrEqual(17);
    expect(traps.length).toBeGreaterThanOrEqual(5);
    expect(links.length).toBeGreaterThanOrEqual(6);
  });

  it('ogni modulo si può studiare da zero, non è un riassunto', () => {
    // I moduli del prototipo stavano fra 390 e 1200 caratteri; le sintesi
    // operative arrivavano a 3-6 mila. Per studiarci sopra senza il libro
    // accanto ne servono almeno seimila di **prosa**, tag esclusi.
    for (const topic of topics) {
      const prose = topic.body.replace(/<[^>]+>/g, ' ');
      expect(prose.length, `modulo "${topic.id}" troppo scarno`).toBeGreaterThan(6000);
      // Almeno quattro sezioni: un modulo con un solo <h4> non è organizzato.
      expect(
        (topic.body.match(/<h4>/g) ?? []).length,
        `modulo "${topic.id}" con troppe poche sezioni`,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it('ogni modulo comincia dalla rampa d’ingresso', () => {
    // Chi parte da zero deve trovare, come PRIMA cosa, che cosa serve sapere
    // prima, che problema si sta risolvendo e le parole nuove.
    for (const topic of topics) {
      const first = outline(topic.body)[0];
      expect(first?.title, `modulo "${topic.id}"`).toBe('Da dove si parte');
    }
  });

  it('ogni argomento è coperto da almeno tre crocette', () => {
    // Un argomento senza domande non può uscire nei drill: sarebbe teoria morta.
    for (const topic of topics) {
      const count = mcq.filter((item) => item.topic === topic.id).length;
      expect(count, `argomento "${topic.id}" con sole ${count} crocette`).toBeGreaterThanOrEqual(3);
    }
  });

  it('rimanda a un modulo che esiste, da ogni quesito e da ogni schema', () => {
    // Il rimando non è più un capitolo di un libro che il sito non può
    // aprire: è una destinazione interna, quindi un id sbagliato qui è un
    // collegamento rotto in faccia a chi studia.
    const known = new Set<string>(topics.map((topic) => topic.id));
    for (const item of [...mcq, ...open, ...asmWrite, ...definitions, ...diagrams]) {
      expect(known.has(item.topic), `${item.id}: modulo "${item.topic}" inesistente`).toBe(true);
    }
  });

  it('non lascia in giro riferimenti al libro di testo', () => {
    // I contenuti sono originali e non devono appoggiarsi alla struttura di
    // un'opera altrui: la bibliografia sta nelle Note, non dentro i quesiti.
    const testo = JSON.stringify([mcq, open, asmWrite, definitions, diagrams, topics, traps]);
    expect(testo).not.toMatch(/Hamacher/i);
  });

  it('le convenzioni parlano di notazione, non di persone o di esami', () => {
    // È il presidio che ha sostituito il badge «da verificare»: una voce che
    // dice cosa qualcuno pretende, gradisce o penalizza è un'affermazione su
    // una persona reale, e qui non ci va — con o senza badge.
    const vietate =
      /docent|profess|\besame\b|\bappell|corso di|gradisc|pretend|penalizz|secondo gli appunti/i;
    for (const trap of traps) {
      expect(vietate.test(`${trap.title} ${trap.body}`), `"${trap.id}"`).toBe(false);
    }
  });

  it('ogni modulo ha il ripasso «in due minuti» e le domande di autoverifica', () => {
    for (const topic of topics) {
      // Il ripasso dell'ultimo giorno: se è troppo corto non riassume, se è
      // troppo lungo non è un ripasso.
      expect(topic.summary.length, `modulo "${topic.id}"`).toBeGreaterThanOrEqual(4);
      expect(topic.summary.length, `modulo "${topic.id}"`).toBeLessThanOrEqual(8);
      for (const line of topic.summary) {
        expect(line.trim().length, `${topic.id}: riga di ripasso troppo scarna`).toBeGreaterThan(40);
      }

      expect(topic.checks.length, `modulo "${topic.id}"`).toBeGreaterThanOrEqual(3);
      for (const check of topic.checks) {
        expect(check.q.trim(), topic.id).not.toBe('');
        // Una risposta di una riga non insegna niente: deve spiegare il perché.
        expect(check.a.trim().length, `${topic.id}: risposta troppo breve`).toBeGreaterThan(80);
      }
    }
  });

  it('ogni modulo ha cinque esercizi, con suggerimento e svolgimento', () => {
    const ids = new Set<string>();
    for (const topic of topics) {
      expect(topic.exercises.length, `modulo "${topic.id}"`).toBeGreaterThanOrEqual(5);
      // Se sono tutti «base» non si sta preparando un esame; se sono tutti
      // «esame» non si impara il meccanismo.
      const esame = topic.exercises.filter((item) => item.level === 'esame').length;
      expect(esame, `modulo "${topic.id}": pochi esercizi d'esame`).toBeGreaterThanOrEqual(2);
      expect(
        topic.exercises.filter((item) => item.level === 'base').length,
        `modulo "${topic.id}": nessun esercizio di base`,
      ).toBeGreaterThanOrEqual(1);

      for (const exercise of topic.exercises) {
        expect(ids.has(exercise.id), `id duplicato: ${exercise.id}`).toBe(false);
        ids.add(exercise.id);
        expect(exercise.q.trim().length, exercise.id).toBeGreaterThan(40);
        expect(exercise.hint.trim().length, `${exercise.id}: suggerimento`).toBeGreaterThan(40);
        // Uno svolgimento più corto della traccia non è uno svolgimento.
        expect(
          exercise.solution.length,
          `${exercise.id}: soluzione più corta della traccia`,
        ).toBeGreaterThan(exercise.q.length);
        expect(exercise.solution.length, `${exercise.id}: soluzione`).toBeGreaterThan(200);
      }
    }
  });

  it('ogni modulo ha un esempio svolto e gli errori tipici', () => {
    // Un esame è fatto di esercizi: la teoria senza un esempio con i numeri
    // non insegna a farli, e l'elenco degli errori tipici è ciò che separa
    // «ho capito» da «l'ho preso».
    for (const topic of topics) {
      const titles = outline(topic.body).map((section) => section.title.toLowerCase());
      expect(
        titles.some((title) => title.includes('esempio')),
        `modulo "${topic.id}": nessun esempio svolto`,
      ).toBe(true);
      expect(
        titles.some((title) => title.includes('errori tipici')),
        `modulo "${topic.id}": nessuna sezione sugli errori tipici`,
      ).toBe(true);
    }
  });

  it('i rimandi fra moduli e schemi puntano a qualcosa che esiste', () => {
    const ids = new Set(topics.map((topic) => topic.id));
    for (const topic of topics) {
      for (const id of topic.prereq ?? []) {
        expect(ids.has(id), `modulo "${topic.id}": prerequisito sconosciuto "${id}"`).toBe(true);
        expect(id, `modulo "${topic.id}" è prerequisito di se stesso`).not.toBe(topic.id);
      }
      for (const id of topic.diagramIds ?? []) {
        expect(diagramById(id), `modulo "${topic.id}": schema sconosciuto "${id}"`).toBeDefined();
      }
    }
  });

  it('i prerequisiti vengono prima nell’ordine di studio', () => {
    // L'ordine dell'elenco è pedagogico: un modulo non può dipendere da uno
    // che si studia dopo, altrimenti il percorso consigliato è incoerente.
    const position = new Map(topics.map((topic, index) => [topic.id, index]));
    for (const topic of topics) {
      for (const id of topic.prereq ?? []) {
        expect(
          position.get(id)!,
          `"${topic.id}" dipende da "${id}", che però viene dopo`,
        ).toBeLessThan(position.get(topic.id)!);
      }
    }
  });

  it('le definizioni stanno in una frase e puntano al modulo giusto', () => {
    expect(definitions.length).toBeGreaterThanOrEqual(50);
    expect(new Set(definitions.map((item) => item.id)).size).toBe(definitions.length);
    const titles = new Set(topics.map((topic) => topic.id));
    for (const item of definitions) {
      expect(titles.has(item.topic), `argomento sconosciuto in ${item.id}`).toBe(true);
      // Se non sta in una frase non è una definizione: è un modulo di studio.
      expect(item.short.trim().length, item.id).toBeGreaterThan(20);
      expect(item.short.length, `${item.id}: troppo lunga per il foglio`).toBeLessThan(320);
    }
  });

  it('ogni schema è completabile: slot distinti, dentro il riquadro, con distrattori', () => {
    expect(diagrams.length).toBeGreaterThanOrEqual(8);
    expect(new Set(diagrams.map((item) => item.id)).size).toBe(diagrams.length);

    for (const diagram of diagrams) {
      const ids = diagram.slots.map((slot) => slot.id);
      expect(new Set(ids).size, `${diagram.id}: id di slot duplicati`).toBe(ids.length);
      expect(diagram.slots.length, `${diagram.id}: troppo pochi slot`).toBeGreaterThanOrEqual(4);

      for (const slot of diagram.slots) {
        expect(slot.label.trim(), `${diagram.id}/${slot.id}`).not.toBe('');
        // Fuori dal viewBox l'etichetta finirebbe fuori dal disegno.
        expect(slot.x, `${diagram.id}/${slot.id}: x fuori riquadro`).toBeGreaterThanOrEqual(0);
        expect(slot.x, `${diagram.id}/${slot.id}: x fuori riquadro`).toBeLessThanOrEqual(diagram.width);
        expect(slot.y, `${diagram.id}/${slot.id}: y fuori riquadro`).toBeGreaterThanOrEqual(0);
        expect(slot.y, `${diagram.id}/${slot.id}: y fuori riquadro`).toBeLessThanOrEqual(diagram.height);
      }

      // Un distrattore uguale a un'etichetta giusta renderebbe il quesito
      // ambiguo: la stessa risposta sarebbe giusta e sbagliata insieme.
      const labels = new Set(diagram.slots.map((slot) => slot.label));
      for (const distractor of diagram.distractors) {
        expect(labels.has(distractor), `${diagram.id}: "${distractor}" è anche un'etichetta`).toBe(
          false,
        );
      }
      expect(diagram.distractors.length, `${diagram.id}: senza distrattori`).toBeGreaterThanOrEqual(2);
    }
  });

  it('nessuno schema resta invisibile in Riferimenti', () => {
    // La pagina raggruppa gli schemi per area del programma. Se l'argomento di
    // uno schema non appartiene a nessun blocco, quello schema non compare da
    // nessuna parte: lavoro fatto e mai mostrato. Prima lo stesso rischio era
    // coperto dal catalogo delle figure; adesso che il catalogo non c'è più,
    // il presidio è questo.
    const raggruppati = new Set(TOPIC_GROUPS.flatMap((group) => group.topicIds));
    for (const diagram of diagrams) {
      expect(
        raggruppati.has(diagram.topic),
        `schema invisibile: "${diagram.id}" sta in "${diagram.topic}", che non è in nessuna area`,
      ).toBe(true);
    }
    expect(diagrams.length).toBeGreaterThanOrEqual(40);
  });

  it('copre con le domande aperte tutti i moduli tranne IEEE 754', () => {
    const covered = new Set(open.map((item) => item.topic));
    for (const topic of topics) {
      if (topic.id === 'ieee') continue;
      expect(covered.has(topic.id), `nessuna domanda aperta per "${topic.id}"`).toBe(true);
    }
  });
});
