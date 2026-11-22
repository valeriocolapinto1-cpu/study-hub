import { describe, expect, it } from 'vitest';
import {
  breadcrumbJsonLd,
  courseJsonLd,
  ogImagePath,
  serializeJsonLd,
  webSiteJsonLd,
} from '../../src/lib/seo';

const author = { name: 'A', url: 'https://example.org/it/chi-sono/' };

describe('dati strutturati', () => {
  it('WebSite con SearchAction coerente (segnaposto nel modello e in query-input)', () => {
    const ld = webSiteJsonLd({
      name: 'Sito',
      description: 'd',
      url: 'https://example.org/it/',
      inLanguage: 'it-IT',
      searchUrlTemplate: 'https://example.org/it/?q={search_term_string}',
      author,
    });
    expect(ld['@type']).toBe('WebSite');
    const action = ld.potentialAction as Record<string, unknown>;
    expect(action['@type']).toBe('SearchAction');
    expect((action.target as { urlTemplate: string }).urlTemplate).toContain('{search_term_string}');
    expect(action['query-input']).toBe('required name=search_term_string');
  });

  it('Course gratuito con fornitore, lingua e argomenti', () => {
    const input = {
      name: 'Corso',
      description: 'd',
      url: 'https://example.org/it/anno-1/c/',
      inLanguage: 'it-IT',
      image: 'https://example.org/og/it/c.png',
      provider: author,
      topics: ['Uno', 'Due'],
      educationalLevel: 'Triennale',
    };
    expect(courseJsonLd(input)).toMatchObject({
      '@type': 'Course',
      isAccessibleForFree: true,
      provider: { '@type': 'Person', name: 'A' },
      teaches: ['Uno', 'Due'],
      offers: { price: 0, category: 'Free' },
    });
    expect(courseJsonLd({ ...input, topics: [] })).not.toHaveProperty('teaches');
  });

  it('BreadcrumbList con posizioni da 1 e voci senza URL ammesse', () => {
    const ld = breadcrumbJsonLd([{ label: 'Home', url: 'https://example.org/' }, { label: 'Pagina' }]);
    expect(ld.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.org/' },
      { '@type': 'ListItem', position: 2, name: 'Pagina' },
    ]);
  });

  it('serializzazione sicura dentro <script>', () => {
    const out = serializeJsonLd({ name: '</script><!-- x' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out)).toEqual({ name: '</script><!-- x' });
  });

  it('percorsi delle immagini di anteprima', () => {
    expect(ogImagePath('it')).toBe('og/it/sito.png');
    expect(ogImagePath('en', 'fisica-1')).toBe('og/en/fisica-1.png');
  });
});
