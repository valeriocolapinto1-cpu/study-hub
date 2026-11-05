/* Formulario: formule per blocco renderizzate con KaTeX */
page(async () => {
  const { programma, formule } = await loadData("programma", "formule");
  const { blocchi } = indexProgramma(programma);
  const app = $("#app");

  const wide = (f) => f.tex.length > 140; // formule lunghe occupano tutta la riga

  app.innerHTML = `
    ${pageHead("Formulario", "Le formule che servono", "Le formule chiave di ogni blocco in unità SI, dalla legge di Coulomb alle equazioni di Maxwell. All'esame non si può portare nulla: usale per ripassare e confrontale sempre con il Mencuccini-Silvestrini.")}
    <div class="toolbar no-print">
      <input type="search" id="q" name="q" placeholder="Filtra formule (es. Poynting, capacità, Snell)…" aria-label="Filtra formule" autocomplete="off">
      <button class="btn" type="button" id="print-btn">Stampa formulario</button>
    </div>
    <nav class="toc no-print" aria-label="Blocchi">
      ${formule.blocchi.map((fb) => { const b = blocchi[fb.blocco]; return `<a class="chip bchip" style="--bc:${blockColor(b.id)}" href="#${b.id}">${b.numero}. ${esc(b.titolo)}</a>`; }).join("")}
    </nav>
    <div id="formule">
      ${formule.blocchi.map((fb) => {
        const b = blocchi[fb.blocco];
        return `<section class="fblock" id="${b.id}" style="--bc:${blockColor(b.id)}">
          <h2><span class="dot" style="--bc:${blockColor(b.id)}"></span>${b.numero}. ${esc(b.titolo)} ${b.capitoli ? `<span class="badge">${esc(b.capitoli)}</span>` : ""}</h2>
          ${fb.gruppi.map((g) => `
            <div class="fgroup">
              <h3>${esc(g.titolo)}</h3>
              <div class="formulas">
                ${g.formule.map((f) => `
                  <div class="formula${wide(f) ? " wide" : ""}" id="f-${esc(f.id)}" data-search="${esc(norm(`${f.nome} ${f.note || ""} ${g.titolo} ${f.tex}`))}">
                    <div class="fname">${esc(f.nome)}</div>
                    <div class="fmath" translate="no">${tex(f.tex, true)}</div>
                    ${f.note ? `<div class="fnote">${esc(f.note)}</div>` : ""}
                  </div>`).join("")}
              </div>
            </div>`).join("")}
        </section>`;
      }).join("")}
    </div>
    <p class="small muted" id="none" role="status" hidden>Nessuna formula corrisponde al filtro: prova un sinonimo (es. “campo” invece di “intensità”) o svuota la ricerca.</p>`;

  // matematica inline ($...$) nelle note
  $all(".fnote").forEach(renderMathIn);

  $("#print-btn").addEventListener("click", () => window.print());
  const applyFilter = () => {
    const q = norm($("#q").value.trim());
    const words = q ? q.split(/\s+/) : [];
    let any = false;
    $all(".formula").forEach((el) => {
      const ok = words.every((w) => el.dataset.search.includes(w));
      el.classList.toggle("hidden", !ok);
      any = any || ok;
    });
    $all(".fgroup").forEach((g) => g.classList.toggle("hidden", !$all(".formula:not(.hidden)", g).length));
    $all(".fblock").forEach((s) => s.classList.toggle("hidden", !$all(".formula:not(.hidden)", s).length));
    $("#none").hidden = any;
    setParams({ q: $("#q").value.trim() });
  };
  $("#q").value = getParams().get("q") || "";
  if ($("#q").value) applyFilter();
  $("#q").addEventListener("input", applyFilter);
});
