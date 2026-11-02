import { loadJSON, esc, url, badge, withBadges } from '../ui.js';
import { getStato, setStato, STATI } from '../progress.js';
import { typeset } from '../katex.js';

// Le stringhe dei contenuti sono nostre (data/studio/*.json): se iniziano con '<' sono HTML, altrimenti un paragrafo.
const blk = (s) => (s.trim().startsWith('<') ? s : `<p>${s}</p>`);
const list = (a) => a.map(blk).join('');

(async () => {
  const root = document.getElementById('studio-root');
  const t = new URLSearchParams(location.search).get('t');
  const syl = await loadJSON('data/syllabus.json');
  if (!t) {
    root.innerHTML = '<h1>Studio</h1><p>Scegli un argomento dal <a href="' + url('programma/') + '">Programma</a>.</p>';
    return;
  }
  const a = syl.argomenti.find((x) => x.id === t);
  if (!a) { root.innerHTML = '<h1>Argomento non trovato</h1><p><a href="' + url('programma/') + '">Torna al Programma</a></p>'; return; }
  document.title = a.titolo;
  const blocco = syl.blocchi.find((b) => b.id === a.blocco);
  const pre = a.prerequisiti.map((id) => syl.argomenti.find((x) => x.id === id)).filter(Boolean);
  let c = null;
  if (a.contenuto) { try { c = await loadJSON(`data/studio/${a.id}.json`); } catch (e) { c = null; } }
  let form = [];
  if (c && c.formulario && c.formulario.length) { try { form = (await loadJSON('data/formulario.json')).voci.filter((v) => c.formulario.includes(v.id)); } catch (e) { form = []; } }
  const idx = syl.argomenti.findIndex((x) => x.id === a.id);
  const prev = syl.argomenti[idx - 1], next = syl.argomenti[idx + 1];

  const sec = (n, titolo, body) => body ? `<section aria-labelledby="s${n}"><h2 id="s${n}">${n}. ${titolo}</h2>${body}</section>` : '';
  const render = async () => {
    const st = getStato(a.id);
    const body = c ? [
      sec(1, 'Obiettivi e prerequisiti', `<ul>${c.obiettivi.map((o) => `<li>${o}</li>`).join('')}</ul>` +
        `<p><strong>Prerequisiti:</strong> ${pre.length ? pre.map((p) => `<a href="${url(p.pagina)}">${esc(p.id)} · ${esc(p.titolo)}</a> <span class="muted">[${esc(getStato(p.id))}]</span>`).join('; ') : 'nessuno'}.</p>`),
      sec(2, 'Teoria', list(c.teoria)),
      sec(3, 'Dimostrazioni', (c.dimostrazioni || []).map((d) => `<details class="proof"><summary>${esc(d.titolo)}</summary>
        ${d.enunciato ? `<p><strong>Enunciato.</strong> ${d.enunciato}</p>` : ''}<ol>${d.passi.map((p) => `<li>${p}</li>`).join('')}</ol>
        ${d.nota ? `<p class="muted">${withBadges(d.nota)}</p>` : ''}</details>`).join('') || '<p class="muted">Nessuna dimostrazione richiesta per questo argomento.</p>'),
      sec(4, 'Esempi svolti', (c.esempi || []).map((e) => `<details open><summary>${esc(e.titolo)} <span class="ex-tag">esempio didattico, non traccia d'esame</span></summary>
        ${blk(e.testo)}<ol>${e.soluzione.map((p) => `<li>${p}</li>`).join('')}</ol></details>`).join('')),
      sec(5, 'Schemi', (c.figure || []).map((f) => `<figure class="fig"><div role="img" aria-label="${esc(f.alt)}">${f.svg}</div><figcaption>${esc(f.alt)}</figcaption></figure>`).join('')),
      sec(6, 'Errori tipici', (c.errori || []).map((e) => `<div class="card"><p class="wrong"><strong>Sbagliato:</strong> ${e.sbagliato}</p><p class="right"><strong>Corretto:</strong> ${e.corretto}</p></div>`).join('')),
      sec(7, 'Cosa chiede l\'esame', `<p>${withBadges(c.esame)}</p>`),
      sec(8, 'Risorse gratuite collegate', '<p class="muted">Disponibili con la pagina Risorse (fase successiva).</p>'),
      sec(9, 'Formulario collegato', form.length ? form.map((f) => `<div class="card"><strong>${esc(f.titolo)}</strong><div class="fformula">$$${f.formula}$$</div><small class="muted">${esc(f.simboli)}</small></div>`).join('') : '<p class="muted">Nessuna voce collegata.</p>'),
    ].filter(Boolean).join('') : '<div class="notice">Pagina di teoria in preparazione: sarà completata nelle fasi di contenuto (blocchi III–VI: fase 7).</div>' +
      `<h2>Prerequisiti</h2>${pre.length ? `<ul>${pre.map((p) => `<li><a href="${url(p.pagina)}">${esc(p.id)} · ${esc(p.titolo)}</a></li>`).join('')}</ul>` : '<p>Nessuno.</p>'}`;
    root.innerHTML = `<p class="muted"><a href="${url('programma/#' + blocco.id)}">Blocco ${esc(blocco.id)} — ${esc(blocco.titolo)}</a></p><h1>${esc(a.titolo)}</h1>
      <p>${badge('UFFICIALE')} argomento del programma · importanza per l'esercizio d'analisi: ${'●'.repeat(a.peso)}${'○'.repeat(3 - a.peso)} ${badge('INFERENZA')}</p>
      ${body}
      <section><h2 id="s10">10. Il tuo stato</h2><div class="row"><span>Stato attuale: <strong class="st-${st.replace(' ', '')}">${esc(st)}</strong></span>
      <button class="btn primary" id="mark">Segna come studiato</button>
      <select id="stsel" aria-label="Stato">${STATI.map((s) => `<option${s === st ? ' selected' : ''}>${s}</option>`).join('')}</select></div></section>
      <nav class="row" style="justify-content:space-between;margin-top:24px" aria-label="Argomenti adiacenti">
        ${prev ? `<a class="btn" href="${url(prev.pagina)}">← ${esc(prev.id)}</a>` : '<span></span>'}${next ? `<a class="btn" href="${url(next.pagina)}">${esc(next.id)} →</a>` : ''}</nav>`;
    root.querySelector('#mark').addEventListener('click', () => { setStato(a.id, 'studiato'); render(); });
    root.querySelector('#stsel').addEventListener('change', (e) => { setStato(a.id, e.target.value); render(); });
    await typeset(root);
  };
  await render();
})();
