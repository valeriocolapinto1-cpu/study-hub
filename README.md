# Teoria dei Circuiti — sito di studio (non ufficiale)

Sito statico in italiano per preparare l'esame di *Teoria dei Circuiti* (Ingegneria Elettronica L-8, Roma).
**Strumento non ufficiale, non affiliato a Roma né al prof. [docente].** Non contiene testi, figure, numeri o soluzioni del docente: esercizi e prove sono originali, ispirati alla struttura del corso.

Stato: lavori in corso, vedi [CHECKLIST.md](CHECKLIST.md).

## Decisioni di progetto
- Solo versione pubblica; nessun PDF del docente nel repository (`sources-private/` è ignorata da git).
- HTML + CSS + JavaScript vanilla a moduli ES, senza build; KaTeX da CDN (con fallback); PWA offline opzionale.
- Stile: blu notte + ambra, con tema chiaro/scuro. Simboli circuitali ANSI/IEEE (resistore a zig-zag). Interfaccia solo in italiano, mobile-first.
- Progresso in `localStorage` con export/import JSON. Nessun account, nessun analytics.
- Badge di affidabilità: `UFFICIALE`, `STORICO`, `EDITORE`, `NON UFFICIALE`, `INFERENZA`, `DA VERIFICARE`.

## Provarlo in locale
```
python3 -m http.server 8000     # poi apri http://localhost:8000
npm test                        # node --test, nessuna dipendenza
```

## Aggiornare i dati
Appelli, programma e (in seguito) domande e risorse stanno in `data/*.json`: si modificano senza toccare l'HTML.
Le date degli appelli si cambiano solo in `data/appelli.json`.

## Deploy su GitHub Pages
Settings → Pages → Source: **GitHub Actions**. Il workflow `.github/workflows/pages.yml` esegue `npm test` e poi pubblica.
