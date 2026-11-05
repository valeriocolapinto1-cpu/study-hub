/* =========================================================
   common.js — funzioni condivise da tutte le pagine
   - intestazione/navigazione, tema chiaro/scuro, piè di pagina
   - caricamento dei file JSON in /data
   - salvataggio dei progressi in localStorage
   - banner cookie, statistiche facoltative, CTA fissa su mobile
   - rendering matematico con KaTeX
   ========================================================= */

const NAV = [
  { href: "programma.html", label: "Programma" },
  { href: "teoria.html", label: "Teoria" },
  { href: "formulario.html", label: "Formulario" },
  { href: "esercizi.html", label: "Esercizi" },
  { href: "esame.html", label: "Esame e quiz" },
  { href: "laboratorio.html", label: "Laboratorio" },
];

/* icone SVG in linea (decorative) */
const ICONS = {
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  sigma: '<path d="M18 4H6l6 8-6 8h12"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7 15h10"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
};
function icon(name, cls = "") {
  return `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;
}
/* immagine ritagliata da un PDF d'esame (dimensioni esplicite, caricamento differito) */
function examImg(im, alt) {
  return `<img class="ex-img" src="${im.src}" width="${im.w}" height="${im.h}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
}
/* intestazione di pagina coerente */
function pageHead(eyebrow, title, intro) {
  return `<header class="page-head">${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ""}<h1>${title}</h1>${intro ? `<p class="page-intro">${intro}</p>` : ""}</header>`;
}

const TIPI_LEZIONE = {
  teoria: "Teoria",
  esercitazione: "Esercitazione",
  laboratorio: "Laboratorio",
  misura: "Teoria della misura",
  altro: "Altro",
};

const NUM = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
const EXT = '<span aria-hidden="true"> ↗</span>'; // indicatore di link esterno

/* ---------- utilità DOM ---------- */
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function pct(done, total) { return total ? Math.round((done / total) * 100) : 0; }
function progressBar(p, color) {
  return `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="${p}% completato"><span style="transform:scaleX(${p / 100});${color ? `--bc:${color}` : ""}"></span></div>`;
}
/* testo normalizzato per la ricerca: minuscolo, senza accenti */
function norm(s) {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function safeSet(key, val) { try { if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch (e) { /* storage non disponibile */ } }

/* ---------- stato nell'URL (filtri condivisibili) ---------- */
function getParams() { return new URLSearchParams(location.search); }
function setParams(obj) {
  const url = new URL(location);
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === false || v == null) url.searchParams.delete(k);
    else url.searchParams.set(k, v === true ? "1" : v);
  }
  history.replaceState(null, "", url);
}

