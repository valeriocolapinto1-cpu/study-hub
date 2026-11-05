/* Simulazione di prove d'esame (usato nella pagina Esame).
   Le prove sono GENERATE da assets/js/generatore.js: esercizi con numeri casuali e soluzione calcolata, ricalcati sulla
   tipologia degli appelli passati (stesso numero di esercizi per blocco, stesse grandezze richieste), e domande di teoria
   nello stile dei quesiti d'esame. Nessun testo d'esame di terzi è riprodotto.
   - Scritto misto: 4 esercizi di blocchi diversi + 2 domande di teoria
   - Appello tipo: stessa struttura (blocchi) di un appello passato scelto a caso
   - Orale: 3 domande di teoria di argomenti diversi (una può essere sul laboratorio)
   Il codice prova nell'URL rende la prova riproducibile e condivisibile. */
function createProve(root, { programma, appelli, esame, laboratorio }, initial) {
  const { blocchi } = indexProgramma(programma);
  const app = root;
  const S = esame.scritto, O = esame.orale;
  const DURATA = 150 * 60; // 2 ore e 30 minuti
  const PT_EX = S.composizione[0].puntiCadauno, PT_TH = S.composizione[1].puntiCadauno, PT_OR = O.composizione[0].puntiCadauno;

  /* ---------- generazione (assets/js/generatore.js) ---------- */
  const newSeed = () => Math.floor(Math.random() * 900000) + 100000;
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  function genOrale(seed, conLab) {
    const p = Generatore.generaProva(seed, appelli, "orale");
    const qs = p.teoria.slice(0, conLab ? 2 : 3);
    if (conLab) qs.push({ lab: pick(Generatore.rng(seed * 7 + 3), laboratorio.esperienze), blocco: "b7" });
    return qs;
  }

  /* ---------- stato ---------- */
  const params = getParams();
  let seed = Number(params.get("prova")) || newSeed();
  let tipo = initial;
  let conLab = params.get("lab") !== "0";

  root.innerHTML = `
    <div class="sim-bar no-print" style="margin-top:0">
      <p class="small muted" id="seed-info" role="status" aria-live="polite" style="margin:0"></p>
      <div class="sim-actions">
        <button class="btn primary" type="button" id="gen-btn">Nuova prova</button>
        <button class="btn" type="button" id="copy-btn">${icon("link")} Copia link</button>
      </div>
    </div>
    <div id="panel-prova"></div>`;

  /* ---------- timer ---------- */
  let remaining = DURATA, timerId = null;
  const fmtTime = (t) => [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map((x, i) => (i ? String(x).padStart(2, "0") : x)).join(":");
  function renderTimer() {
    const el = $("#timer");
    if (!el) return;
    el.textContent = fmtTime(remaining);
    el.classList.toggle("low", remaining <= 10 * 60 && remaining > 0);
    $("#timer-bar").innerHTML = progressBar(pct(DURATA - remaining, DURATA));
    const b = $("#timer-btn");
    b.textContent = timerId ? "Pausa" : remaining === DURATA ? "Avvia" : remaining === 0 ? "Tempo scaduto" : "Riprendi";
    b.disabled = remaining === 0;
  }
  function toggleTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; renderTimer(); return; }
    timerId = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      if (remaining === 0) { clearInterval(timerId); timerId = null; $("#timer-msg").textContent = "Tempo scaduto: apri le soluzioni e correggi."; }
      renderTimer();
    }, 1000);
    renderTimer();
  }
  function resetTimer() { clearInterval(timerId); timerId = null; remaining = DURATA; const m = $("#timer-msg"); if (m) m.textContent = ""; renderTimer(); }
  window.addEventListener("beforeunload", (e) => { if (timerId) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- rendering ---------- */
  const scoreInput = (name, max, label) =>
    `<label class="q-score">Voto <input type="number" name="${name}" min="0" max="${max}" step="0.5" inputmode="decimal" autocomplete="off" placeholder="0–${max}…" aria-label="${label}"> / ${max}</label>`;
  const chip = (b) => `<span class="chip bchip" style="--bc:${blockColor(b)};margin:0">${esc(blocchi[b].titolo)}</span>`;
  const soluzioneHtml = (e) => `<details class="official sol"><summary>Mostra la soluzione</summary>
      <ol class="sol-steps">${e.passi.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      <p class="sol-res"><strong>Risultati.</strong> ${e.risultati.map((x) => `$${esc(x)}$`).join(" &nbsp;·&nbsp; ")}</p></details>`;
  const exCard = (e, i) => `
    <article class="card q-card" style="--bc:${blockColor(e.blocco)}">
      <div class="q-num" aria-hidden="true">${i + 1}</div>
      <div style="min-width:0">
        <div class="q-head">${chip(e.blocco)}<span class="small muted">${esc(e.tema)}</span></div>
        <p class="q-title">${esc(e.testo)}</p>
        ${soluzioneHtml(e)}
        ${scoreInput(`ex${i}`, PT_EX, `Voto esercizio ${i + 1}`)}
      </div>
    </article>`;
  const thCard = (q, i, max, pre) => `
    <article class="card q-card" style="--bc:${blockColor(q.blocco)}">
      <div class="q-num" aria-hidden="true">${pre}${i + 1}</div>
      <div>
        ${q.lab
          ? `<div class="q-head">${chip("b7")}</div><p class="q-title">Esperienza di laboratorio: «${esc(q.lab.titolo)}». Descrivi scopo, apparato, misure e analisi dei dati.</p>`
          : `<div class="q-head">${chip(q.blocco)}</div><p class="q-title">${esc(q.testo)}</p>
             <details class="official sol"><summary>Traccia di risposta</summary><ul>${q.traccia.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></details>`}
        ${scoreInput(`${pre || "or"}${i}`, max, `Voto domanda ${pre}${i + 1}`)}
      </div>
    </article>`;
  const totalCard = (label) => `
    <div class="card total-card" aria-live="polite">
      <div><div class="small muted">${label}</div><div class="stat" id="tot">—</div></div>
      <div id="esito" class="small muted">Dopo la correzione inserisci i voti.</div>
    </div>
    <p class="field-error" id="err" role="alert" hidden></p>`;

  function render() {
    const panel = $("#panel-prova");
    if (tipo === "orale") {
      const qs = genOrale(seed, conLab);
      panel.innerHTML = `
        <label class="toolbar no-print" style="margin-top:0"><input type="checkbox" id="lab-toggle" ${conLab ? "checked" : ""}> Includi una domanda sul laboratorio</label>
        <div class="q-list">${qs.map((q, i) => thCard(q, i, PT_OR, "")).join("")}</div>
        ${totalCard("Totale orale")}`;
      $("#lab-toggle").onchange = (e) => { conLab = e.target.checked; setParams({ lab: conLab ? "" : "0" }); render(); };
    } else {
      const p = Generatore.generaProva(seed, appelli, tipo === "vero" ? "appello" : "misto");
      p.th = p.teoria; p.ex = p.esercizi;
      panel.innerHTML = `
        ${p.modello ? `<p class="small muted" style="margin-top:0">Struttura ricalcata sull'appello del <strong>${esc(p.modello.titolo)}</strong> (stessi argomenti per esercizio e teoria; testi e numeri sono nuovi).</p>` : ""}
        <div class="card timer-card no-print">
          <div><div class="small muted">Tempo</div><div class="timer" id="timer" role="timer" aria-live="off">${fmtTime(remaining)}</div></div>
          <div class="sim-actions"><button class="btn blue" type="button" id="timer-btn">Avvia</button><button class="btn" type="button" id="timer-reset">Azzera</button></div>
          <div class="timer-track" id="timer-bar"></div>
          <p class="small muted" id="timer-msg" role="status" aria-live="polite" style="margin:0"></p>
        </div>
        <h2>Esercizi <span class="badge">${p.ex.length} × ${PT_EX} punti</span></h2>
        <div class="q-list">${p.ex.map(exCard).join("")}</div>
        ${p.th.length ? `<h2>Teoria <span class="badge">${p.th.length} × ${PT_TH} punti</span></h2>
        <div class="q-list">${p.th.map((q, i) => thCard(q, i, PT_TH, "T")).join("")}</div>` : ""}
        ${totalCard("Totale scritto")}`;
      $("#timer-btn").onclick = toggleTimer;
      $("#timer-reset").onclick = resetTimer;
      renderTimer();
    }
    reveal(panel);
    renderMathIn(panel);
    updateTotal();
    $("#seed-info").textContent = `Codice prova ${seed}: con “Copia link” la ritrovi o la condividi.`;
    setParams({ prova: seed, tipo });
  }

  function updateTotal() {
    const errors = [];
    const vals = $all('.q-score input', $("#panel-prova")).map((el) => {
      el.removeAttribute("aria-invalid");
      if (el.value === "" && !el.validity.badInput) return null;
      const v = Number(el.value);
      if (el.validity.badInput || Number.isNaN(v) || v < 0 || v > Number(el.max)) {
        el.setAttribute("aria-invalid", "true");
        errors.push(`${el.getAttribute("aria-label")}: inserisci un numero tra 0 e ${el.max}.`);
        return null;
      }
      return v;
    });
    const err = $("#err");
    err.hidden = !errors.length; err.textContent = errors.join(" ");
    if (vals.every((v) => v === null)) { $("#tot").textContent = "—"; $("#esito").textContent = "Dopo la correzione inserisci i voti."; return; }
    const tot = vals.reduce((a, v) => a + (v || 0), 0);
    $("#tot").textContent = `${NUM.format(tot)}/30`;
    $("#esito").innerHTML = tipo === "orale" ? "Voto finale = media tra scritto e orale."
      : tot >= S.soglia ? `<span class="badge ok">Superato</span> soglia ${S.soglia}/30` : `<span class="badge soft">Non superato</span> servono almeno ${S.soglia} punti`;
  }

  root.addEventListener("input", (e) => { if (e.target.matches(".q-score input")) updateTotal(); });
  $("#gen-btn", root).onclick = () => {
    if (timerId && !confirm("Il timer è in corso: vuoi davvero generare una nuova prova?")) return;
    seed = newSeed(); resetTimer(); render(); root.scrollIntoView({ block: "start" });
  };
  $("#copy-btn", root).onclick = async () => {
    try { await navigator.clipboard.writeText(location.href); $("#seed-info").textContent = `Link copiato (codice prova ${seed}).`; }
    catch (e) { $("#seed-info").textContent = `Copia non riuscita: copia l'indirizzo dalla barra del browser (codice prova ${seed}).`; }
  };
  render();
  return {
    setTipo(t) { tipo = t; resetTimer(); render(); },
    stop() { resetTimer(); },
  };
}
