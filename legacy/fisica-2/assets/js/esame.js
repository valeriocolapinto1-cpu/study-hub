/* Esame: regole della prova, quiz a correzione automatica e simulazioni di scritto e orale */
page(async () => {
  const data = await loadData("esame", "corso", "risorse", "programma", "appelli", "laboratorio", "quiz");
  const { esame, corso, risorse } = data;
  const s = esame.scritto, o = esame.orale, ra = esame.risultatiApprendimento;
  const app = $("#app");
  const TIPI = ["quiz", "misto", "vero", "orale"];
  const params = getParams();
  let tipo = TIPI.includes(params.get("tipo")) ? params.get("tipo") : "quiz";

  app.innerHTML = `
    ${pageHead(`a.a. ${esc(corso.annoAccademico)}`, "Esame", "Come funziona la prova e un posto dove allenarsi: quiz corretti in automatico, prove di scritto generate sulla tipologia degli appelli passati (con soluzioni) e simulazioni di orale.")}

    <div class="exam-facts">
      <section class="card accent">
        <h2 style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">Scritto <span class="badge">${esc(s.durata)}</span></h2>
        <ul>
          <li>${s.composizione[0].numero} esercizi da ${s.composizione[0].puntiCadauno} punti + ${s.composizione[1].numero} domande di teoria da ${s.composizione[1].puntiCadauno} punti</li>
          <li>${esc(s.materiale)}</li>
          <li>Si supera con almeno <strong>${s.soglia}/30</strong></li>
        </ul>
      </section>
      <section class="card accent">
        <h2 style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">Orale <span class="badge">${esc(o.descrizione)}</span></h2>
        <ul>
          <li>${o.composizione[0].numero} domande da ${o.composizione[0].puntiCadauno} punti</li>
          ${o.note.map((n) => `<li>${esc(n)}</li>`).join("")}
        </ul>
      </section>
    </div>
    <p class="small muted" style="margin:12px 0 0"><strong>Voto finale:</strong> ${esc(esame.votoFinale.toLowerCase())}</p>

    <div class="section-title" id="allenati"><h2>Allenati</h2></div>
    <div class="segmented" role="tablist" aria-label="Tipo di prova">
      <button type="button" role="tab" id="tab-quiz" data-value="quiz" aria-controls="panel-quiz" aria-selected="true">Quiz</button>
      <button type="button" role="tab" id="tab-misto" data-value="misto" aria-controls="panel-prove" aria-selected="false">Scritto misto</button>
      <button type="button" role="tab" id="tab-vero" data-value="vero" aria-controls="panel-prove" aria-selected="false">Appello tipo</button>
      <button type="button" role="tab" id="tab-orale" data-value="orale" aria-controls="panel-prove" aria-selected="false">Orale</button>
    </div>
    <section id="panel-quiz" role="tabpanel" aria-labelledby="tab-quiz" style="margin-top:14px"></section>
    <section id="panel-prove" role="tabpanel" style="margin-top:14px" hidden></section>

    <div class="section-title"><h2>Da sapere</h2></div>
    <details class="card more">
      <summary>Come affrontare lo scritto e l'orale ${icon("chev", "chev")}</summary>
      <div class="more-body">
        <h3>Scritto</h3>
        <ul>
          <li>Leggi tutti gli esercizi e comincia da quello che sai fare: ognuno vale ${s.composizione[0].puntiCadauno} punti, e con circa 30 minuti a esercizio resta tempo per la teoria.</li>
          <li>Fai un disegno, scegli il sistema di riferimento e scrivi la legge da cui parti (Gauss, Ampère, Faraday, Kirchhoff…) prima dei calcoli.</li>
          <li>Risolvi in forma simbolica e sostituisci i numeri solo alla fine. Controlla le dimensioni e i casi limite (ad esempio $r\\to\\infty$ o $R\\to0$).</li>
          <li>Nelle domande di teoria (${s.composizione[1].puntiCadauno} punti) scrivi definizione, enunciato, passaggi chiave della dimostrazione e significato fisico: poche righe ordinate.</li>
          <li>Anche i punteggi parziali contano: imposta sempre il problema, anche se non arrivi al numero.</li>
        </ul>
        <h3>Orale</h3>
        <ul>
          <li>Per ogni argomento del <a href="teoria.html">programma</a> sappi dare definizioni, enunciare le leggi e ricavare i risultati principali alla lavagna.</li>
          <li>Collega sempre forma integrale e forma locale delle equazioni di Maxwell.</li>
          <li>Porta le relazioni di laboratorio e ripassa scopo, metodo, analisi dei dati e incertezze di ogni esperienza.</li>
        </ul>
      </div>
    </details>
    <details class="card more">
      <summary>Risultati attesi e criteri di valutazione ${icon("chev", "chev")}</summary>
      <div class="more-body grid grid-2">
        <div>
          <h3>Risultati di apprendimento</h3>
          <ul class="topic-list" id="ra-list">
            ${ra.livelli.map((l) => `<li>${checkbox("outcome", l.id, `<strong>Livello ${l.livello}.</strong> ${l.placeholder && l.testo.startsWith("[") ? `<span class="soft-text">descrizione nella <a href="${esc(corso.link.paginaCorso)}" target="_blank" rel="noopener">scheda ufficiale${EXT}</a></span>` : esc(l.testo)}`)}</li>`).join("")}
          </ul>
        </div>
        <div>
          <h3>Cosa viene valutato</h3>
          <ul class="topic-list" id="cr-list">${esame.criteri.map((c) => `<li>${checkbox("criterio", c.id, esc(c.testo))}</li>`).join("")}</ul>
        </div>
      </div>
    </details>
    <details class="card more" id="materiali">
      <summary>Materiali del corso ${icon("chev", "chev")}</summary>
      <div class="more-body">
        <dl class="kv">
          <dt>Testo</dt><dd>${esc(risorse.testo.autori)}, <em>${esc(risorse.testo.titolo)}</em>, ${esc(risorse.testo.editore)}</dd>
          <dt>Dispense</dt><dd>Teoria della misura, distribuite dai docenti durante il corso</dd>
          <dt>Appelli</dt><dd><a href="esercizi.html">Indice degli esercizi per argomento</a> · <a href="${esc(corso.link.dropboxEsami)}" target="_blank" rel="noopener">PDF originali${EXT}</a></dd>
          <dt>Corso</dt><dd><a href="${esc(corso.link.paginaCorso)}" target="_blank" rel="noopener">Pagina ufficiale del corso${EXT}</a></dd>
        </dl>
      </div>
    </details>`;

  renderMathIn(app);
  bindChecks($("#ra-list"));
  bindChecks($("#cr-list"));
  if (location.hash === "#materiali") $("#materiali").open = true;

  createQuiz($("#panel-quiz"), data);
  let prove = null;
  const show = (t) => {
    tipo = t;
    if (t === "quiz") { setParams({ tipo: "", prova: "" }); return; }
    if (!prove) prove = createProve($("#panel-prove"), data, t);
    else prove.setTipo(t);
  };
  const tabs = segmented($(".segmented"), show);
  tabs.select(tipo);
  if (tipo !== "quiz") show(tipo);
});