/* ---------- tema ---------- */
const THEME_KEY = "fg2-theme";
function currentTheme() {
  const t = document.documentElement.dataset.theme;
  if (t) return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  safeSet(THEME_KEY, next);
  updateThemeButton();
}
function updateThemeButton() {
  const dark = currentTheme() === "dark";
  const b = $("#theme-btn");
  if (b) {
    b.innerHTML = `<span aria-hidden="true">${dark ? "☀" : "☾"}</span>`;
    b.title = dark ? "Passa al tema chiaro" : "Passa al tema scuro";
    b.setAttribute("aria-label", b.title);
  }
  // la barra del browser segue il tema scelto a mano
  if (document.documentElement.dataset.theme) {
    $all('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", dark ? "#0a0a0a" : "#fafafa"));
  }
}

/* ---------- header / footer ---------- */
function renderChrome() {
  const page = location.pathname.split("/").pop() || "index.html";
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="index.html" translate="no"><svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#0062d1"/><path d="M14 18h36L32 50z" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg>Fisica II <span>Ing. Elettronica</span></a>
      <nav class="nav" id="nav" aria-label="Navigazione principale">
        ${NAV.map((n) => `<a href="${n.href}"${n.href === page ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")}
      </nav>
      <form class="header-search" action="cerca.html" role="search">
        <input type="search" name="q" placeholder="Cerca argomento…" aria-label="Cerca nel sito" autocomplete="off" enterkeyhint="search">
      </form>
      <div class="header-tools">
        <a class="icon-btn search-btn" href="cerca.html" aria-label="Cerca nel sito">${icon("search")}</a>
        <button class="icon-btn" id="theme-btn" type="button"></button>
        <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-label="Apri il menu" aria-expanded="false" aria-controls="nav"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      </div>
    </div>`;
  document.body.prepend(header);
  $(".skip-link") && document.body.prepend($(".skip-link")); // lo skip link resta il primo elemento

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <p>Fisica Generale II · Ingegneria Elettronica · Roma · a.a.&nbsp;2026/2027</p>
    <p>Sito di studio non ufficiale, gratuito e aperto a tutti gli studenti del corso. Non è affiliato all'università né ai docenti: per programma ed esami fanno fede le comunicazioni dei docenti.</p>
    <p>© 2026 Valerio Colapinto · contenuti originali per uso personale di studio · codice con licenza MIT.</p>
    <nav class="footer-links" aria-label="Link legali">
      <a href="privacy.html">Privacy</a>
      <a href="note-legali.html">Note legali</a>
      <a href="https://github.com/valeriocolapinto1-cpu/fisica-2-ingegneria-elettronica/blob/main/COMPLIANCE.md" target="_blank" rel="noopener">Provenienza dei contenuti</a>
      <span id="footer-contact"></span>
      <button type="button" class="linklike" id="cookie-prefs">Preferenze cookie</button>
    </nav>`;
  document.body.append(footer);

  $("#theme-btn").addEventListener("click", toggleTheme);
  updateThemeButton();
  const menuBtn = $("#menu-btn");
  menuBtn.addEventListener("click", () => {
    const open = $("#nav").classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
  });
  $("#cookie-prefs").addEventListener("click", () => { safeSet(CONSENT_KEY, null); showConsentBanner(true); });
}

/* contatti (da data/corso.json) nel piè di pagina e negli elementi [data-contact] */
function renderContacts(corso) {
  const c = corso.contatti || {};
  const parts = [];
  if (c.email) parts.push(`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`);
  if (c.linkedin) parts.push(`<a href="${esc(c.linkedin)}" target="_blank" rel="noopener">LinkedIn${EXT}</a>`);
  if (c.github) parts.push(`<a href="${esc(c.github)}" target="_blank" rel="noopener">GitHub${EXT}</a>`);
  const htmlC = parts.join(" · ");
  if (htmlC) {
    $("#footer-contact").innerHTML = `Contatti: ${htmlC}`;
    $all("[data-contact]").forEach((el) => (el.innerHTML = htmlC));
  }
}

/* ---------- cookie banner e statistiche facoltative ---------- */
const CONSENT_KEY = "fg2-consent";
let _analyticsCode = null;

function loadAnalytics() {
  if (!_analyticsCode || document.getElementById("goatcounter")) return;
  const s = document.createElement("script");
  s.id = "goatcounter";
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = `https://${_analyticsCode}.goatcounter.com/count`;
  document.body.append(s);
}

function showConsentBanner(force = false) {
  const state = safeGet(CONSENT_KEY);
  if (state === "granted") loadAnalytics();
  if (state && !force) return;
  $("#consent")?.remove();
  const box = document.createElement("section");
  box.id = "consent";
  box.className = "consent";
  box.setAttribute("aria-label", "Informativa sui cookie");
  box.innerHTML = _analyticsCode
    ? `<p>Questo sito non usa cookie. Vuoi consentire statistiche di visita anonime e senza cookie (GoatCounter)? <a href="privacy.html">Privacy</a></p>
       <div class="consent-actions">
         <button class="btn" type="button" data-consent="denied">Rifiuta</button>
         <button class="btn primary" type="button" data-consent="granted">Accetta statistiche</button>
       </div>`
    : `<p>Questo sito non usa cookie né statistiche. I tuoi progressi restano solo in questo browser. <a href="privacy.html">Privacy</a></p>
       <div class="consent-actions"><button class="btn primary" type="button" data-consent="ack">Ho capito</button></div>`;
  document.body.append(box);
  document.body.classList.add("has-consent");
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-consent]");
    if (!b) return;
    safeSet(CONSENT_KEY, b.dataset.consent);
    if (b.dataset.consent === "granted") loadAnalytics();
    box.remove();
    document.body.classList.remove("has-consent");
  });
}

/* ---------- CTA fissa su mobile: continua dalla prossima lezione ---------- */
function renderStickyCta(lezioni) {
  if (/esame\.html$/.test(location.pathname)) return; // la pagina ha già i suoi pulsanti di correzione
  const next = lezioni.lezioni.find((l) => !Store.get("lesson", String(l.n)));
  $("#sticky-cta")?.remove();
  const bar = document.createElement("div");
  bar.id = "sticky-cta";
  bar.className = "sticky-cta";
  bar.innerHTML = next
    ? `<a class="btn primary" href="programma.html#lez-${next.n}">Continua: Lezione&nbsp;${next.n}</a>
       <a class="btn" href="esame.html#allenati">${icon("timer")} Quiz</a>`
    : `<a class="btn primary" href="esame.html#allenati">Mettiti alla prova</a>`;
  document.body.append(bar);
  document.body.classList.add("has-sticky-cta");
}

