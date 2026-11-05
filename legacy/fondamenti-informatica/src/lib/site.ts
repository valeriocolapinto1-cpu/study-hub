/**
 * Identità del sito, in un posto solo.
 *
 * Erano costanti sparse fra `app.tsx`, `Notes.tsx` e i file statici. Le
 * raccoglie qui perché stanno per cambiare tutte insieme: trasloco
 * dell'hosting, dominio proprio, rinomina del repository. Cambiarle in un
 * punto solo è la differenza fra una modifica e una caccia al refuso.
 */

export const SITE_NAME = 'AE·FIN';

export const SITE_TITLE = 'AE·FIN — Palestra di Architettura degli Elaboratori';

/**
 * Indirizzo pubblico, senza barra finale.
 *
 * GitHub Pages sotto il path del repository. Se un giorno dovesse cambiare,
 * questa riga è l'unico punto da toccare.
 */
export const SITE_URL =
  'https://valeriocolapinto1-cpu.github.io/fondamenti-di-informatica-AEFIN';

export const REPO_URL =
  'https://github.com/valeriocolapinto1-cpu/fondamenti-di-informatica-AEFIN';

/**
 * Chi risponde del sito.
 *
 * Una segnalazione su un contenuto — «questo è mio, toglilo», «qui c'è scritta
 * una cosa falsa sul mio corso» — deve avere un destinatario reale, altrimenti
 * la procedura di rimozione scritta in `COMPLIANCE.md` è una promessa a vuoto.
 *
 * **Facoltativo.** Finché è vuoto l'interfaccia mostra le segnalazioni via
 * GitHub e tace sul resto, invece di stampare un segnaposto: le issue sono un
 * canale pubblico e funzionante, solo meno diretto. Riempirlo se vuoi anche un
 * recapito privato.
 */
export const OWNER = {
  name: 'Valerio Colapinto',
  email: 'valeriocolapinto1@gmail.com',
  linkedin: 'https://www.linkedin.com/in/valerio-colapinto',
} as const;

/** Vero quando i recapiti del titolare sono stati riempiti. */
export const hasOwnerContact = (): boolean =>
  OWNER.name.trim() !== '' && OWNER.email.trim() !== '';
