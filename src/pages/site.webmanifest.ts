/**
 * Manifest della PWA, generato per avere percorsi dalla base del sito e scorciatoie dai corsi.
 * `id` uguale all'URL di avvio: è l'identità che Chrome dava già all'app installata senza `id`
 * (cambiarlo creerebbe un'altra app). In italiano, la lingua predefinita del sito.
 * Le schermate (`public/screenshots/`) si rigenerano con `node tools/screenshots.mjs`.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { DEFAULT_LANG, SITE } from '../config/site';
import { localizePath, t, tr, withBase } from '../i18n';
import { coursePath, sortCourses } from '../lib/courses';

const lang = DEFAULT_LANG;

/** Schermate per l'installazione (dimensioni reali dei file, verificate da un test). */
const SCREENSHOTS = [
  { file: 'screenshots/home-narrow.webp', sizes: '780x1688', form_factor: 'narrow', key: 'home.title' },
  {
    file: 'screenshots/teoria-narrow.webp',
    sizes: '780x1688',
    form_factor: 'narrow',
    key: 'nav.course.theory',
  },
  { file: 'screenshots/home-wide.webp', sizes: '1440x900', form_factor: 'wide', key: 'home.title' },
] as const;

export const GET: APIRoute = async () => {
  const courses = sortCourses((await getCollection('courses')).map((c) => c.data));
  const icon = [{ src: withBase('icon-192.png'), sizes: '192x192', type: 'image/png' }];
  const manifest = {
    id: withBase(''),
    name: SITE.title[lang],
    short_name: SITE.shortTitle[lang],
    description: SITE.description[lang],
    lang: 'it-IT',
    dir: 'ltr',
    start_url: withBase(''),
    scope: withBase(''),
    display: 'standalone',
    orientation: 'any',
    background_color: SITE.themeColor.dark,
    theme_color: SITE.themeColor.dark,
    categories: ['education'],
    icons: [
      { src: withBase('icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: withBase('icon-512.png'), sizes: '512x512', type: 'image/png' },
      { src: withBase('icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: t(lang, 'manifest.review'), url: localizePath('ripasso', lang), icons: icon },
      ...courses.map((c) => ({
        name: tr(c.title, lang),
        ...(c.subtitle && { description: tr(c.subtitle, lang) }),
        url: localizePath(coursePath(c), lang),
        icons: icon,
      })),
    ],
    screenshots: SCREENSHOTS.map((s) => ({
      src: withBase(s.file),
      sizes: s.sizes,
      type: 'image/webp',
      form_factor: s.form_factor,
      label: t(lang, s.key),
    })),
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
