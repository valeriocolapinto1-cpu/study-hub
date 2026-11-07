# Revisione — Fisica Generale II

Dubbi emersi nella migrazione (da rivedere con Valerio). Formato: **pagina**, problema, proposta.

- `teoria/` (argomenti) — Il sito originale aveva due suddivisioni: 60 lezioni e 7 capitoli con 11 sezioni. Gli argomenti del nuovo sito sono le 11 sezioni (titoli dei capitoli della teoria), i gruppi i 7 blocchi; le lezioni restano nella Panoramica. Proposta: confermare.
- `teoria/magnetostatica-nel-vuoto/` — Nel programma ufficiale la sezione 3a non ha titolo; il titolo "Magnetostatica nel vuoto" viene dalla pagina di teoria originale. Proposta: confermare.
- `formulario/#f-inserzione` — la nota originale diceva "Verifica la nomenclatura usata dal docente": promemoria per l'autore, tolto dalla nota visibile. Proposta: verificare la nomenclatura (voltmetro "a monte/a valle") sulle dispense.
- `formulario/#f-confronto` — la nota "Verifica la definizione esatta e le soglie di compatibilità usate nelle dispense del docente" è stata tolta. Proposta: confermare la soglia $t\lesssim2$ usata nella teoria con le dispense.
- `formulario/#f-dipolo-osc`, `#f-fresnel-p` — le note dicevano "confronta con il testo" sul segno: riscritte come "il segno dipende dalla convenzione sui versi". Proposta: allineare il segno al Mencuccini-Silvestrini.
- `esame/` — I sei "risultati di apprendimento" del programma ufficiale erano segnaposto senza testo nel sito originale e non sono stati migrati. Proposta: copiarli dalla scheda ufficiale del corso nella Panoramica.
- `extra/appelli` — l'argomento di ogni esercizio degli appelli era stimato automaticamente nel sito originale. Proposta: controllare a campione con i PDF ufficiali.
- `extra/laboratorio` — obiettivi, strumentazione e voci specifiche erano marcati "indicativi". Proposta: confermare con le schede di laboratorio.
- `esercizi/` (generatori) — `b3-spira-filo-carica` era nel blocco 3 ma usa la legge di Felici: assegnato all'argomento "Campi elettrici e magnetici variabili nel tempo"; il blocco originale resta per la distribuzione delle prove. Proposta: confermare.
- Notazione — uniformata alla prevalente del sito: $\varepsilon_0$, $\hat u_r$, $\mathcal E$ per la f.e.m., $\vec D,\vec H,\vec P,\vec M$; nessuna incoerenza rilevante trovata.
- Correzioni certe applicate: nessun errore numerico nei quiz (tutte le 31 risposte numeriche ricalcolate in `tests/unit/fisica-2/risposte.test.ts`) né nei 35 template (verifica numerica indipendente su 40 semi).
