/* Esercizi: indice degli appelli d'esame per argomento. Testi, figure e soluzioni NON sono riprodotti:
   restano nella cartella ufficiale del corso (link in data/appelli.json → fonte). */
page(async () => {
  const { programma, appelli } = await loadData("programma", "appelli");
  const { blocchi } = indexProgramma(programma);
  const app = $("#app");
  const BLOCCHI_ES = ["b1", "b2", "b3", "b4", "b5"];

  const ex = appelli.appelli.flatMap((a) => a.esercizi.map((e) => ({ ...e, appello: a, id: `${a.id}-${e.n}` })));
  const th = appelli.appelli.flatMap((a) => a.teoria.map((q) => ({ ...q, appello: a })));
  const anni = [...new Set(appelli.appelli.map((a) => a.data.slice(0, 4)))];

  const exCard = (e) => `
    <article class="card exercise" id="es-${e.id}" data-id="${e.id}" data-block="${e.blocco}" data-year="${e.appello.data.slice(0, 4)}" data-search="${esc(norm(`${e.appello.titolo} esercizio ${e.n} ${blocchi[e.blocco].titolo}`))}">
      <div class="q-head">
        <span class="chip bchip" style="--bc:${blockColor(e.blocco)};margin:0">${esc(blocchi[e.blocco].titolo)}</span>
        <span class="small muted">${esc(e.appello.titolo)} · esercizio ${e.n}</span>
      </div>
      <p class="small">Argomento (stimato): <strong>${esc(blocchi[e.blocco].titolo)}</strong>. Il testo è nel PDF dell'appello, nella <a href="${esc(appelli.fonte)}" target="_blank" rel="noopener">cartella ufficiale del corso${EXT}</a>.</p>
      <div class="ex-foot">
        ${checkbox("exam", e.id, "Risolto")}
      </div>
    </article>`;

  app.innerHTML = `
    ${pageHead("Esercizi", "Esercizi d'esame", `Indice di ${ex.length} esercizi e ${th.length} domande di teoria dei ${appelli.appelli.length} appelli pubblicati dai docenti, ordinati per argomento. I testi si aprono dalla cartella ufficiale del corso: qui li trovi per argomento e segni quelli che hai risolto.`)}
    <section class="card gen-card" id="gen" aria-labelledby="gen-h">
      <h2 id="gen-h" style="margin-top:0">Genera un esercizio nuovo</h2>
      <p class="small muted">Esercizi originali sulla tipologia degli appelli passati: numeri casuali, soluzione calcolata passo per passo. Nessun testo d'esame è riprodotto.</p>
      <div class="toolbar no-print">
        <select id="g-blocco" name="gblocco" aria-label="Argomento dell'esercizio">
          <option value="">Qualsiasi argomento</option>
          ${BLOCCHI_ES.map((b) => `<option value="${b}">${esc(blocchi[b].titolo)}</option>`).join("")}
        </select>
        <button class="btn primary" type="button" id="g-new">Nuovo esercizio</button>
      </div>
      <div id="g-out" aria-live="polite"></div>
    </section>
    <div class="segmented" role="tablist" aria-label="Tipo">
      <button type="button" role="tab" id="tab-es" data-value="esercizi" aria-controls="panel-es" aria-selected="true">Esercizi</button>
      <button type="button" role="tab" id="tab-th" data-value="teoria" aria-controls="panel-th" aria-selected="false">Domande di teoria</button>
    </div>

    <section id="panel-es" role="tabpanel" aria-labelledby="tab-es">
      <div class="toolbar no-print">
        <input type="search" id="q" name="q" placeholder="Cerca (es. 2024, solenoide, onde)…" aria-label="Cerca negli esercizi" autocomplete="off">
        <select id="f-blocco" name="blocco" aria-label="Argomento">
          <option value="">Tutti gli argomenti</option>
          ${BLOCCHI_ES.map((b) => `<option value="${b}">${esc(blocchi[b].titolo)}</option>`).join("")}
        </select>
        <select id="f-anno" name="anno" aria-label="Anno">
          <option value="">Tutti gli anni</option>
          ${anni.map((y) => `<option value="${y}">${y}</option>`).join("")}
        </select>
        <label><input type="checkbox" id="f-todo" name="todo"> Solo da risolvere</label>
      </div>
      <div class="progress-row" style="padding:0 0 14px">
        <span class="label">Risolti</span><span class="val" id="ex-count"></span>
        <span id="ex-bar" style="grid-column:1/-1"></span>
      </div>
      <p class="small muted" id="shown" role="status" aria-live="polite"></p>
      <div class="ex-list" id="ex-list">${ex.map(exCard).join("")}</div>
    </section>

    <section id="panel-th" role="tabpanel" aria-labelledby="tab-th" hidden>
      ${BLOCCHI_ES.concat(["b6"]).map((b) => {
        const qs = th.filter((q) => q.blocco === b);
        if (!qs.length) return "";
        return `<div class="section-title"><h2 style="display:flex;align-items:center;gap:10px"><span class="dot" style="--bc:${blockColor(b)};width:10px;height:10px"></span>${esc(blocchi[b].titolo)}</h2><span class="small muted">${qs.length} domande</span></div>
          <div class="card"><ul class="th-list">${qs.map((q) => `<li>Domanda di teoria ${q.n} <span class="small muted">· ${esc(q.appello.titolo)}</span></li>`).join("")}</ul></div>`;
      }).join("")}
    </section>
    <p class="small muted" style="margin-top:20px">Fonte: <a href="${esc(appelli.fonte)}" target="_blank" rel="noopener">cartella degli appelli del corso${EXT}</a>. L'argomento di ogni esercizio è assegnato automaticamente e può essere impreciso.</p>`;

  /* ---------- generatore di esercizi ---------- */
  function mostraGenerato() {
    const b = $("#g-blocco").value || null, seed = Math.floor(Math.random() * 900000) + 100000;
    const e = Generatore.generaEsercizio(seed, b);
    $("#g-out").innerHTML = `
      <article class="exercise gen-ex">
        <div class="q-head"><span class="chip bchip" style="--bc:${blockColor(e.blocco)};margin:0">${esc(blocchi[e.blocco].titolo)}</span><span class="small muted">${esc(e.tema)} · codice ${seed}</span></div>
        <p class="q-title">${esc(e.testo)}</p>
        <details class="official sol"><summary>Mostra la soluzione</summary>
          <ol class="sol-steps">${e.passi.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
          <p class="sol-res"><strong>Risultati.</strong> ${e.risultati.map((x) => `$${esc(x)}$`).join(" &nbsp;·&nbsp; ")}</p>
        </details>
      </article>`;
    renderMathIn($("#g-out"));
  }
  $("#g-new").addEventListener("click", mostraGenerato);
  mostraGenerato();

  function updateProgress() {
    const done = Store.count("exam", ex.map((e) => e.id));
    $("#ex-count").textContent = `${done}/${ex.length}`;
    $("#ex-bar").innerHTML = progressBar(pct(done, ex.length));
  }
  const cards = $all(".exercise");
  function applyFilters() {
    const words = norm($("#q").value.trim()).split(/\s+/).filter(Boolean);
    const fb = $("#f-blocco").value, fy = $("#f-anno").value, todo = $("#f-todo").checked;
    let shown = 0;
    cards.forEach((el) => {
      const ok = words.every((w) => el.dataset.search.includes(w))
        && (!fb || el.dataset.block === fb) && (!fy || el.dataset.year === fy)
        && (!todo || !Store.get("exam", el.dataset.id));
      el.classList.toggle("hidden", !ok);
      if (ok) shown++;
    });
    $("#shown").textContent = shown === cards.length ? "" : shown ? `${shown} esercizi su ${cards.length}` : "Nessun esercizio con questi filtri: prova un'altra parola o togli un filtro.";
    setParams({ q: $("#q").value.trim(), blocco: fb, anno: fy, todo });
  }

  const params = getParams();
  $("#q").value = params.get("q") || "";
  $("#f-blocco").value = params.get("blocco") || "";
  $("#f-anno").value = params.get("anno") || "";
  $("#f-todo").checked = params.get("todo") === "1";
  const tabs = segmented($(".segmented"), (v) => setParams({ vista: v === "teoria" ? "teoria" : "" }));
  tabs.select(params.get("vista") === "teoria" ? "teoria" : "esercizi");
  updateProgress();
  applyFilters();
  bindChecks($("#ex-list"), () => { updateProgress(); if ($("#f-todo").checked) applyFilters(); });
  ["#q", "#f-blocco", "#f-anno", "#f-todo"].forEach((s) => $(s).addEventListener("input", applyFilters));
});
