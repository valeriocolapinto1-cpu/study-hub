import type { LinkItem } from './types';

/**
 * Letture consigliate.
 *
 * Qui c'erano anche la pagina personale di un docente, il regolamento del suo
 * esame, le slide di un terzo e un archivio di prove d'esame reali. Sono usciti
 * tutti: il sito non si rivolge più a un corso specifico, quindi un
 * collegamento a una persona identificabile la assocerebbe a qualcosa che non
 * ha approvato. L'archivio delle prove aveva in più il problema di essere
 * materiale di cui qualcun altro detiene i diritti.
 *
 * Restano i libri: citare un titolo in bibliografia è lecito sempre e non
 * dipende da nessuna eccezione. Nessuna delle voci ha un `url`, e non è una
 * dimenticanza — la scheda dice cos'è il libro, non dove comprarlo.
 */
export const links: LinkItem[] = [
  {
    id: 'link-hamacher',
    label: "C. Hamacher, Z. Vranesic, S. Zaky — Introduzione all'architettura dei calcolatori",
    note: 'McGraw-Hill. Copre l’intero programma; la parte su memoria e pipeline è la più distesa.',
  },
  {
    id: 'link-tanenbaum',
    label: 'A. S. Tanenbaum — Architettura dei calcolatori: un approccio strutturale',
    note: 'Pearson. Un secondo modo di raccontare le stesse cose, utile quando il primo non entra.',
  },
  {
    id: 'link-patterson',
    label: 'D. Patterson, J. Hennessy — Struttura e progetto dei calcolatori',
    note: 'Zanichelli. Il testo di riferimento su percorso dati, pipeline e prestazioni.',
  },
  {
    id: 'link-morris-mano',
    label: 'M. Morris Mano, M. Ciletti — Reti logiche',
    note: 'Pearson. Solo la parte di logica, ma con molti più esercizi svolti su Karnaugh.',
  },
  {
    id: 'link-null-lobur',
    label: 'L. Null, J. Lobur — Struttura e organizzazione dei calcolatori',
    note: 'Un’introduzione più discorsiva, adatta a chi parte davvero da zero.',
  },
  {
    id: 'link-harris',
    label: 'D. Harris, S. Harris — Sistemi digitali e architettura dei calcolatori',
    note: 'Dalla porta logica al processore in un unico percorso, con molti schemi.',
  },
];
