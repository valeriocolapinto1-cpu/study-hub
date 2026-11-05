/* Ricerca testuale su programma, lezioni, formule, esercizi, laboratorio */
page(async () => {
  const d = await loadData("programma", "lezioni", "formule", "appelli", "laboratorio");
  const { blocchi, sezioni } = indexProgramma(d.programma);
  const app = $("#app");

  // indice: { tipo, titolo, meta, url, testo }
  const idx = [];
  for (const b of d.programma.blocchi) {
    idx.push({ tipo: "Programma", titolo: `Blocco ${b.numero} — ${b.titolo}`, meta: `${b.ore} ore${b.capitoli ? " · " + b.capitoli : ""}`, url: `programma.html?vista=programma#${b.id}` });
    for (const s of b.sezioni) {
      if (s.titolo) idx.push({ tipo: "Programma", titolo: s.titolo, meta: `Blocco ${b.numero}`, url: `programma.html?vista=programma#${s.id}` });
      for (const a of s.argomenti) idx.push({ tipo: "Programma", titolo: a.testo, meta: `Blocco ${b.numero} — ${b.titolo}${s.titolo ? " · " + s.titolo : ""}`, url: `programma.html?vista=programma#${a.id}` });
    }
  }
  for (const l of d.lezioni.lezioni) {
    const bl = [...new Set(l.sezioni.map(blockOfSection))].map((id) => `Blocco ${blocchi[id].numero}`).join(", ");
    idx.push({ tipo: "Lezioni", titolo: `Lezione ${l.n}`, meta: [TIPI_LEZIONE[l.tipo], l.capitoli, bl].filter(Boolean).join(" · "), testo: l.titolo, url: `programma.html#lez-${l.n}` });
  }
  for (const fb of d.formule.blocchi) {
    const b = blocchi[fb.blocco];
    for (const g of fb.gruppi) for (const f of g.formule) {
      idx.push({ tipo: "Formule", titolo: f.nome, meta: `Blocco ${b.numero} · ${g.titolo}`, testo: f.note, extra: f.tex, url: `formulario.html#f-${f.id}` });
    }
  }
  for (const ap of d.appelli.appelli) {
    for (const e of ap.esercizi) {
      idx.push({ tipo: "Esercizi", titolo: `${ap.titolo} · esercizio ${e.n}`, meta: blocchi[e.blocco].titolo, url: `esercizi.html#es-${ap.id}-${e.n}` });
    }
    for (const q of ap.teoria) {
      idx.push({ tipo: "Esercizi", titolo: `Domanda di teoria · ${ap.titolo}`, meta: blocchi[q.blocco].titolo, url: `esercizi.html?vista=teoria` });
    }
  }
  for (const x of d.laboratorio.esperienze) {
    idx.push({ tipo: "Laboratorio", titolo: x.titolo, meta: `Lezioni ${x.lezioni.join(", ")}`, testo: x.obiettivo, extra: x.strumentazione.join(" "), url: `laboratorio.html#${x.id}` });
  }
  // titoli dei paragrafi della teoria
  const parser = new DOMParser();
  await Promise.all(d.programma.blocchi.map(async (b) => {
    try {
      const html = await (await fetch(`data/teoria/${b.id}.html`)).text();
      const doc = parser.parseFromString(html, "text/html");
      doc.querySelectorAll("h3[id]").forEach((h) => {
        let body = "", el = h.nextElementSibling;
        while (el && el.tagName !== "H3") { body += " " + el.textContent; el = el.nextElementSibling; }
        body = body.replace(/\$[^$]*\$/g, " ").replace(/\s+/g, " ").trim();
        idx.push({ tipo: "Teoria", titolo: h.textContent, meta: `Blocco ${b.numero} — ${b.titolo}`, testo: body.slice(0, 170) + "…", extra: body, url: `teoria.html?b=${b.id}#${h.id}` });
      });
    } catch (e) { /* capitolo non disponibile */ }
  }));
  idx.forEach((r) => (r._n = norm([r.titolo, r.meta, r.testo, r.extra].filter(Boolean).join(" "))));

  const ORDER = ["Teoria", "Programma", "Lezioni", "Formule", "Esercizi", "Laboratorio"];

  app.innerHTML = `
    ${pageHead("Cerca", "Trova un argomento", "Cerca tra lezioni, programma, formule, esercizi d'esame e laboratorio.")}
    <div class="toolbar">
      <input type="search" id="q" name="q" placeholder="Es. Gauss, dipolo, Thevenin, Poynting, isteresi…" aria-label="Cerca nel sito" autocomplete="off" enterkeyhint="search">
    </div>
    <div id="results" aria-live="polite"></div>`;

  // evidenzia le parole cercate ignorando maiuscole e accenti
  const hl = (text, words) => {
    const src = String(text);
    const n = norm(src);
    if (n.length !== src.length) return esc(src); // caso raro: normalizzazione cambia la lunghezza
    const marks = new Array(src.length).fill(false);
    for (const w of words) {
      let pos = n.indexOf(w);
      while (pos !== -1) {
        for (let k = pos; k < pos + w.length; k++) marks[k] = true;
        pos = n.indexOf(w, pos + w.length);
      }
    }
    let out = "", open = false;
    for (let i = 0; i < src.length; i++) {
      if (marks[i] && !open) { out += "<mark>"; open = true; }
      if (!marks[i] && open) { out += "</mark>"; open = false; }
      out += esc(src[i]);
    }
    return out + (open ? "</mark>" : "");
  };

  function run() {
    const q = $("#q").value.trim();
    const words = norm(q).split(/\s+/).filter(Boolean);
    const url = new URL(location);
    if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
    history.replaceState(null, "", url);
    const box = $("#results");
    if (!words.length) { box.innerHTML = `<p class="muted">Scrivi almeno una parola.</p>`; return; }
    const hits = idx.filter((r) => words.every((w) => r._n.includes(w)));
    if (!hits.length) { box.innerHTML = `<p class="muted">Nessun risultato per “${esc(q)}”. Prova con meno parole o con un termine più generale (es. “campo”, “condensatore”, “onde”).</p>`; return; }
    box.innerHTML = `<p class="small muted">${hits.length} risultati</p>` + ORDER.map((t) => {
      const g = hits.filter((r) => r.tipo === t);
      if (!g.length) return "";
      return `<section class="results-group"><h2>${t} <span class="badge">${g.length}</span></h2>
        ${g.map((r) => `<a class="result" href="${r.url}">
          <div><strong>${hl(r.titolo, words)}</strong></div>
          ${r.testo ? `<div class="small">${hl(r.testo, words)}</div>` : ""}
          <div class="rmeta">${esc(r.meta)}</div>
        </a>`).join("")}</section>`;
    }).join("");
  }

  const q0 = new URLSearchParams(location.search).get("q") || "";
  $("#q").value = q0;
  const hq = $(".header-search input");
  if (hq) hq.value = q0;
  $("#q").addEventListener("input", run);
  run();
  // focus automatico solo su desktop (su mobile aprirebbe la tastiera)
  if (window.matchMedia("(pointer: fine)").matches) $("#q").focus();
});
