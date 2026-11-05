/* Programma: una sola pagina con due viste
   - "Lezioni": le 60 lezioni in ordine cronologico, spuntabili (unico avanzamento del sito)
   - "Programma ufficiale": i 7 blocchi con ore, capitoli e argomenti ufficiali */
page(async () => {
  const { programma, lezioni } = await loadData("programma", "lezioni");
  const { sezioni } = indexProgramma(programma);
  const lez = lezioni.lezioni;
  const app = $("#app");

  const lezPerBlocco = {};
  for (const l of lez) for (const b of new Set(l.sezioni.map(blockOfSection))) (lezPerBlocco[b] = lezPerBlocco[b] || []).push(l);
  const totOre = programma.blocchi.reduce((a, b) => a + b.ore, 0);

  const lessonCard = (l) => {
    const firstBlock = l.sezioni.length ? blockOfSection(l.sezioni[0]) : null;
    return `<article class="lesson" id="lez-${l.n}" data-n="${l.n}" style="--bc:${blockColor(firstBlock)}">
      <div class="lnum" aria-hidden="true">${String(l.n).padStart(2, "0")}</div>
      <div>
        <div class="lhead">
          <span class="badge next-tag">Prossima</span>
          <span class="badge ${l.tipo}">${TIPI_LEZIONE[l.tipo] || esc(l.tipo)}</span>
          ${l.capitoli ? `<span class="badge">${esc(l.capitoli)}</span>` : ""}
        </div>
        ${checkbox("lesson", String(l.n), `<span class="visually-hidden">Lezione ${l.n}: </span>${esc(l.titolo)}`)}
        ${l.sezioni.length ? `<div class="chips" style="margin-top:8px">${l.sezioni.map((sid) => {
          const s = sezioni[sid];
          return s ? `<a class="chip bchip" style="--bc:${blockColor(blockOfSection(sid))}" href="#${sid}" data-goto="programma">${esc(s.titolo ? s.titolo : `${s.blocco.numero}. ${s.blocco.titolo}`)}</a>` : "";
        }).join("")}</div>` : ""}
      </div>
    </article>`;
  };

  const blockCard = (b) => `
    <details class="block" id="${b.id}" style="--bc:${blockColor(b.id)}">
      <summary>
        <span class="num">${b.numero}</span>
        <span>
          <span class="title">${esc(b.titolo)}</span><br>
          <span class="meta">${b.ore}&nbsp;ore${b.capitoli ? ` · ${esc(b.capitoli)}` : ""} · ${(lezPerBlocco[b.id] || []).length}&nbsp;lezioni</span>
        </span>
        <span class="side"><span data-bpct="${b.id}"></span>${icon("chev", "chev")}</span>
        <span data-bbar="${b.id}" style="grid-column:2 / -1"></span>
      </summary>
      <div class="block-body">
        ${b.sezioni.map((s) => `
          <div class="section" id="${s.id}">
            ${s.titolo ? `<h3>${esc(s.titolo)}</h3>` : ""}
            <ul class="bullet-list">${s.argomenti.map((a) => `<li id="${a.id}">${esc(a.testo)}</li>`).join("")}</ul>
            <details class="official"><summary>Testo ufficiale</summary><blockquote>${esc(s.testoUfficiale)}</blockquote></details>
          </div>`).join("")}
        ${(lezPerBlocco[b.id] || []).length ? `
          <div class="small muted" style="margin-top:10px">Lezioni del blocco</div>
          <div class="chips">${lezPerBlocco[b.id].map((l) => `<a class="chip" href="#lez-${l.n}" data-goto="lezioni" data-l="${l.n}" title="${esc(l.titolo)}">L${l.n}</a>`).join("")}</div>` : ""}
        <div class="chips" style="margin-top:10px">
          <a class="chip" href="teoria.html?b=${b.id}">${icon("book")} Teoria</a>
          <a class="chip" href="formulario.html#${b.id}">${icon("sigma")} Formule</a>
          <a class="chip" href="esercizi.html?blocco=${b.id}">${icon("pencil")} Esercizi</a>
        </div>
      </div>
    </details>`;

  app.innerHTML = `
    ${pageHead("Programma", "Lezioni e programma ufficiale", `Studia nell'ordine del corso e spunta le lezioni fatte, oppure consulta il programma ufficiale nei 7 blocchi (${totOre} ore, riferimento Mencuccini-Silvestrini).`)}
    <div class="card" style="margin-bottom:16px">
      <div class="progress-row" style="padding:0">
        <span class="label">Lezioni completate</span><span class="val" id="lez-count"></span>
        <span id="lez-bar" style="grid-column:1/-1"></span>
      </div>
    </div>
    <div class="segmented" role="tablist" aria-label="Vista">
      <button type="button" role="tab" id="tab-lezioni" data-value="lezioni" aria-controls="panel-lezioni" aria-selected="true">Lezioni</button>
      <button type="button" role="tab" id="tab-programma" data-value="programma" aria-controls="panel-programma" aria-selected="false">Programma ufficiale</button>
    </div>

    <section id="panel-lezioni" role="tabpanel" aria-labelledby="tab-lezioni">
      <div class="toolbar no-print">
        <input type="search" id="q" name="q" placeholder="Filtra per parola (es. Gauss, Thevenin, dipolo)…" aria-label="Filtra lezioni" autocomplete="off">
        <select id="f-blocco" name="blocco" aria-label="Filtra per blocco">
          <option value="">Tutti i blocchi</option>
          ${programma.blocchi.map((b) => `<option value="${b.id}">${b.numero}. ${esc(b.titolo)}</option>`).join("")}
        </select>
        <select id="f-tipo" name="tipo" aria-label="Filtra per tipo">
          <option value="">Tutti i tipi</option>
          ${Object.entries(TIPI_LEZIONE).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
        </select>
        <label><input type="checkbox" id="f-todo" name="todo"> Solo da studiare</label>
      </div>
      <p class="small muted" id="shown" role="status" aria-live="polite"></p>
      <div class="lessons" id="lessons">${lez.map(lessonCard).join("")}</div>
    </section>

    <section id="panel-programma" role="tabpanel" aria-labelledby="tab-programma" hidden>
      <div class="toolbar no-print">
        <button class="btn" id="open-all" type="button">Espandi tutto</button>
        <button class="btn" id="close-all" type="button">Comprimi tutto</button>
      </div>
      ${programma.blocchi.map(blockCard).join("")}
    </section>

    <div class="section-title" id="backup"><h2>Porta i progressi con te</h2></div>
    <div class="card no-print">
      <p class="small muted" style="margin-top:0">Le spunte restano solo in questo browser. Per passarle dal computer al telefono esporta il file e importalo sull'altro dispositivo.</p>
      <div class="toolbar" style="margin-bottom:0">
        <button class="btn" id="export-btn" type="button">Esporta progressi</button>
        <button class="btn" id="import-btn" type="button">Importa progressi</button>
        <input type="file" id="import-file" name="import-file" accept="application/json,.json" class="hidden" aria-label="File dei progressi da importare">
        <button class="btn danger" id="reset-btn" type="button">Azzera tutto</button>
      </div>
      <p class="status" id="backup-status" role="status" aria-live="polite"></p>
    </div>`;

  const cards = $all(".lesson");

  function updateProgress() {
    const done = lez.filter((l) => Store.get("lesson", String(l.n))).length;
    $("#lez-count").textContent = `${done}/${lez.length}`;
    $("#lez-bar").innerHTML = progressBar(pct(done, lez.length));
    const next = lez.find((l) => !Store.get("lesson", String(l.n)));
    cards.forEach((c) => {
      const n = c.dataset.n;
      c.classList.toggle("done", Store.get("lesson", n));
      c.classList.toggle("next", !!next && String(next.n) === n);
    });
    for (const b of programma.blocchi) {
      const bl = lezPerBlocco[b.id] || [];
      const d = bl.filter((l) => Store.get("lesson", String(l.n))).length;
      $(`[data-bpct="${b.id}"]`).textContent = bl.length ? `${d}/${bl.length}` : "";
      $(`[data-bbar="${b.id}"]`).innerHTML = bl.length ? progressBar(pct(d, bl.length), blockColor(b.id)) : "";
    }
  }

  function applyFilters() {
    const words = norm($("#q").value.trim()).split(/\s+/).filter(Boolean);
    const fb = $("#f-blocco").value, ft = $("#f-tipo").value, todo = $("#f-todo").checked;
    let shown = 0;
    lez.forEach((l, i) => {
      const hay = norm(`${l.n} ${l.titolo} ${l.capitoli || ""}`);
      const ok = words.every((w) => hay.includes(w))
        && (!fb || l.sezioni.some((s) => blockOfSection(s) === fb))
        && (!ft || l.tipo === ft)
        && (!todo || !Store.get("lesson", String(l.n)));
      cards[i].classList.toggle("hidden", !ok);
      if (ok) shown++;
    });
    $("#shown").textContent = shown === lez.length ? ""
      : shown ? `${shown} lezioni mostrate su ${lez.length}` : "Nessuna lezione corrisponde ai filtri: prova un'altra parola o scegli “Tutti i blocchi”.";
    setParams({ q: $("#q").value.trim(), blocco: fb, tipo: ft, todo });
  }

  // vista iniziale: dal parametro ?vista= o dall'ancora (#lez-… / #b…)
  const params = getParams();
  const h = location.hash.slice(1);
  const initial = /^b\d/.test(h) ? "programma" : /^lez-/.test(h) ? "lezioni" : (params.get("vista") === "programma" ? "programma" : "lezioni");
  const tabs = segmented($(".segmented"), (v) => setParams({ vista: v === "programma" ? "programma" : "" }));
  tabs.select(initial);

  // i link interni tra le due viste cambiano scheda prima di scorrere
  app.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-goto]");
    if (!a) return;
    e.preventDefault();
    tabs.select(a.dataset.goto, true);
    history.replaceState(null, "", a.getAttribute("href"));
    scrollToHash();
  });

  $("#q").value = params.get("q") || "";
  $("#f-blocco").value = params.get("blocco") || "";
  $("#f-tipo").value = params.get("tipo") || "";
  $("#f-todo").checked = params.get("todo") === "1";
  updateProgress();
  if (params.get("q") || params.get("blocco") || params.get("tipo") || params.get("todo")) applyFilters();
  bindChecks($("#lessons"), () => { updateProgress(); if ($("#f-todo").checked) applyFilters(); });
  ["#q", "#f-blocco", "#f-tipo", "#f-todo"].forEach((s) => $(s).addEventListener("input", applyFilters));
  const status = (msg, kind) => { const el = $("#backup-status"); el.textContent = msg; el.className = `status ${kind || ""}`; };
  const refreshChecks = () => $all('input[type="checkbox"][data-cat]', app).forEach((cb) => {
    cb.checked = Store.get(cb.dataset.cat, cb.dataset.id);
    cb.closest(".check")?.classList.toggle("done", cb.checked);
  });
  $("#export-btn").onclick = () => {
    const blob = new Blob([Store.exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fisica2-progressi-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    status(`File scaricato: ${a.download}. Importalo sull'altro dispositivo da questa sezione.`, "ok");
  };
  $("#import-btn").onclick = () => $("#import-file").click();
  $("#import-file").onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { Store.importJSON(await f.text()); refreshChecks(); updateProgress(); status(`Progressi importati: ${Store.total()} voci.`, "ok"); }
    catch (err) { status(`Importazione non riuscita. ${err.message}`, "error"); }
  };
  $("#reset-btn").onclick = () => {
    if (!confirm("Vuoi davvero azzerare tutti i progressi salvati in questo browser?")) return;
    Store.reset(); refreshChecks(); updateProgress(); status("Progressi azzerati.", "ok");
  };
  $("#open-all").onclick = () => $all("details.block").forEach((d) => (d.open = true));
  $("#close-all").onclick = () => $all("details.block").forEach((d) => (d.open = false));
});
