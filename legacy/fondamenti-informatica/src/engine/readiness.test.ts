import { describe, expect, it } from 'vitest';
import { computeReadiness, daysUntil, share, WEIGHTS, type ReadinessInput } from './readiness';

const base: ReadinessInput = {
  studiedTopics: 0,
  totalTopics: 17,
  minutesLeft: 132,
  bankSeen: 0,
  bankTotal: 199,
  averageScore: null,
  fullExamsTaken: 0,
  daysLeft: null,
};

describe('percentuali', () => {
  it('un totale a zero non produce NaN né divisioni per zero', () => {
    expect(share(0, 0)).toBe(0);
    expect(share(5, 0)).toBe(0);
  });

  it('arrotonda e resta nell’intervallo', () => {
    expect(share(1, 3)).toBe(33);
    expect(share(17, 17)).toBe(100);
    expect(share(20, 17), 'più del totale resta 100').toBe(100);
  });
});

describe('giorni all’appello', () => {
  it('conta i giorni di calendario, non le ore', () => {
    // Sera del 12 → mattina del 14: sono due giorni, non uno.
    expect(daysUntil('2026-09-14', new Date(2026, 8, 12, 23, 30))).toBe(2);
    expect(daysUntil('2026-09-14', new Date(2026, 8, 13, 0, 30))).toBe(1);
  });

  it('il giorno stesso vale zero per tutta la giornata', () => {
    expect(daysUntil('2026-09-14', new Date(2026, 8, 14, 6, 0))).toBe(0);
    expect(daysUntil('2026-09-14', new Date(2026, 8, 14, 23, 59))).toBe(0);
  });

  it('una data passata è negativa', () => {
    expect(daysUntil('2026-09-14', new Date(2026, 8, 20))).toBe(-6);
  });

  it('sopravvive al cambio dell’ora legale', () => {
    // In Italia l'ora legale finisce l'ultima domenica di ottobre: la
    // mezzanotte fra il 24 e il 25 dura un'ora in più. Normalizzando a
    // mezzogiorno il conto non se ne accorge, com'è giusto.
    expect(daysUntil('2026-10-26', new Date(2026, 9, 24, 12))).toBe(2);
    expect(daysUntil('2026-03-30', new Date(2026, 2, 28, 12))).toBe(2);
  });

  it('una data illeggibile non fa esplodere nulla', () => {
    expect(daysUntil('14 settembre', new Date(2026, 8, 1))).toBeNull();
    expect(daysUntil('2026-13-45', new Date(2026, 8, 1))).not.toBeNaN();
  });
});

describe('preparazione complessiva', () => {
  it('a mani vuote è zero e lo dice', () => {
    const r = computeReadiness(base);
    expect(r.percent).toBe(0);
    expect(r.verdict).toMatch(/non hai ancora segnato/i);
  });

  it('le tre gambe pesano quanto dichiarato', () => {
    const r = computeReadiness({
      ...base,
      studiedTopics: 17,
      bankSeen: 199,
      averageScore: 30,
      fullExamsTaken: 1,
    });
    expect(r.percent).toBe(100);
    expect(r.slices.map((s) => s.weight)).toEqual([
      WEIGHTS.studio,
      WEIGHTS.pratica,
      WEIGHTS.resa,
    ]);
  });

  it('chi ha letto tutto ma non si è mai messo alla prova NON è al 100 %', () => {
    // È il caso che il calcolatore esiste per intercettare: rinormalizzare i
    // pesi sulle gambe misurate lo premierebbe proprio per ciò che gli manca.
    const r = computeReadiness({ ...base, studiedTopics: 17, bankSeen: 199 });
    expect(r.percent).toBe(WEIGHTS.studio + WEIGHTS.pratica);
    expect(r.percent).toBeLessThan(100);

    const resa = r.slices.find((s) => s.id === 'resa');
    expect(resa?.measured, 'la UI deve poter dire «non ancora misurata»').toBe(false);
    expect(resa?.points).toBe(0);
  });

  it('la resa si misura solo con una prova completa alle spalle', () => {
    const senza = computeReadiness({ ...base, averageScore: 24, fullExamsTaken: 0 });
    expect(senza.slices.find((s) => s.id === 'resa')?.measured).toBe(false);

    const con = computeReadiness({ ...base, averageScore: 24, fullExamsTaken: 2 });
    const resa = con.slices.find((s) => s.id === 'resa');
    expect(resa?.measured).toBe(true);
    expect(resa?.percent).toBe(80); // 24 su 30
  });
});

describe('ritmo da tenere', () => {
  it('senza data non c’è ritmo da calcolare', () => {
    expect(computeReadiness(base).pace).toBeNull();
  });

  it('divide quel che resta per i giorni che restano', () => {
    const r = computeReadiness({
      ...base,
      studiedTopics: 3,
      minutesLeft: 120,
      daysLeft: 20,
    });
    expect(r.pace?.minutesPerDay).toBe(6); // 120 / 20
    expect(r.pace?.modulesPerWeek).toBe(5); // 14 moduli in ~2,86 settimane
  });

  it('il giorno stesso non divide per zero', () => {
    const r = computeReadiness({ ...base, studiedTopics: 10, daysLeft: 0 });
    expect(Number.isFinite(r.pace?.minutesPerDay ?? NaN)).toBe(true);
    expect(r.verdict).toMatch(/è oggi/i);
  });

  it('segnala quando il piano non sta in piedi', () => {
    const calmo = computeReadiness({ ...base, minutesLeft: 600, daysLeft: 60 });
    expect(calmo.pace?.tight).toBe(false);

    const stretto = computeReadiness({ ...base, minutesLeft: 600, daysLeft: 2 });
    expect(stretto.pace?.tight, '300 minuti al giorno non sono un piano').toBe(true);
  });

  it('una data passata toglie il ritmo e lo dice', () => {
    const r = computeReadiness({ ...base, daysLeft: -3 });
    expect(r.pace).toBeNull();
    expect(r.verdict).toMatch(/passata/i);
  });

  it('a programma chiuso e prove fatte non resta un ritmo da tenere', () => {
    const r = computeReadiness({
      ...base,
      studiedTopics: 17,
      minutesLeft: 0,
      fullExamsTaken: 9,
      daysLeft: 3,
    });
    expect(r.pace).toBeNull();
  });
});
