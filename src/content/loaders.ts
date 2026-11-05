/**
 * Loader per i file YAML che contengono un ELENCO di voci (formule, esercizi,
 * flashcard). Ogni voce diventa un'entry con id `<courseId>/<id>`; il corso si
 * ricava dal percorso: `<dir>/<courseId>/<file>.yaml` oppure `<dir>/<courseId>.yaml`.
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { Loader } from 'astro/loaders';

export interface ListFileItem {
  course: string;
  file: string;
  item: Record<string, unknown>;
}

async function walk(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.ya?ml$/.test(entry.name)) out.push(full);
  }
  return out.sort();
}

/** Legge tutti i file di elenco sotto `dir` (usato anche dai test). */
export async function readListFiles(dir: string): Promise<ListFileItem[]> {
  const items: ListFileItem[] = [];
  for (const file of await walk(dir)) {
    const rel = relative(dir, file).split(sep);
    const course = rel.length > 1 ? rel[0]! : rel[0]!.replace(/\.ya?ml$/, '');
    const parsed: unknown = parse(await readFile(file, 'utf8'));
    if (parsed == null) continue;
    if (!Array.isArray(parsed)) throw new Error(`${file}: atteso un elenco YAML di voci`);
    for (const raw of parsed) {
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
        throw new Error(`${file}: ogni voce deve essere un oggetto`);
      items.push({ course, file, item: { ...(raw as Record<string, unknown>), course } });
    }
  }
  return items;
}

export function yamlListLoader(base: string): Loader {
  return {
    name: 'study-hub-yaml-list',
    async load({ store, parseData, generateDigest, config, watcher, logger }) {
      const dir = fileURLToPath(new URL(base, config.root));
      const sync = async () => {
        store.clear();
        for (const { course, file, item } of await readListFiles(dir)) {
          const id = `${course}/${String(item.id)}`;
          if (store.has(id)) throw new Error(`${file}: id duplicato "${id}"`);
          const data = await parseData({ id, data: item, filePath: file });
          store.set({
            id,
            data,
            digest: generateDigest(data),
            filePath: relative(fileURLToPath(config.root), file),
          });
        }
      };
      await sync();
      watcher?.add(dir);
      watcher?.on('all', (_event, changed) => {
        if (changed.startsWith(dir)) sync().catch((err: unknown) => logger.error(String(err)));
      });
    },
  };
}
