/**
 * Immagini di anteprima per i social (og:image), una per lingua per il sito e per ogni corso:
 * `og/<lingua>/sito.png`, `og/<lingua>/<corso>.png`. Generate a build-time (src/lib/og-image.ts);
 * fuori dalla shell del service worker (tools/integrations/pwa.mjs).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { LANGS, SITE } from '../../../config/site';
import { t, tr, withBase, type Lang } from '../../../i18n';
import { coursePalette, renderOgImage, SITE_PALETTE, type OgCard } from '../../../lib/og-image';
import { OG_SITE } from '../../../lib/seo';

export const getStaticPaths = (async () => {
  const courses = (await getCollection('courses')).map((c) => c.data);
  return LANGS.flatMap((lang) => [
    { params: { lang, name: OG_SITE }, props: { course: undefined } },
    ...courses.map((course) => ({ params: { lang, name: course.id }, props: { course } })),
  ]);
}) satisfies GetStaticPaths;

type Props = { course: Awaited<ReturnType<typeof getCollection<'courses'>>>[number]['data'] | undefined };

export const GET: APIRoute<Props> = async ({ params, props, site }) => {
  const lang = params.lang as Lang;
  const home = new URL(withBase(''), site ?? 'http://localhost');
  const url = `${home.host}${home.pathname}`.replace(/\/$/, '');
  const { course } = props;
  const card: OgCard = course
    ? {
        eyebrow: `${t(lang, 'home.year', { year: course.year })} · ${t(lang, 'og.degree')}`,
        title: tr(course.title, lang),
        subtitle: course.subtitle ? tr(course.subtitle, lang) : undefined,
        footer: SITE.shortTitle[lang],
        url,
        palette: coursePalette(course.id),
      }
    : {
        eyebrow: t(lang, 'og.degree'),
        title: SITE.shortTitle[lang],
        subtitle: t(lang, 'og.tagline'),
        footer: SITE.author,
        url,
        palette: SITE_PALETTE,
      };
  const png = await renderOgImage(card);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
