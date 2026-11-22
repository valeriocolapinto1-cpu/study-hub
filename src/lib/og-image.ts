/**
 * Immagini di anteprima per i social (og:image, 1200×630) generate a build-time con sharp:
 * fondo e marchio in SVG (librsvg, solo forme), testi con Pango e il font Geist in TTF
 * (`tools/og/fonts/`, OFL): Pango non legge i woff2 del sito e non deve dipendere dai font
 * installati sul computer della build. Solo lato server (endpoint `src/pages/og/`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type OverlayOptions } from 'sharp';
import { OG_HEIGHT, OG_WIDTH } from './seo';

const FONTS = join(process.cwd(), 'tools/og/fonts');
const FONT_REGULAR = join(FONTS, 'Geist-Regular.ttf');
const FONT_SEMIBOLD = join(FONTS, 'Geist-SemiBold.ttf');

export interface OgPalette {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
}

/** Tela del sito (tema scuro di `tokens.css`). */
export const SITE_PALETTE: OgPalette = {
  bg: '#05060c',
  surface: '#0d1020',
  text: '#eaf0ff',
  muted: '#9ba6c6',
  accent: '#8b93ff',
};

/** Colori del tema scuro di un corso, letti da `src/styles/courses/<id>.css` (ripiego: sito). */
export function coursePalette(courseId: string): OgPalette {
  let css = '';
  try {
    css = readFileSync(join(process.cwd(), 'src/styles/courses', `${courseId}.css`), 'utf8');
  } catch {
    return SITE_PALETTE;
  }
  // Primo blocco del corso senza tema chiaro: lo scuro, predefinito.
  const start = css.search(/html\[data-course=['"][\w-]+['"]\]:not\(\[data-theme=['"]light['"]\]\)\s*\{/);
  const body = start < 0 ? '' : css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const pick = (name: string, fallback: string) =>
    new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(body)?.[1]?.toLowerCase() ?? fallback;
  return {
    bg: pick('bg', SITE_PALETTE.bg),
    surface: pick('surface', SITE_PALETTE.surface),
    text: pick('text', SITE_PALETTE.text),
    muted: pick('text-muted', SITE_PALETTE.muted),
    accent: pick('accent', SITE_PALETTE.accent),
  };
}

export interface OgCard {
  /** Riga piccola sopra il titolo (anno, area). */
  eyebrow: string;
  title: string;
  subtitle?: string | undefined;
  /** Riga in basso (nome del sito). */
  footer: string;
  /** Indirizzo mostrato in basso a destra. */
  url: string;
  palette: OgPalette;
}

const escapeMarkup = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const MARGIN = 88;

async function text(
  markup: string,
  options: { size: number; color: string; bold?: boolean; width?: number; spacing?: number },
) {
  const { data, info } = await sharp({
    text: {
      text: `<span foreground="${options.color}">${markup}</span>`,
      font: `Geist ${options.bold ? 'SemiBold' : 'Regular'} ${options.size}`,
      fontfile: options.bold ? FONT_SEMIBOLD : FONT_REGULAR,
      width: options.width ?? OG_WIDTH - 2 * MARGIN,
      dpi: 72,
      rgba: true,
      wrap: 'word',
      ...(options.spacing ? { spacing: options.spacing } : {}),
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function background(p: OgPalette): Buffer {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">
  <defs>
    <radialGradient id="glow" cx="0.85" cy="0" r="0.9">
      <stop offset="0" stop-color="${p.accent}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3ce6ff"/><stop offset=".55" stop-color="#8b93ff"/><stop offset="1" stop-color="#c483ff"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="${p.text}" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="${p.bg}"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <rect x="0" y="${OG_HEIGHT - 14}" width="${OG_WIDTH}" height="14" fill="${p.accent}"/>
  <g transform="translate(${MARGIN} 72) scale(1.25)">
    <rect x="2" y="2" width="60" height="60" rx="16" fill="${p.surface}" stroke="url(#brand)" stroke-width="2.5"/>
    <path d="M17 20l15 26 15-26" fill="none" stroke="url(#brand)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`);
}

/** PNG 1200×630 della scheda. */
export async function renderOgImage(card: OgCard): Promise<Buffer> {
  const p = card.palette;
  const eyebrow = await text(escapeMarkup(card.eyebrow.toUpperCase()), {
    size: 26,
    color: p.accent,
    bold: true,
  });
  const title = await text(escapeMarkup(card.title), { size: 84, color: p.text, bold: true, spacing: -6 });
  const subtitle = card.subtitle
    ? await text(escapeMarkup(card.subtitle), { size: 38, color: p.muted })
    : undefined;
  const footer = await text(escapeMarkup(card.footer), { size: 28, color: p.text, bold: true, width: 560 });
  const url = await text(escapeMarkup(card.url), { size: 24, color: p.muted, width: 620 });

  // Blocco centrale (occhiello, titolo, sottotitolo) allineato in basso sopra il piè.
  const footerTop = OG_HEIGHT - 72 - footer.height;
  const gap = 18;
  const blockHeight = eyebrow.height + gap + title.height + (subtitle ? gap + subtitle.height : 0);
  let y = Math.max(200, footerTop - 56 - blockHeight);
  const layers: OverlayOptions[] = [{ input: eyebrow.data, left: MARGIN, top: y }];
  y += eyebrow.height + gap;
  layers.push({ input: title.data, left: MARGIN, top: y });
  y += title.height + gap;
  if (subtitle) layers.push({ input: subtitle.data, left: MARGIN, top: y });
  layers.push({ input: footer.data, left: MARGIN, top: footerTop });
  layers.push({
    input: url.data,
    left: OG_WIDTH - MARGIN - url.width,
    top: footerTop + Math.round((footer.height - url.height) / 2),
  });

  return sharp(background(p))
    .resize(OG_WIDTH, OG_HEIGHT)
    .composite(layers)
    .flatten({ background: p.bg })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();
}
