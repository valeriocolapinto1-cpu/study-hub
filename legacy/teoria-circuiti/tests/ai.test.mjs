import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, extractText, callAI, parseGrading, buildGradingPrompt, AIError, DEFAULTS, MAX_INPUT_CHARS, explainMistake } from '../assets/js/grader/ai-adapter.js';

const rub = { max: 10, criteri: [{ id: 'a', desc: 'x', peso: 6 }, { id: 'b', desc: 'y', peso: 4 }] };
const cfg = (provider = 'anthropic') => ({ ...DEFAULTS, provider, openai: { ...DEFAULTS.openai, model: 'm' } });
const resp = (body, ok = true, status = 200) => ({ ok, status, json: async () => body, text: async () => JSON.stringify(body) });

test('richiesta Anthropic: endpoint, chiave, versione, intestazione del browser configurabile', () => {
  const { url, init } = buildRequest(cfg(), 'KEY', 'sys', 'usr');
  assert.equal(url, 'https://api.anthropic.com/v1/messages');
  assert.equal(init.headers['x-api-key'], 'KEY');
  assert.ok(init.headers['anthropic-version']);
  assert.equal(init.headers['anthropic-dangerous-direct-browser-access'], 'true');
  const b = JSON.parse(init.body); assert.equal(b.system, 'sys'); assert.equal(b.messages[0].role, 'user'); assert.ok(b.max_tokens > 0); assert.ok(b.model);
  const c2 = cfg(); c2.anthropic = { ...c2.anthropic, browserHeader: '' };
  assert.ok(!('anthropic-dangerous-direct-browser-access' in buildRequest(c2, 'K', 's', 'u').init.headers));
});

test('richiesta OpenAI-compatibile: base URL e modello configurabili, modello obbligatorio', () => {
  const c = cfg('openai'); c.openai.baseUrl = 'https://example.org/v1/';
  const { url, init } = buildRequest(c, 'K', 's', 'u');
  assert.equal(url, 'https://example.org/v1/chat/completions');
  assert.equal(init.headers.authorization, 'Bearer K');
  const c2 = cfg('openai'); c2.openai.model = '';
  assert.throws(() => buildRequest(c2, 'K', 's', 'u'), AIError);
});

test('estrazione del testo per i due provider', () => {
  assert.equal(extractText(cfg(), { content: [{ type: 'text', text: 'ciao' }] }), 'ciao');
  assert.equal(extractText(cfg('openai'), { choices: [{ message: { content: 'ciao' } }] }), 'ciao');
  assert.ok(!extractText(cfg(), {}));
});

test('callAI: senza chiave rifiuta; errori HTTP, CORS/rete e formato sono classificati', async () => {
  await assert.rejects(callAI('s', 'u', { cfg: cfg(), key: null }), (e) => e.kind === 'config');
  await assert.rejects(callAI('s', 'u', { cfg: cfg(), key: 'k', fetchImpl: async () => resp({}, false, 401) }), (e) => e.kind === 'http' && /401/.test(e.message));
  await assert.rejects(callAI('s', 'u', { cfg: cfg(), key: 'k', fetchImpl: async () => { throw new TypeError('Failed to fetch'); } }), (e) => e.kind === 'cors' && /CORS/.test(e.message));
  await assert.rejects(callAI('s', 'u', { cfg: cfg(), key: 'k', fetchImpl: async () => resp({}) }), (e) => e.kind === 'formato');
  const ok = await callAI('s', 'u', { cfg: cfg(), key: 'k', fetchImpl: async () => resp({ content: [{ type: 'text', text: 'ok' }] }) });
  assert.equal(ok, 'ok');
});

test('callAI: timeout', async () => {
  const c = { ...cfg(), timeoutMs: 20 };
  const slow = (url, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => { const e = new Error('abort'); e.name = 'AbortError'; rej(e); }));
  await assert.rejects(callAI('s', 'u', { cfg: c, key: 'k', fetchImpl: slow }), (e) => e.kind === 'timeout');
});

test('parseGrading: JSON valido accettato, anche con testo attorno; non conforme rifiutato', () => {
  const good = '{"criteria":[{"id":"a","awarded":6,"max":6,"comment":"ok"},{"id":"b","awarded":2,"max":4,"comment":"x"}],"total":8,"feedback":"bene","errors":[]}';
  const r = parseGrading('Ecco:\n' + good, rub);
  assert.equal(r.total, 8);
  for (const bad of ['niente json', '{"criteria":"x"}', '{"criteria":[{"id":"zz","awarded":1,"max":1,"comment":""}],"total":1,"feedback":""}', '{"criteria":[{"id":"a","awarded":9,"max":6,"comment":""}],"total":9,"feedback":""}', '{"criteria":[],"total":"3","feedback":""}']) {
    assert.throws(() => parseGrading(bad, rub), AIError, bad);
  }
  // totale incoerente → ricalcolato dalla somma dei criteri
  assert.equal(parseGrading('{"criteria":[{"id":"a","awarded":3,"max":6,"comment":""}],"total":10,"feedback":""}', rub).total, 3);
});

test('prompt: contiene domanda, rubrica e risposta delimitata; la risposta è troncata', () => {
  const p = buildGradingPrompt('Q?', rub, 'x'.repeat(MAX_INPUT_CHARS + 500));
  assert.ok(p.includes('Q?') && p.includes('id=a') && p.includes('<<<'));
  assert.ok(p.length < MAX_INPUT_CHARS + 700);
});

test('«Spiega il mio errore»: la soluzione corretta del motore viene passata come riferimento', async () => {
  let sent;
  const f = async (url, init) => { sent = JSON.parse(init.body); return resp({ content: [{ type: 'text', text: 'spiegazione' }] }); };
  const out = await explainMistake({ testo: 'T', passiCorretti: ['K=6', 'tau=4'], rispostaUtente: '5e^(-t)' }, { cfg: cfg(), key: 'k', fetchImpl: f });
  assert.equal(out, 'spiegazione');
  assert.ok(sent.messages[0].content.includes('K=6') && /non ricalcolarla/.test(sent.system));
});
