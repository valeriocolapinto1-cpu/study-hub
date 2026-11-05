/* Home: presentazione del corso, avanzamento e accesso rapido alle sezioni */
page(async () => {
  const { corso, lezioni, appelli, esame, formule, quiz } = await loadData("corso", "lezioni", "appelli", "esame", "formule", "quiz");
  const app = $("#app");
  const lez = lezioni.lezioni;
  const nEx = appelli.appelli.reduce((a, x) => a + x.esercizi.length, 0);
  const exIds = appelli.appelli.flatMap((a) => a.esercizi.map((e) => `${a.id}-${e.n}`));
  const nFormule = formule.blocchi.reduce((a, b) => a + b.gruppi.reduce((x, g) => x + g.formule.length, 0), 0);

  const lezDone = lez.filter((l) => Store.get("lesson", String(l.n))).length;
  const exDone = Store.count("exam", exIds);
  const next = lez.find((l) => !Store.get("lesson", String(l.n)));

  const features = [
    ["teoria.html", "book", "var(--b1)", "Teoria", "Ogni capitolo spiegato, con le dimostrazioni da sapere."],
    ["esercizi.html", "pencil", "var(--b2)", "Esercizi d'esame", `Indice per argomento di ${nEx} esercizi di ${appelli.appelli.length} appelli.`],
    ["esame.html#allenati", "timer", "var(--b5)", "Quiz e simulazioni", `${quiz.domande.length} domande corrette in automatico, scritti e orali simulati.`],
    ["formulario.html", "sigma", "var(--b3)", "Formulario", `${nFormule} formule, da Coulomb a Maxwell.`],
  ];

  app.innerHTML = `
    <section class="hero">
      <div class="hero-glow" aria-hidden="true"></div>
      <p class="kicker"><span class="pill">a.a.&nbsp;${esc(corso.annoAccademico)}</span> ${esc(corso.corsoDiLaurea)}</p>
      <h1>Fisica Generale&nbsp;II,<br><span class="grad">tutto in un posto.</span></h1>
      <p class="lead">Teoria spiegata, formule, indice degli esercizi d'esame per argomento, quiz corretti in automatico e simulazioni. Gratis, senza registrazione.</p>
      <div class="hero-actions">
        ${next
          ? `<a class="btn primary lg" href="programma.html#lez-${next.n}">${lezDone ? "Continua" : "Inizia"} dalla lezione&nbsp;${next.n} <span aria-hidden="true">→</span></a>`
          : `<a class="btn primary lg" href="esame.html#allenati">Mettiti alla prova <span aria-hidden="true">→</span></a>`}
        <a class="btn lg" href="esame.html#allenati">${icon("timer")} Fai un quiz</a>
      </div>
    </section>

    <div class="grid grid-4">
      ${features.map(([h, ic, c, t, d]) => `
        <a class="card card-link" href="${h}" style="--bc:${c}">
          <div class="feature-ico">${icon(ic)}</div>
          <h3>${t} <span class="arrow" aria-hidden="true">→</span></h3>
          <p class="small muted" style="margin:0">${d}</p>
        </a>`).join("")}
    </div>

    <div class="card" style="margin-top:14px">
      <div class="progress-row">
        <a class="label" href="programma.html">Lezioni studiate</a><span class="val">${lezDone}/${lez.length}</span>
        ${progressBar(pct(lezDone, lez.length))}
      </div>
      <div class="progress-row">
        <a class="label" href="esercizi.html">Esercizi d'esame risolti</a><span class="val">${exDone}/${nEx}</span>
        ${progressBar(pct(exDone, nEx))}
      </div>
    </div>

    <p class="small muted" style="margin-top:18px">Esame: scritto con ${esc(esame.scritto.descrizione)} (soglia ${esame.scritto.soglia}/30) e orale con ${esc(esame.orale.descrizione)}. <a href="esame.html">Tutti i dettagli</a>.</p>`;
});
