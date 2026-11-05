/* Laboratorio: 5 esperienze con checklist della relazione */
page(async () => {
  const { laboratorio, formule, lezioni } = await loadData("laboratorio", "formule", "lezioni");
  const app = $("#app");

  const fIndex = {};
  for (const b of formule.blocchi) for (const g of b.gruppi) for (const f of g.formule) fIndex[f.id] = f;
  const lezIndex = Object.fromEntries(lezioni.lezioni.map((l) => [l.n, l]));
  const comune = laboratorio.checklistComune;

  const labCard = (x, i) => {
    const items = [...comune.map((t, k) => ({ id: `${x.id}:c${k + 1}`, t })), ...x.checklistSpecifica.map((t, k) => ({ id: `${x.id}:s${k + 1}`, t, spec: true }))];
    return `<article class="card lab" id="${x.id}" style="margin:14px 0">
      <h2 style="display:flex;justify-content:space-between;gap:8px;align-items:baseline;flex-wrap:wrap">
        <span>${i + 1}. ${esc(x.titolo)}</span>
        <span class="badge" data-lab-pct="${x.id}"></span>
      </h2>
      <div class="chips">${x.lezioni.map((n) => `<a class="chip" href="programma.html#lez-${n}" title="${esc(lezIndex[n] ? lezIndex[n].titolo : "")}">Lezione ${n}</a>`).join("")}</div>
      <div class="grid grid-2" style="margin-top:10px">
        <div>
          <h3>Obiettivo ${x.indicativo ? `<span class="badge">indicativo</span>` : ""}</h3>
          <p>${esc(x.obiettivo)}</p>
          <h3>Strumentazione tipica ${x.indicativo ? `<span class="badge">indicativa</span>` : ""}</h3>
          <ul>${x.strumentazione.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
          ${x.formule.length ? `<h3>Formule utili</h3>${x.formule.filter((id) => fIndex[id]).map((id) => `
            <div class="formula" style="margin:6px 0"><div class="fname"><a href="formulario.html#f-${id}">${esc(fIndex[id].nome)}</a></div><div class="fmath" translate="no">${tex(fIndex[id].tex, true)}</div></div>`).join("")}` : ""}
        </div>
        <div>
          <h3>Checklist della relazione</h3>
          <ul class="topic-list">${items.map((it) => `<li>${checkbox("lab", it.id, esc(it.t) + (it.spec ? ` <span class="badge">specifica</span>` : ""))}</li>`).join("")}</ul>
        </div>
      </div>
    </article>`;
  };

  app.innerHTML = `
    ${pageHead("Blocco 7 · 25 ore", "Laboratorio e relazioni", "Le cinque esperienze del programma ufficiale, con le lezioni in cui vengono spiegate o svolte e una checklist per scrivere la relazione.")}
    <div class="notice"><span class="ico">${icon("info")}</span><span><strong>All'orale porta le relazioni di laboratorio</strong>: possono esserci domande sulle esperienze. Obiettivi e strumentazione qui sotto sono indicativi: fanno fede le schede e le indicazioni dei docenti.</span></div>
    <div class="card" style="margin:12px 0">
      <h2>Teoria della misura</h2>
      <p>Errori sistematici e casuali, distribuzioni, media, varianza, Chebyshev, propagazione delle incertezze, confronto tra misure, minimi quadrati e media pesata
        (<a href="programma.html#lez-22">lezione 22</a>, <a href="programma.html#lez-23">lezione 23</a>). Riferimento: dispense del docente sulla teoria della misura.</p>
      <a class="btn" href="formulario.html#b7">Formule di teoria della misura</a>
    </div>
    <div id="labs">${laboratorio.esperienze.map(labCard).join("")}</div>`;

  function updateProgress() {
    for (const x of laboratorio.esperienze) {
      const ids = [...comune.map((_, k) => `${x.id}:c${k + 1}`), ...x.checklistSpecifica.map((_, k) => `${x.id}:s${k + 1}`)];
      const d = Store.count("lab", ids);
      const el = $(`[data-lab-pct="${x.id}"]`);
      el.textContent = d === ids.length ? "relazione completa ✓" : `${d}/${ids.length} voci`;
      el.className = "badge" + (d === ids.length ? " laboratorio" : "");
    }
  }
  updateProgress();
  bindChecks($("#labs"), updateProgress);
});
