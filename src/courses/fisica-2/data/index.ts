/** Dati specifici di Fisica Generale II letti a build-time (lezioni, appelli, laboratorio). */
import { parse } from 'yaml';
import lezioniRaw from './lezioni.yaml?raw';
import appelliRaw from './appelli.yaml?raw';
import labRaw from './laboratorio.yaml?raw';

export type Text = { it: string; en: string };
export type Blocco = 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7';
export interface Lezione {
  n: number;
  tipo: 'teoria' | 'esercitazione' | 'laboratorio' | 'misura' | 'altro';
  capitoli: string | null;
  topics: string[];
  title: Text;
}
export interface Appello {
  id: string;
  data: string;
  esercizi: Blocco[];
  teoria: Blocco[];
}
export interface Esperienza {
  id: string;
  titolo: Text;
  lezioni: number[];
  obiettivo: Text;
  strumentazione: Text[];
  checklistSpecifica: Text[];
  formule: string[];
}

export const LEZIONI = parse(lezioniRaw) as Lezione[];
export const APPELLI = parse(appelliRaw) as Appello[];
export const LAB = parse(labRaw) as { checklistComune: Text[]; esperienze: Esperienza[] };

/** I 7 capitoli (blocchi) del programma, come nel sito originale. */
export const BLOCCHI: Record<Blocco, Text> = {
  b1: { it: 'Elettrostatica nel vuoto, conduttori, dielettrici', en: 'Electrostatics in vacuum, conductors, dielectrics' },
  b2: { it: 'Corrente elettrica stazionaria', en: 'Steady electric current' },
  b3: { it: 'Fenomeni magnetici stazionari nel vuoto e nella materia', en: 'Steady magnetic phenomena in vacuum and in matter' },
  b4: { it: 'Campi elettrici e magnetici variabili nel tempo', en: 'Time-varying electric and magnetic fields' },
  b5: { it: 'Onde elettromagnetiche e interazione radiazione-materia', en: 'Electromagnetic waves and radiation-matter interaction' },
  b6: { it: 'Cenni di Fisica Moderna', en: 'Introduction to modern physics' },
  b7: { it: 'Laboratorio con relazioni', en: 'Laboratory with reports' },
};

export const TIPI: Record<Lezione['tipo'], Text> = {
  teoria: { it: 'Teoria', en: 'Theory' },
  esercitazione: { it: 'Esercitazione', en: 'Exercise class' },
  laboratorio: { it: 'Laboratorio', en: 'Laboratory' },
  misura: { it: 'Teoria della misura', en: 'Measurement theory' },
  altro: { it: 'Altro', en: 'Other' },
};
