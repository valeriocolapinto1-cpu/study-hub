#!/usr/bin/env node
/**
 * npm run script:push — invia Code.gs, Logic.gs e appsscript.json al progetto
 * Apps Script con clasp (versione fissata). Non crea un deployment: dopo il push
 * si pubblica una nuova versione dall'editor (vedi README.md, «Aggiornare lo script»).
 *
 * Serve una volta sola:
 *   1. https://script.google.com/home/usersettings → «API di Google Apps Script»: attiva;
 *   2. npx @google/clasp@2.4.2 login   (credenziali in ~/.clasprc.json, mai nel repository);
 *   3. cp tools/apps-script/.clasp.json.example tools/apps-script/.clasp.json e incolla lo scriptId
 *      (Impostazioni progetto → ID script). Il file è in .gitignore.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLASP = '@google/clasp@2.4.2';
const dir = fileURLToPath(new URL('.', import.meta.url));

if (!existsSync(new URL('.clasp.json', import.meta.url))) {
  console.error(
    'Manca tools/apps-script/.clasp.json.\n' +
      'Copia .clasp.json.example in .clasp.json e inserisci lo scriptId del progetto\n' +
      '(Apps Script → Impostazioni progetto → ID script). Poi: npx ' +
      CLASP +
      ' login',
  );
  process.exit(1);
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
// --force: sovrascrive anche il manifest senza chiedere conferma (è versionato qui).
const run = spawnSync(npx, ['--yes', CLASP, 'push', '--force'], {
  cwd: dir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(run.status ?? 1);
