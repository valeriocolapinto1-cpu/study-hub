import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Estrattore d'esempio: legge i titoli <h2 class="topic"> e il gruppo della sezione. */
export default function extract(legacyDir) {
  const html = readFileSync(join(legacyDir, 'index.html'), 'utf8');
  const out = [];
  for (const section of html.matchAll(/<section data-group="([^"]+)">([\s\S]*?)<\/section>/g)) {
    for (const m of section[2].matchAll(/<h2 class="topic">([^<]+)<\/h2>/g))
      out.push({ title: m[1], group: section[1] });
  }
  return out;
}
