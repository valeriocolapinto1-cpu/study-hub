/**
 * Date d'esame salvate in formati vecchi o non validi: si ignorano invece di far fallire le isole.
 */
import { describe, expect, it } from 'vitest';
import { sanitizeExamDates } from '../../../src/islands/lib/course-state';

describe('date d’esame salvate', () => {
  it('tiene solo le coppie corso → AAAA-MM-GG', () => {
    expect(
      sanitizeExamDates({
        'fisica-2': '2027-01-20',
        'fisica-1': { date: '2027-02-01' },
        'teoria-circuiti': 20270201,
        x: '20/01/2027',
        y: null,
      }),
    ).toEqual({ 'fisica-2': '2027-01-20' });
  });

  it('valori che non sono oggetti diventano un elenco vuoto', () => {
    expect(sanitizeExamDates(null)).toEqual({});
    expect(sanitizeExamDates('2027-01-20')).toEqual({});
    expect(sanitizeExamDates(['2027-01-20'])).toEqual({});
  });
});
