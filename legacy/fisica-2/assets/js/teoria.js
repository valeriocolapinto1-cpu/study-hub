/* Teoria: spiegazioni per ogni blocco del programma (file HTML in data/teoria/) */
page(async () => {
  const { programma } = await loadData("programma");
  const app = $("#app");
  const ids = programma.blocchi.map((b) => b.id);
  const fromHash = location.hash.slice(1, 3);
  let cur = ids.includes(getParams().get("b")) ? getParams().get("b") : ids.includes(fromHash) ? fromHash : "b1";
  const cache = {};
  const fetchBlock = (id) => (cache[id] = cache[id] || fetch(`data/teoria/${id}.html`).then((r) => {
    if (!r.ok) throw new Error(`Capitolo non disponibile (HTTP ${r.status}).`);
    return r.text();
  }));

  app.innerHTML = `
    ${pageHead("Teoria", "Spiegazioni per capitolo", "Tutta la teoria del programma, capitolo per capitolo: definizioni, dimostrazioni da saper fare all'esame, risultati da ricordare e consigli per scritto e orale.")}
    <nav class="toc no-print" aria-label="Capitoli" id="chapters">
      ${programma.blocchi.map((b) => `<a class="chip bchip" style="--bc:${blockColor(b.id)}" href="?b=${b.id}" data-b="${b.id}">${b.numero}. ${esc(b.titolo)}</a>`).join("")}
    </nav>
    <div class="t-layout">
      <aside class="t-side no-print" id="t-side" aria-label="In questo capitolo"></aside>
      <article class="t-body card" id="t-body" aria-live="polite"></article>
    </div>
    <nav class="t-pager no-print" id="t-pager" aria-label="Capitolo precedente e successivo"></nav>`;

  async function show(id, scroll) {
    cur = id;
    $all("#chapters a").forEach((a) => a.setAttribute("aria-current", a.dataset.b === id ? "page" : "false"));
    const body = $("#t-body");
    body.innerHTML = `<div class="loading" role="status"><div class="skeleton" style="width:50%;height:1.6rem"></div><div class="skeleton"></div><div class="skeleton" style="width:80%"></div><span class="visually-hidden">Caricamento…</span></div>`;
    try {
      body.innerHTML = await fetchBlock(id);
    } catch (err) {
      body.innerHTML = `<div class="notice" role="alert">${esc(err.message)} <button class="btn" type="button" onclick="location.reload()">Riprova</button></div>`;
      return;
    }
    renderMathIn(body);
    const b = programma.blocchi.find((x) => x.id === id);
    const heads = $all("h2, h3", body);
    $("#t-side").innerHTML = `<div class="small muted" style="margin-bottom:6px">${b.ore} ore${b.capitoli ? ` · ${esc(b.capitoli)}` : ""}</div>
      <ul>${heads.map((h) => `<li class="${h.tagName === "H2" ? "lvl2" : "lvl3"}"><a href="#${h.id || h.closest("section").id}">${esc(h.textContent.replace(/^\d\w?\s·\s/, ""))}</a></li>`).join("")}</ul>
      <div class="chips" style="margin-top:12px">
        <a class="chip" href="formulario.html#${id}">${icon("sigma")} Formule</a>
        <a class="chip" href="programma.html?vista=programma#${id}">${icon("book")} Programma</a>
      </div>`;
    const i = ids.indexOf(id);
    const prev = programma.blocchi[i - 1], next = programma.blocchi[i + 1];
    $("#t-pager").innerHTML = `${prev ? `<a class="btn" href="?b=${prev.id}" data-b="${prev.id}">← ${prev.numero}. ${esc(prev.titolo)}</a>` : "<span></span>"}
      ${next ? `<a class="btn primary" href="?b=${next.id}" data-b="${next.id}">${next.numero}. ${esc(next.titolo)} →</a>` : `<a class="btn primary" href="esame.html">Mettiti alla prova →</a>`}`;
    if (scroll === "top") window.scrollTo({ top: 0 });
    else scrollToHash();
  }

  app.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-b]");
    if (!a) return;
    e.preventDefault();
    const url = new URL(location); url.searchParams.set("b", a.dataset.b); url.hash = "";
    history.pushState(null, "", url);
    show(a.dataset.b, "top");
  });
  window.addEventListener("popstate", () => show(ids.includes(getParams().get("b")) ? getParams().get("b") : "b1"));
  await show(cur);
});
