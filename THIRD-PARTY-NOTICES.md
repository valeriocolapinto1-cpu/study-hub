# Componenti di terze parti

Questo progetto usa i seguenti componenti, ciascuno con la propria licenza. Le licenze originali restano valide.

| Componente | Versione | Licenza | Note |
|---|---|---|---|
| Preact | vedi package.json | MIT | Libreria UI inclusa nel bundle delle isole interattive |
| KaTeX | vedi package.json | MIT | Formule rese a build-time; foglio di stile e font inclusi nel sito |
| Geist e Geist Mono (font) | variable | SIL Open Font License 1.1 | Tramite `@fontsource-variable/geist` e `geist-mono`, inclusi nel sito |
| Source Serif 4 (font) | variable | SIL Open Font License 1.1 | Tramite `@fontsource-variable/source-serif-4`, incluso nel sito |
| Astro, @astrojs/* , remark-math, rehype-katex | vedi package.json | MIT | Solo build |
| Vitest, Playwright, axe-core, Lighthouse CI, Prettier, TypeScript | vedi package.json | MIT / Apache-2.0 / MPL-2.0 | Solo strumenti di sviluppo e test |

Le dipendenze di sviluppo (strumenti di build e di test) non sono distribuite con il sito pubblicato.
I siti originali in `legacy/` mantengono i propri file di licenza e di avvisi; non sono pubblicati.
Gli eventuali file in `.agents/` e `.claude/` sono strumenti di lavoro con licenza propria: non fanno parte dei contenuti del sito.
