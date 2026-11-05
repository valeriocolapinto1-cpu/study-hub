/* Quiz a correzione automatica: domande di teoria (a scelta multipla) e pratiche
   (a scelta multipla o con risultato numerico), dalla banca data/quiz.json. */
function createQuiz(root, { programma, quiz }) {
  const { blocchi } = indexProgramma(programma);
  const HIST_KEY = "fg2-quiz";
  const all = quiz.domande;
  const blocks = programma.blocchi.filter((b) => all.some((q) => q.blocco === b.id));
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const history = () => { try { return JSON.parse(safeGet(HIST_KEY)) || []; } catch (e) { return []; } };
  const parseNum = (s) => Number(String(s).trim().replace(/\s/g, "").replace(",", "."));
  let current = null; // { domande: [...], ordini: {id: [indici opzioni]} }

  function setup() {
    const h = history();
    root.innerHTML = `
      <form class="card quiz-setup" id="quiz-setup">
        <h2 style="margin-top:0">Quiz con correzione automatica</h2>
        <p class="small muted">Domande di teoria e problemi pratici con risultato numerico o a scelta multipla. Alla fine il sito corregge, ti dà un voto in trentesimi e spiega ogni risposta.</p>
        <fieldset class="q-field">
          <legend>Argomenti</legend>
          <div class="chips">${blocks.map((b) => `<label class="chip bchip pick" style="--bc:${blockColor(b.id)}"><input type="checkbox" name="blocco" value="${b.id}" checked> ${b.numero}. ${esc(b.titolo)}</label>`).join("")}</div>
        </fieldset>
        <div class="quiz-opts">
          <fieldset class="q-field">
            <legend>Tipo di domande</legend>
            <label><input type="radio" name="tipo" value="" checked> Teoria e pratica</label>
            <label><input type="radio" name="tipo" value="teoria"> Solo teoria</label>
            <label><input type="radio" name="tipo" value="pratica"> Solo esercizi</label>
          </fieldset>
          <fieldset class="q-field">
            <legend>Numero di domande</legend>
            <select name="n" aria-label="Numero di domande"><option value="10" selected>10</option><option value="15">15</option><option value="20">20</option><option value="30">30</option></select>
          </fieldset>
        </div>
        <p class="field-error" id="setup-err" role="alert" hidden></p>
        <button class="btn primary lg" type="submit">Inizia il quiz</button>
      </form>
      ${h.length ? `<div class="card" style="margin-top:14px"><h3 style="margin-top:0">I tuoi ultimi quiz</h3>
        <ul class="th-list">${h.slice(0, 5).map((r) => `<li><strong>${NUM.format(r.voto)}/30</strong> · ${r.ok}/${r.n} corrette <span class="small muted">· ${new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(r.t))}</span></li>`).join("")}</ul></div>` : ""}`;
    $("#quiz-setup", root).onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const bs = fd.getAll("blocco"), tipo = fd.get("tipo"), n = Number(fd.get("n"));
      const pool = all.filter((q) => bs.includes(q.blocco) && (!tipo || q.tipo === tipo));
      if (!pool.length) {
        const err = $("#setup-err", root);
        err.hidden = false;
        err.textContent = "Nessuna domanda con questi filtri: scegli almeno un argomento o cambia il tipo di domande.";
        return;
      }
      start(shuffle(pool).slice(0, n));
    };
  }

  function start(domande) {
    const ordini = {};
    domande.forEach((q) => { if (q.formato === "scelta") ordini[q.id] = shuffle(q.opzioni.map((_, i) => i)); });
    current = { domande, ordini };
    root.innerHTML = `
      <form id="quiz-form" novalidate>
        <div class="sim-bar" style="margin-top:0">
          <p class="small muted" style="margin:0" id="quiz-progress" role="status" aria-live="polite"></p>
          <button class="btn" type="button" id="quiz-cancel">Annulla</button>
        </div>
        <ol class="q-list quiz-list">
          ${domande.map((q, i) => `
            <li class="card q-card quiz-q" data-id="${q.id}" style="--bc:${blockColor(q.blocco)}">
              <div class="q-num" aria-hidden="true">${i + 1}</div>
              <div style="min-width:0">
              <div class="q-head">
                <span class="chip bchip" style="--bc:${blockColor(q.blocco)};margin:0">${esc(blocchi[q.blocco].titolo)}</span>
                <span class="badge ${q.tipo === "teoria" ? "teoria" : "esercitazione"}">${q.tipo === "teoria" ? "Teoria" : "Esercizio"}</span>
              </div>
              <fieldset class="q-field">
                <legend class="q-title">${q.domanda}</legend>
                ${q.formato === "scelta"
                  ? `<div class="opts">${ordini[q.id].map((oi) => `<label class="opt"><input type="radio" name="${q.id}" value="${oi}"><span>${q.opzioni[oi]}</span></label>`).join("")}</div>`
                  : `<label class="q-score">Risultato <input type="text" name="${q.id}" inputmode="decimal" autocomplete="off" placeholder="es. 12,5…" aria-label="Risultato della domanda ${i + 1}"> ${esc(q.unita)}</label>`}
              </fieldset>
              <div class="q-feedback" hidden></div>
              </div>
            </li>`).join("")}
        </ol>
        <div class="card total-card">
          <div><div class="small muted">Quando hai finito</div><div id="unanswered" class="small muted"></div></div>
          <button class="btn primary lg" type="submit">Correggi il quiz</button>
        </div>
      </form>`;
    renderMathIn(root);
    reveal(root, ".quiz-q");
    const form = $("#quiz-form", root);
    const progress = () => {
      const done = domande.filter((q) => {
        const v = form.elements[q.id];
        return q.formato === "scelta" ? !!form.querySelector(`input[name="${q.id}"]:checked`) : v.value.trim() !== "";
      }).length;
      $("#quiz-progress", root).textContent = `Risposte date: ${done} su ${domande.length}`;
      $("#unanswered", root).textContent = done < domande.length ? `${domande.length - done} senza risposta: verranno contate come errate.` : "Hai risposto a tutte le domande.";
    };
    form.addEventListener("input", progress);
    progress();
    $("#quiz-cancel", root).onclick = () => { if (confirm("Vuoi abbandonare il quiz? Le risposte andranno perse.")) setup(); };
    form.onsubmit = (e) => { e.preventDefault(); correct(form); };
    root.scrollIntoView({ block: "start" });
  }

  function correct(form) {
    const { domande } = current;
    let ok = 0;
    const perBlock = {};
    const wrong = [];
    domande.forEach((q) => {
      const li = form.querySelector(`[data-id="${q.id}"]`);
      let given = null, right = false;
      if (q.formato === "scelta") {
        const sel = form.querySelector(`input[name="${q.id}"]:checked`);
        given = sel ? Number(sel.value) : null;
        right = given === q.corretta;
        $all(".opt", li).forEach((lab) => {
          const v = Number($("input", lab).value);
          lab.classList.toggle("is-right", v === q.corretta);
          lab.classList.toggle("is-wrong", v === given && !right);
        });
      } else {
        const raw = form.elements[q.id].value;
        given = raw.trim() === "" ? null : parseNum(raw);
        right = given !== null && Number.isFinite(given) && Math.abs(given - q.risposta) <= Math.abs(q.risposta) * q.tolleranza + 1e-12;
      }
      if (right) ok++; else wrong.push(q);
      const pb = (perBlock[q.blocco] = perBlock[q.blocco] || { ok: 0, n: 0 });
      pb.n++; if (right) pb.ok++;
      li.classList.add(right ? "q-ok" : "q-ko");
      const fb = $(".q-feedback", li);
      fb.hidden = false;
      fb.innerHTML = `<p style="margin:0 0 6px"><span class="badge ${right ? "ok" : "soft"}">${right ? "Corretta" : given === null ? "Senza risposta" : "Sbagliata"}</span>
        ${q.formato === "numero" ? ` Risultato atteso: <strong>${NUM.format(q.risposta)} ${esc(q.unita)}</strong> <span class="small muted">(tolleranza ±${Math.round(q.tolleranza * 100)}%)</span>` : ""}</p>
        <p style="margin:0">${q.spiegazione}</p>
        <a class="small" href="teoria.html?b=${q.blocco}">Rivedi la teoria del blocco ${blocchi[q.blocco].numero} →</a>`;
    });
    $all("input", form).forEach((i) => (i.disabled = true));
    renderMathIn(form);
    const n = domande.length, voto = Math.round((ok / n) * 300) / 10;
    const h = history(); h.unshift({ t: Date.now(), ok, n, voto }); safeSet(HIST_KEY, JSON.stringify(h.slice(0, 20)));
    const summary = document.createElement("div");
    summary.className = "card quiz-summary";
    summary.setAttribute("role", "status");
    summary.innerHTML = `
      <div class="quiz-score">
        <div><div class="small muted">Risultato</div><div class="stat">${ok}<span class="muted" style="font-size:1.1rem">/${n}</span></div></div>
        <div><div class="small muted">Voto</div><div class="stat">${NUM.format(voto)}<span class="muted" style="font-size:1.1rem">/30</span></div></div>
        <div>${voto >= 18 ? `<span class="badge ok">Sufficiente</span>` : `<span class="badge soft">Da ripassare</span>`}</div>
      </div>
      ${Object.entries(perBlock).map(([b, r]) => `<div class="progress-row"><span class="label"><span class="dot" style="--bc:${blockColor(b)}"></span>${esc(blocchi[b].titolo)}</span><span class="val">${r.ok}/${r.n}</span>${progressBar(pct(r.ok, r.n), blockColor(b))}</div>`).join("")}
      <div class="toolbar" style="margin-bottom:0">
        <button class="btn primary" type="button" id="quiz-new">Nuovo quiz</button>
        ${wrong.length ? `<button class="btn" type="button" id="quiz-retry">Ripeti le ${wrong.length} sbagliate</button>` : ""}
      </div>`;
    form.prepend(summary);
    form.querySelector(".total-card").remove();
    $("#quiz-progress", root).textContent = "Quiz corretto: sotto trovi la spiegazione di ogni domanda.";
    $("#quiz-cancel", root).remove();
    $("#quiz-new", root).onclick = setup;
    const rt = $("#quiz-retry", root);
    if (rt) rt.onclick = () => start(wrong);
    summary.scrollIntoView({ block: "start" });
  }

  setup();
  return { reset: setup };
}
