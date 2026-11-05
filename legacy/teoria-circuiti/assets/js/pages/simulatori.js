import { esc } from '../ui.js';
import { generate } from '../generator.js';
import { toSpice } from '../spice.js';
import { TEMPLATES } from '../templates/index.js';
import { statement } from '../explain.js';
import { typeset } from '../katex.js';
import { renderCircuit } from '../svg/render.js';

const root = document.getElementById('root');
const params = new URLSearchParams(location.search);
root.innerHTML = `<h1>Simulatori</h1>
  <p>Verificare un esercizio con un simulatore è un buon controllo indipendente, ma <strong>non sostituisce lo svolgimento a mano</strong>. Due strumenti gratuiti: <a href="https://www.falstad.com/circuit/" rel="noopener noreferrer">Falstad CircuitJS</a> (nel browser) e <a href="https://www.analog.com/en/resources/design-tools-and-calculators/ltspice-simulator.html" rel="noopener noreferrer">LTspice</a> (Analog Devices).</p>
  <h2>Verifica con CircuitJS, passo passo</h2>
  <ol><li>Apri CircuitJS e ricostruisci lo schema con i componenti (<em>Draw → Passive Components, Sources, Active Building Blocks</em>). Il nullore si può rappresentare con un amplificatore operazionale ideale.</li>
  <li>Imposta i valori dello schema (resistori in Ω, condensatori in F, induttori in H). Per un generatore sinusoidale scegli <em>AC Voltage Source</em> con ampiezza e frequenza $f=\\omega/2\\pi$.</li>
  <li>Per il comportamento «generatori accesi per $t<0$, spenti per $t>0$» usa un generatore con un interruttore (<em>Switch</em>) che si apre al tempo desiderato, oppure osserva la scarica partendo dallo stato di regime.</li>
  <li>Apri uno <em>Scope</em> sul nodo d'uscita; confronta $v_{out}(t)$ e la costante di tempo ($\\tau$ = tempo in cui la scarica scende al $36{,}8\\%$).</li></ol>
  <h2>Verifica con LTspice, passo passo</h2>
  <ol><li>Genera qui sotto l'esercizio ed esporta il netlist <code>.cir</code>; salva il testo in un file e aprilo con <em>File → Open</em> (oppure incollalo in un nuovo schema come testo SPICE).</li>
  <li>Avvia la simulazione (<em>Run</em>): è già presente il comando <code>.tran</code>. Visualizza $V(\\text{uscita})$.</li>
  <li>L'istante $t=0$ dell'esercizio corrisponde a $t=T_0$ della simulazione (indicato nell'intestazione del file): prima di $T_0$ i generatori sono accesi, dopo sono spenti.</li></ol>
  <div class="notice"><strong>Approssimazioni del modello SPICE.</strong> Nullore → generatore di tensione controllato con guadagno $10^6$ (segno scelto verificando la soluzione); trasformatore ideale → generatore controllato di tensione + generatore controllato di corrente (passa anche la continua, come l'elemento ideale; un vero trasformatore con induttori accoppiati non la passerebbe); doppio bipolo → generatori controllati (la matrice $Z$ è convertita in $Y$); generatori indipendenti → sorgenti comportamentali con interruttore ideale; condizioni iniziali dal punto di lavoro (non sono impostate a mano). Il guadagno finito introduce errori dell'ordine di $10^{-6}$.</div>
  <h2>Esporta un esercizio</h2>
  <form class="card" id="f"><div class="row"><div><label for="lvl">Difficoltà</label><select id="lvl"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></div>
  <div><label for="tpl">Tipo</label><select id="tpl"><option value="any">Casuale</option>${Object.keys(TEMPLATES).map((k) => `<option>${k}</option>`).join('')}</select></div>
  <div><label for="seed">Seed</label><input id="seed" type="text" value="${esc(params.get('seed') || '7')}" style="max-width:120px"></div>
  <div><label for="fl">Programma</label><select id="fl"><option value="ltspice">LTspice</option><option value="ngspice">ngspice</option></select></div></div>
  <p><button class="btn primary" type="submit">Genera netlist</button></p></form><div id="out"></div>`;
root.querySelector('#lvl').value = params.get('lvl') || '1'; root.querySelector('#tpl').value = params.get('tpl') || 'any';
root.querySelector('#f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const g = generate({ template: root.querySelector('#tpl').value, level: Number(root.querySelector('#lvl').value), seed: root.querySelector('#seed').value.trim() || '1' });
  const sp = toSpice(g.inst, { flavor: root.querySelector('#fl').value, sol: g.sol });
  root.querySelector('#out').innerHTML = `<section class="card"><p>${statement(g.inst, g.sol)}</p><figure class="fig"><div style="overflow-x:auto">${renderCircuit(g.inst.circuit, g.inst.layout, { omega: g.inst.omega }).svg}</div></figure>
    <p class="muted">Simulazione: $T_0=${sp.T0.toFixed(2)}\\,\\mathrm s$ (istante $t=0$ dell'esercizio), durata ${sp.tstop.toFixed(2)} s.</p>
    <textarea readonly rows="16" style="max-width:100%;font-family:var(--mono)" aria-label="Netlist SPICE">${esc(sp.text)}</textarea>
    <div class="row"><button class="btn" id="cp">Copia</button><button class="btn primary" id="dl">Scarica .cir</button></div></section>`;
  root.querySelector('#cp').addEventListener('click', async () => { try { await navigator.clipboard.writeText(sp.text); } catch (er) { /* seleziona a mano */ } });
  root.querySelector('#dl').addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([sp.text], { type: 'text/plain' })); a.download = `esercizio-${g.inst.template}-${root.querySelector('#seed').value}.cir`; document.body.append(a); a.click(); a.remove(); });
  await typeset(root.querySelector('#out'));
});
await typeset(root);
