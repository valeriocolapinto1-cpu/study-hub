/**
 * Indice del corso richiudibile (barra laterale da 1024 px): preferenza del singolo dispositivo,
 * applicata prima del disegno dallo script del tema (`Head.astro`) come `html[data-course-index="hidden"]`.
 */
import { COURSE_INDEX_AREA, GLOBAL_SCOPE, storageKey } from '../engine/storage';

export const COURSE_INDEX_KEY = storageKey(GLOBAL_SCOPE, COURSE_INDEX_AREA);

/**
 * Script inline subito dopo il pulsante «Nascondi/Mostra indice»: allinea `aria-expanded` prima del
 * disegno e alterna lo stato al clic. Inline (hash nella CSP) per non pesare sul budget JS delle pagine.
 */
export const courseIndexScript =
  `(function(b,d){function u(){b.setAttribute('aria-expanded',d.dataset.courseIndex!=='hidden')}u();` +
  `b.addEventListener('click',function(){var h=d.dataset.courseIndex!=='hidden';` +
  `if(h)d.dataset.courseIndex='hidden';else delete d.dataset.courseIndex;` +
  `try{localStorage.setItem('${COURSE_INDEX_KEY}',JSON.stringify(h?'hidden':'shown'))}catch(e){}u()})})` +
  `(document.currentScript.previousElementSibling,document.documentElement)`;
