import { mountFormulario } from '../formulario.js';
mountFormulario(document.getElementById('formulario-root'));
document.getElementById('stampa').addEventListener('click', () => window.print());
document.getElementById('stampa-pref').addEventListener('click', () => {
  document.body.classList.add('print-pref');
  const p = document.querySelector('.fpref'); if (p.getAttribute('aria-pressed') !== 'true') p.click();
  setTimeout(() => { window.print(); document.body.classList.remove('print-pref'); }, 400);
});
