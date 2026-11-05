import { describe, expect, it } from 'vitest';
import { anchored, outline, slugify } from './outline';
import { topics } from './topics';

describe('indice dei moduli', () => {
  it('ricava una sezione per ogni titolo', () => {
    const body = '<h4>Idea</h4><p>x</p><h4>Come si fa</h4><p>y</p>';
    expect(outline(body)).toEqual([
      { id: 'idea', title: 'Idea' },
      { id: 'come-si-fa', title: 'Come si fa' },
    ]);
  });

  it('toglie accenti e markup dallo slug', () => {
    expect(slugify('Perché è così <b>lento</b>?')).toBe('perche-e-cosi-lento');
  });

  it('distingue due sezioni con lo stesso titolo', () => {
    const ids = outline('<h4>Esempio</h4><h4>Esempio</h4>').map((s) => s.id);
    expect(ids).toEqual(['esempio', 'esempio-2']);
    expect(new Set(ids).size).toBe(2);
  });

  it('mette un ancoraggio su ogni titolo, senza toccare il resto', () => {
    const html = anchored('<h4>Idea</h4><p>testo</p>');
    expect(html).toBe('<h4 id="idea">Idea</h4><p>testo</p>');
  });

  it('ogni modulo reale ha un indice con ancoraggi univoci', () => {
    for (const topic of topics) {
      const sections = outline(topic.body);
      expect(sections.length, `modulo "${topic.id}"`).toBeGreaterThanOrEqual(4);
      expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
      for (const section of sections) {
        expect(anchored(topic.body), `${topic.id}/${section.id}`).toContain(
          `id="${section.id}"`,
        );
      }
    }
  });
});
