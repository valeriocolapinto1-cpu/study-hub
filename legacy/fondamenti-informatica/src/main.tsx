import { render } from 'preact';
import './styles/index.css';
import { App } from '~/app';

const root = document.getElementById('app');
if (!root) throw new Error('Elemento #app non trovato in index.html');

/**
 * Via il segnaposto di caricamento prima di montare.
 *
 * `render` di Preact **aggiunge** l'app ai figli già presenti invece di
 * sostituirli: senza questa riga il «Caricamento…» resterebbe in cima alla
 * pagina per sempre, alto quanto la finestra, con il sito spinto sotto.
 * Ripulire e montare avvengono nello stesso frame, quindi non si vede
 * nessuno sfarfallio.
 */
root.replaceChildren();

render(<App />, root);
