/** Script globale minimo: interruttore del tema e memoria della lingua scelta. */
import { GLOBAL_SCOPE, read, write } from '../engine/storage';
import { runMigrations } from '../engine/migrate';

type Theme = 'light' | 'dark';

const root = document.documentElement;

function currentTheme(): Theme {
  const attr = root.dataset.theme;
  if (attr === 'light' || attr === 'dark') return attr;
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncToggles() {
  const theme = currentTheme();
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
    const label = theme === 'dark' ? btn.dataset.labelLight : btn.dataset.labelDark;
    if (label) btn.setAttribute('aria-label', label);
  }
}

function applyTheme(theme: Theme) {
  root.dataset.theme = theme;
  write(GLOBAL_SCOPE, 'theme', theme);
  syncToggles();
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest('[data-theme-toggle]')) {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    return;
  }
  const langLink = target?.closest<HTMLAnchorElement>('a[data-lang-switch]');
  if (langLink?.dataset.langSwitch) write(GLOBAL_SCOPE, 'lang', langLink.dataset.langSwitch);
});

// Se non c'è una scelta esplicita, segue il sistema anche quando cambia.
if (read<string | null>(GLOBAL_SCOPE, 'theme', null) === null) {
  globalThis.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', syncToggles);
}

syncToggles();
runMigrations();