/* ---------- dati ---------- */
const _cache = {};
async function loadData(...names) {
  const out = {};
  await Promise.all(names.map(async (n) => {
    if (!_cache[n]) {
      _cache[n] = fetch(`data/${n}.json`).then((r) => {
        if (!r.ok) throw new Error(`Il file data/${n}.json ha risposto con errore HTTP ${r.status}.`);
        return r.json();
      });
    }
    out[n] = await _cache[n];
  }));
  return out;
}
function showLoadError(err) {
  const main = $("main");
  main.removeAttribute("aria-busy");
  $(".loading", main)?.remove();
  const fileProto = location.protocol === "file:";
  main.insertAdjacentHTML("afterbegin", `<div class="notice" role="alert"><strong>Impossibile caricare i dati.</strong> ${esc(err.message)}<br>
    ${fileProto
      ? "Stai aprendo il sito come file locale e il browser blocca la lettura dei JSON. Avvia un server nella cartella del sito (<code>python3 -m http.server</code>) e apri <code>http://localhost:8000</code>, oppure usa la versione online."
      : "Controlla la connessione e riprova tra qualche istante."}
    <div style="margin-top:8px"><button class="btn" type="button" onclick="location.reload()">Riprova</button></div></div>`);
}

/* stato di caricamento mostrato finché la pagina non ha i dati */
function showLoading() {
  const main = $("main");
  if (main.children.length) return; // pagina statica: niente da caricare
  main.setAttribute("aria-busy", "true");
  main.innerHTML = `<div class="loading" role="status">
      <div class="skeleton" style="width:40%;height:2rem"></div>
      <div class="skeleton" style="width:75%"></div>
      <div class="skeleton" style="width:60%"></div>
      <div class="skeleton" style="height:120px"></div>
      <span class="visually-hidden">Caricamento…</span>
    </div>`;
}

/* blocchi del programma: indici utili */
function indexProgramma(programma) {
  const blocchi = {};
  const sezioni = {};
  for (const b of programma.blocchi) {
    blocchi[b.id] = b;
    for (const s of b.sezioni) sezioni[s.id] = { ...s, blocco: b };
  }
  return { blocchi, sezioni };
}
function blockColor(bid) { return bid ? `var(--${bid})` : "var(--border)"; }
function blockOfSection(sid) { return sid ? sid.slice(0, 2) : null; }
function sectionLabel(sez) {
  if (!sez) return "";
  return sez.titolo ? sez.titolo : `Blocco ${sez.blocco.numero} — ${sez.blocco.titolo}`;
}

/* ---------- progressi (localStorage) ---------- */
const STORE_KEY = "fg2-progress-v1";
const Store = {
  _data: null,
  _load() {
    if (this._data) return this._data;
    try { this._data = JSON.parse(safeGet(STORE_KEY)) || {}; } catch (e) { this._data = {}; }
    return this._data;
  },
  _save() { safeSet(STORE_KEY, JSON.stringify(this._data)); },
  get(cat, id) { const d = this._load(); return !!(d[cat] && d[cat][id]); },
  set(cat, id, val) {
    const d = this._load();
    d[cat] = d[cat] || {};
    if (val) d[cat][id] = true; else delete d[cat][id];
    this._save();
  },
  count(cat, ids) { return ids.filter((id) => this.get(cat, id)).length; },
  total() { return Object.values(this._load()).reduce((a, c) => a + Object.keys(c).length, 0); },
  exportJSON() { return JSON.stringify({ versione: 1, esportato: new Date().toISOString(), progressi: this._load() }, null, 2); },
  importJSON(text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { throw new Error("Il file non è un JSON valido. Scegli il file .json creato con “Esporta progressi”."); }
    if (!obj || typeof obj.progressi !== "object" || Array.isArray(obj.progressi)) {
      throw new Error("Il file non contiene progressi di questo sito. Scegli il file creato con “Esporta progressi”.");
    }
    this._data = obj.progressi;
    this._save();
  },
  reset() { this._data = {}; this._save(); },
};

/* checkbox collegata a una voce di Store; onChange viene chiamata dopo il salvataggio */
function bindChecks(root, onChange) {
  root.addEventListener("change", (e) => {
    const cb = e.target;
    if (!cb.matches('input[type="checkbox"][data-cat]')) return;
    Store.set(cb.dataset.cat, cb.dataset.id, cb.checked);
    const wrap = cb.closest(".check");
    if (wrap) wrap.classList.toggle("done", cb.checked);
    if (cb.dataset.cat === "lesson" && _cache.lezioni) _cache.lezioni.then(renderStickyCta);
    if (onChange) onChange(cb);
  });
}
function checkbox(cat, id, labelHtml, extraClass = "") {
  const on = Store.get(cat, id);
  return `<label class="check ${on ? "done" : ""} ${extraClass}"><input type="checkbox" data-cat="${cat}" data-id="${esc(id)}"${on ? " checked" : ""}><span class="check-text">${labelHtml}</span></label>`;
}

