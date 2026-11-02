(() => {
  'use strict';

  const I18N = {
    it: {
      'nav.courses': 'Corsi', 'nav.about': 'Chi sono',
      'hero.eyebrow': 'Ingegneria Elettronica · Roma',
      'hero.title1': 'Studiare costruendo.', 'hero.title2': 'Un sito per ogni esame.',
      'hero.lead': "Una raccolta di strumenti di studio interattivi: teoria con dimostrazioni, formulari, esercizi, quiz e simulazioni d'esame, scritti e programmati da me.",
      'hero.cta': 'Esplora i corsi',
      'courses.eyebrow': 'Corsi', 'courses.title': 'I miei siti di studio',
      'courses.sub': 'Ogni scheda rimanda al sito del corso. Quelle senza sito sono in programma.',
      'about.eyebrow': 'Chi sono', 'about.title': 'Valerio Colapinto',
      'about.p1': 'Studente di Ingegneria Elettronica a Roma, laurea prevista nel 2028. Mi interessano elettronica, telecomunicazioni, informatica e cybersecurity.',
      'about.p2': 'Questi siti nascono dal modo in cui mi piace studiare: capire le cose da zero, verificarle con esercizi e simulazioni, e costruire gli strumenti che mi servono. Li sviluppo con Git e GitHub e con l\'aiuto dell\'intelligenza artificiale.',
      'foot.disclaimer': "Strumenti di studio indipendenti, scritti da uno studente: non sono siti ufficiali e non sono affiliati ad alcuna università né ai docenti. Per programma, regole e date d'esame fanno fede le pagine ufficiali dei corsi.",
      'f.all': 'Tutti', 'f.y1': '1° anno', 'f.y2': '2° anno', 'f.online': 'Con sito',
      'k.year': '° anno', 'k.sem': '° semestre',
      's.online': 'Online', 's.soon': 'In arrivo',
      'a.open': 'Apri il sito', 'a.repo': 'Codice',
      'n.soon': 'Sito in programma',
      'st.sites': 'siti online', 'st.courses': 'corsi in elenco', 'st.soon': 'siti in programma',
      'doc.title': 'Valerio Colapinto — Siti di studio · Ingegneria Elettronica'
    },
    en: {
      'nav.courses': 'Courses', 'nav.about': 'About',
      'hero.eyebrow': 'Electronic Engineering · Rome',
      'hero.title1': 'Learning by building.', 'hero.title2': 'One site for every exam.',
      'hero.lead': 'A collection of interactive study tools: theory with proofs, formula sheets, exercises, quizzes and mock exams, written and coded by me.',
      'hero.cta': 'Explore the courses',
      'courses.eyebrow': 'Courses', 'courses.title': 'My study sites',
      'courses.sub': 'Each card links to the course site. Cards without a site are planned.',
      'about.eyebrow': 'About', 'about.title': 'Valerio Colapinto',
      'about.p1': 'Electronic Engineering student in Rome, graduating in 2028. I am interested in electronics, telecommunications, computer science and cybersecurity.',
      'about.p2': 'These sites come from the way I like to study: understand things from scratch, check them with exercises and simulations, and build the tools I need. I develop them with Git and GitHub and with the help of artificial intelligence.',
      'foot.disclaimer': 'Independent study tools written by a student: they are not official websites and are not affiliated with any university or its professors. For syllabus, rules and exam dates, the official course pages prevail.',
      'f.all': 'All', 'f.y1': 'Year 1', 'f.y2': 'Year 2', 'f.online': 'With a site',
      'k.year': '', 'k.sem': '',
      's.online': 'Online', 's.soon': 'Coming soon',
      'a.open': 'Open site', 'a.repo': 'Code',
      'n.soon': 'Site planned',
      'st.sites': 'sites online', 'st.courses': 'courses listed', 'st.soon': 'sites planned',
      'doc.title': 'Valerio Colapinto — Study sites · Electronic Engineering'
    }
  };

  const TAGS_EN = {
    'Limiti': 'Limits', 'Derivate': 'Derivatives', 'Integrali': 'Integrals', 'Matrici': 'Matrices',
    'Spazi vettoriali': 'Vector spaces', 'Autovalori': 'Eigenvalues', 'Meccanica': 'Mechanics',
    'Termodinamica': 'Thermodynamics', 'Simulazioni': 'Simulations', 'Stechiometria': 'Stoichiometry',
    'Termochimica': 'Thermochemistry', 'Elettrochimica': 'Electrochemistry', 'Complemento a 2': "Two's complement",
    'Reti': 'Networks', 'Sicurezza': 'Security', 'Elettromagnetismo': 'Electromagnetism',
    'Laboratorio': 'Lab', "Simulazione d'esame": 'Mock exam', 'Serie': 'Series',
    'Funzioni di più variabili': 'Multivariable functions', 'Equazioni differenziali': 'Differential equations',
    'Doppi bipoli': 'Two-ports', 'Trasformatore ideale': 'Ideal transformer', 'Campionamento': 'Sampling',
    'Sistemi LTI': 'LTI systems', 'Processi casuali': 'Random processes', 'Rumore': 'Noise', 'Stima': 'Estimation',
    'Diodi': 'Diodes', 'Amplificatori': 'Amplifiers'
  };
  const tag = (x) => (lang === 'en' && TAGS_EN[x]) || x;

  const $ = (s, r = document) => r.querySelector(s);
  const store = {
    get() { try { return localStorage.getItem('lang'); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem('lang', v); } catch (e) { /* ignore */ } }
  };

  let lang = store.get() || ((navigator.language || 'it').toLowerCase().startsWith('it') ? 'it' : 'en');
  if (!I18N[lang]) lang = 'it';
  let filter = 'all';
  let data = null;

  const t = (k) => I18N[lang][k] ?? k;
  const tx = (o) => (o && (o[lang] ?? o.it)) || '';

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function kicker(c) {
    const y = lang === 'it' ? `${c.year}${t('k.year')}` : `Year ${c.year}`;
    if (!c.semester) return y;
    return lang === 'it' ? `${y} · ${c.semester}${t('k.sem')}` : `${y} · Semester ${c.semester}`;
  }

  function matches(c) {
    if (filter === 'all') return true;
    if (filter === 'online') return c.status === 'online';
    return String(c.year) === filter;
  }

  function renderStats() {
    const cs = data.courses;
    const online = cs.filter(c => c.status === 'online');
    const soon = cs.length - online.length;
    const rows = [[online.length, t('st.sites')], [cs.length, t('st.courses')], [soon, t('st.soon')]];
    const dl = $('#stats');
    dl.replaceChildren(...rows.map(([v, l]) => {
      const d = el('div', 'stat');
      const dd = el('dd', null, '0');
      dd.dataset.to = v;
      d.append(dd, el('dt', null, l));
      return d;
    }));
    countUp(dl);
  }

  function countUp(root) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll('dd').forEach(dd => {
      const to = +dd.dataset.to;
      if (reduce) { dd.textContent = to; return; }
      const t0 = performance.now(), dur = 900;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        dd.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function renderFilters() {
    const cs = data.courses;
    const defs = [
      ['all', t('f.all'), cs.length],
      ['1', t('f.y1'), cs.filter(c => c.year === 1).length],
      ['2', t('f.y2'), cs.filter(c => c.year === 2).length],
      ['online', t('f.online'), cs.filter(c => c.status === 'online').length]
    ];
    $('#filters').replaceChildren(...defs.map(([k, label, n]) => {
      const b = el('button', 'chip', label);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(filter === k));
      b.append(el('span', 'n', String(n)));
      b.addEventListener('click', () => { filter = k; renderFilters(); renderCards(); });
      return b;
    }));
  }

  function card(c) {
    const online = c.status === 'online';
    const a = el('article', `card glass ${online ? 'online' : 'soon'}`);
    const top = el('div', 'card-top');
    const badge = el('span', `badge ${online ? 'online' : ''}`, online ? t('s.online') : t('s.soon'));
    top.append(el('span', 'kicker', kicker(c)), badge);
    a.append(top);

    const head = el('div');
    head.append(el('h3', null, tx(c.name)));
    if (c.subtitle) head.append(el('p', 'sub', tx(c.subtitle)));
    a.append(head, el('p', 'desc', tx(c.description)));

    if (c.tags && c.tags.length) {
      const tags = el('div', 'tags');
      c.tags.forEach(x => tags.append(el('span', 'tag', tag(x))));
      a.append(tags);
    }
    if (online) {
      if (c.metrics && c.metrics.length) {
        const m = el('div', 'metrics');
        c.metrics.forEach(x => {
          const w = el('div', 'metric');
          w.append(el('b', null, String(x.value)), el('span', null, tx(x.label)));
          m.append(w);
        });
        a.append(m);
      }
      const acts = el('div', 'card-actions');
      const open = el('a', 'btn primary sm', `${t('a.open')} ↗`);
      open.href = data.base + c.site; open.target = '_blank'; open.rel = 'noopener';
      const repo = el('a', 'btn ghost sm', `${t('a.repo')} ↗`);
      repo.href = data.github + c.repo; repo.target = '_blank'; repo.rel = 'noopener';
      acts.append(open, repo);
      a.append(acts);
    } else {
      a.append(el('p', 'empty-note', `— ${t('n.soon')}`));
    }
    return a;
  }

  let io;
  function renderCards() {
    const box = $('#cards');
    box.replaceChildren(...data.courses.filter(matches).map(card));
    if (io) io.disconnect();
    io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    box.querySelectorAll('.card').forEach((c, i) => {
      c.style.transitionDelay = `${Math.min(i, 8) * 55}ms`;
      io.observe(c);
    });
  }

  function applyStatic() {
    document.documentElement.lang = lang;
    document.title = t('doc.title');
    document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }

  function renderAll() {
    applyStatic();
    if (data) { renderStats(); renderFilters(); renderCards(); }
  }

  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang; store.set(lang); renderAll();
  }));

  // pointer-following specular highlight on glass surfaces
  document.addEventListener('pointermove', (e) => {
    const g = e.target.closest && e.target.closest('.glass');
    if (!g) return;
    const r = g.getBoundingClientRect();
    g.style.setProperty('--mx', `${e.clientX - r.left}px`);
    g.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });

  $('#year').textContent = new Date().getFullYear();
  applyStatic();

  fetch('data/projects.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(j => { data = j; renderAll(); })
    .catch(() => { $('#cards').textContent = 'Impossibile caricare l\'elenco dei corsi.'; });
})();
