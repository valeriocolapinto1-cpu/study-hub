// Piano di studio: distribuzione dei blocchi per peso e avanzamento, calendario settimanale, esportazione .ics.
export const MS_DAY = 86400000;
const startOfWeek = (d) => { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const wd = (x.getUTCDay() + 6) % 7; return new Date(x.getTime() - wd * MS_DAY); };
const iso = (d) => d.toISOString().slice(0, 10);

/**
 * blocchi: [{id, titolo, peso}] nell'ordine scelto; stato: {[argomento]: 'studiato'|...}; argomenti: [{id, blocco}].
 * Restituisce {settimane:[{inizio, fine, tipo, voci:[{blocco, ore}]}], note}.
 */
export function buildPlan({ oggi = new Date(), esame, oreSettimana = 8, blocchi, argomenti, stato = {} }) {
  const w0 = startOfWeek(oggi), wE = startOfWeek(esame);
  const W = Math.max(1, Math.round((wE.getTime() - w0.getTime()) / (7 * MS_DAY)));
  const R = W >= 8 ? 2 : W >= 4 ? 1 : 0; // settimane finali: prove complete a tempo e ripasso
  const Wk = W - R;
  // peso residuo = peso del blocco × quota di argomenti non ancora studiati
  const att = blocchi.map((b) => {
    const arg = argomenti.filter((a) => a.blocco === b.id);
    const resto = arg.filter((a) => !stato[a.id] || stato[a.id] === 'non iniziato').length;
    const quota = arg.length ? resto / arg.length : 0;
    return { ...b, residuo: b.peso * quota, quota };
  });
  const attivi = att.filter((b) => b.residuo > 0);
  const somma = attivi.reduce((s, b) => s + b.residuo, 0);
  const intervalli = []; let cum = 0;
  for (const b of attivi) { const f = Wk > 0 ? (Wk * b.residuo) / somma : 0; intervalli.push({ id: b.id, da: cum, a: cum + f }); cum += f; }
  const settimane = [];
  for (let k = 0; k < W; k++) {
    const inizio = new Date(w0.getTime() + k * 7 * MS_DAY), fine = new Date(inizio.getTime() + 6 * MS_DAY);
    if (k >= Wk) { settimane.push({ inizio: iso(inizio), fine: iso(fine), tipo: 'prove', voci: [{ blocco: 'Prove complete a tempo e ripasso', ore: oreSettimana }] }); continue; }
    const voci = [];
    for (const it of intervalli) {
      const ov = Math.min(it.a, k + 1) - Math.max(it.da, k);
      if (ov > 1e-9) voci.push({ blocco: it.id, ore: Math.round(oreSettimana * ov * 10) / 10 });
    }
    settimane.push({ inizio: iso(inizio), fine: iso(fine), tipo: 'studio', voci });
  }
  const note = [];
  if (!attivi.length) note.push('Tutti gli argomenti risultano già studiati: il piano contiene solo ripasso e prove.');
  if (W < 4) note.push('Meno di 4 settimane all\'esame: il piano non prevede una fase dedicata alle prove complete.');
  return { settimane, note, W, R, Wk };
}

// ── ICS ──
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function fold(line) { // righe ≤ 75 ottetti, continuazione con spazio
  const enc = new TextEncoder(); if (enc.encode(line).length <= 75) return line;
  const out = []; let cur = '';
  for (const ch of line) { if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch; }
  out.push(cur); return out.join('\r\n ');
}
const ymd = (s) => s.replace(/-/g, '');
export function toICS(piano, { nome = 'Piano di studio — Teoria dei Circuiti', now = new Date(), titoliBlocchi = {} } = {}) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Teoria dei Circuiti//Piano di studio//IT', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(nome)}`];
  piano.settimane.forEach((w, i) => {
    const fineExcl = iso(new Date(new Date(w.fine + 'T00:00:00Z').getTime() + MS_DAY));
    const desc = w.voci.map((v) => `${titoliBlocchi[v.blocco] ? `Blocco ${v.blocco} — ${titoliBlocchi[v.blocco]}` : v.blocco}: ${v.ore} h`).join('\n');
    const summ = w.tipo === 'prove' ? 'Prove complete a tempo e ripasso' : `Studio: ${w.voci.map((v) => `blocco ${v.blocco}`).join(' + ')}`;
    L.push('BEGIN:VEVENT', `UID:tdc-piano-${ymd(w.inizio)}-${i}@teoria-circuiti.local`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(w.inizio)}`, `DTEND;VALUE=DATE:${ymd(fineExcl)}`, `SUMMARY:${esc(summ)}`, `DESCRIPTION:${esc(desc)}`, 'END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.map(fold).join('\r\n') + '\r\n';
}
