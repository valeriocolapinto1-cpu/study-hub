/**
 * Metadati per motori di ricerca e social: percorso delle immagini di anteprima
 * (generate da `src/pages/og/`) e dati strutturati JSON-LD (schema.org).
 * Funzioni pure: gli URL assoluti li costruisce chi chiama, a partire da `Astro.site`.
 */
import type { Lang } from '../i18n';

/** Dimensioni delle immagini di anteprima (formato consigliato da Open Graph e X). */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Nome dell'immagine del sito (le altre hanno l'id del corso). */
export const OG_SITE = 'sito';

/** Percorso (senza base) dell'immagine di anteprima del sito o di un corso. */
export const ogImagePath = (lang: Lang, course?: string): string => `og/${lang}/${course ?? OG_SITE}.png`;

type JsonLd = Record<string, unknown>;

export interface WebSiteInput {
  name: string;
  description: string;
  /** URL assoluto della home nella lingua. */
  url: string;
  inLanguage: string;
  /** URL assoluto della ricerca con `{search_term_string}` al posto della query. */
  searchUrlTemplate: string;
  author: PersonInput;
}

export interface PersonInput {
  name: string;
  url: string;
}

const person = (p: PersonInput): JsonLd => ({ '@type': 'Person', name: p.name, url: p.url });

export function webSiteJsonLd(i: WebSiteInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${i.url}#sito`,
    name: i.name,
    description: i.description,
    url: i.url,
    inLanguage: i.inLanguage,
    author: person(i.author),
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: i.searchUrlTemplate },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface CourseInput {
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  image: string;
  provider: PersonInput;
  /** Argomenti del corso (titoli), in ordine. */
  topics: string[];
  educationalLevel: string;
}

export function courseJsonLd(i: CourseInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: i.name,
    description: i.description,
    url: i.url,
    inLanguage: i.inLanguage,
    image: i.image,
    educationalLevel: i.educationalLevel,
    isAccessibleForFree: true,
    provider: person(i.provider),
    ...(i.topics.length > 0 && { teaches: i.topics }),
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR', category: 'Free' },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online' },
  };
}

export interface BreadcrumbInput {
  label: string;
  /** URL assoluto; l'ultima voce (pagina corrente) può non averlo. */
  url?: string | undefined;
}

export function breadcrumbJsonLd(items: BreadcrumbInput[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.url && { item: c.url }),
    })),
  };
}

/**
 * JSON da mettere in `<script type="application/ld+json">`: `<` diventa `<`
 * così nessun testo può chiudere lo script (`</script>`) o aprire un commento HTML.
 */
export const serializeJsonLd = (data: JsonLd): string => JSON.stringify(data).replaceAll('<', '\\u003c');