/* ---------- KaTeX ---------- */
function tex(src, display = true) {
  if (window.katex) {
    return `<span translate="no">${katex.renderToString(src, { displayMode: display, throwOnError: false, strict: "ignore" })}</span>`;
  }
  return `<code translate="no">${esc(src)}</code>`;
}
function renderMathIn(el) {
  if (window.renderMathInElement) {
    renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
      strict: "ignore",
    });
    $all(".katex", el).forEach((k) => k.setAttribute("translate", "no"));
  }
}

/* ---------- animazioni ---------- */
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
let _io = null;
// in stampa tutto deve essere visibile, anche ciò che non è ancora comparso
window.addEventListener("beforeprint", () => $all(".reveal").forEach((el) => el.classList.add("in")));
/* fa comparire con dissolvenza gli elementi quando entrano nello schermo */
function reveal(root = document, selector = ".card, .lesson, details.block, .fblock, .exgroup > h2, .section-title, .page-head, .q-card") {
  if (REDUCED.matches || !("IntersectionObserver" in window)) return;
  _io = _io || new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); _io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -6% 0px" });
  let i = 0;
  $all(selector, root).forEach((el) => {
    if (el.classList.contains("reveal") || el.closest(".total-card")) return;
    el.classList.add("reveal");
    el.style.setProperty("--i", String(Math.min(i++, 8)));
    _io.observe(el);
  });
}
/* numeri che salgono da 0 al valore finale */
function countUp(root = document) {
  $all("[data-count]", root).forEach((el) => {
    const end = Number(el.dataset.count), suffix = el.dataset.suffix || "";
    if (REDUCED.matches || !end) { el.textContent = end + suffix; return; }
    const t0 = performance.now(), dur = 900;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
      el.textContent = v + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
/* controllo a schede (viste) con indicatore animato */
function segmented(el, onChange) {
  const btns = $all('[role="tab"]', el);
  const ind = document.createElement("span");
  ind.className = "seg-ind";
  el.prepend(ind);
  const place = () => {
    const b = btns.find((x) => x.getAttribute("aria-selected") === "true") || btns[0];
    ind.style.width = b.offsetWidth + "px";
    ind.style.transform = `translateX(${b.offsetLeft - 3}px)`;
  };
  const select = (b, notify = true) => {
    btns.forEach((x) => {
      const on = x === b;
      x.setAttribute("aria-selected", String(on));
      x.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(x.getAttribute("aria-controls"));
      if (panel) panel.hidden = true;
    });
    const shown = document.getElementById(b.getAttribute("aria-controls"));
    if (shown) shown.hidden = false;
    place();
    if (notify && onChange) onChange(b.dataset.value);
  };
  btns.forEach((b, i) => {
    b.addEventListener("click", () => select(b));
    b.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      const n = btns[(i + d + btns.length) % btns.length];
      n.focus(); select(n);
    });
  });
  requestAnimationFrame(place);
  window.addEventListener("resize", place);
  document.fonts && document.fonts.ready.then(place);
  return { select: (value, notify = false) => { const b = btns.find((x) => x.dataset.value === value); if (b) select(b, notify); } };
}

/* porta in vista l'elemento indicato dall'hash dopo il rendering dinamico */
function scrollToHash() {
  if (!location.hash) return;
  const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!t) return;
  const det = t.closest("details");
  if (det) det.open = true;
  // elementi alti (intere sezioni) allineati in alto, elementi piccoli al centro
  t.classList.add("in");
  t.scrollIntoView({ block: t.offsetHeight > window.innerHeight / 2 ? "start" : "center" });
  t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash");
}

/* avvio comune: header/footer, stato di caricamento, poi la funzione della pagina */
function page(init) {
  document.addEventListener("DOMContentLoaded", async () => {
    renderChrome();
    showLoading();
    // contatti, banner cookie e CTA mobile non bloccano la pagina
    loadData("corso", "lezioni").then(({ corso, lezioni }) => {
      _analyticsCode = (corso.analytics && corso.analytics.goatcounter) || null;
      renderContacts(corso);
      showConsentBanner();
      renderStickyCta(lezioni);
    }).catch(() => showConsentBanner());
    try {
      await init();
      $("main").removeAttribute("aria-busy");
      reveal($("main"));
      countUp($("main"));
      scrollToHash();
    } catch (err) {
      console.error(err);
      showLoadError(err);
    }
  });
}
