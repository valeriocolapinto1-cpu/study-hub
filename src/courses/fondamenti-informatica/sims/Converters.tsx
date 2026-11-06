/**
 * Convertitori del sito originale, rifatti come isola: decimale ↔ complemento
 * a 2 ed esadecimale, sommatore binario con i due flag separati, intervalli
 * rappresentabili. Un banco di verifica per gli esercizi fatti a mano.
 */
import { useState } from 'preact/hooks';
import { addTwos, cp2Valid, rangeFor, toBin, toHex } from '../lib/numeric';
import '../../../sim/sim.css';

type Lang = 'it' | 'en';
const L = (lang: Lang, it: string, en: string) => (lang === 'en' ? en : it);
const group = (s: string) => s.replace(/\B(?=(\d{4})+$)/g, ' ');

function parseInt10(s: string): number | null {
  const t = s.trim().replace(/^\+/, '').replace('−', '-');
  return /^-?\d+$/.test(t) ? Number(t) : null;
}

function BitsSelect(p: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  lang: Lang;
  options?: number[];
}) {
  return (
    <div class="field">
      <label class="field__label" for={p.id}>
        {L(p.lang, 'Numero di bit', 'Number of bits')}
      </label>
      <select
        id={p.id}
        class="select"
        value={p.value}
        onChange={(e) => p.onChange(Number(e.currentTarget.value))}
      >
        {(p.options ?? [4, 8, 12, 16, 32]).map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
    </div>
  );
}

function Out(p: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <dt>{p.label}</dt>
      <dd class="input--mono">{p.warn ? <span class="badge badge--danger">{p.value}</span> : p.value}</dd>
    </div>
  );
}

export function Cp2Converter({ lang }: { lang: Lang }) {
  const [text, setText] = useState('-45');
  const [bits, setBits] = useState(8);
  const n = parseInt10(text);
  const fits = n !== null && cp2Valid(n, bits);
  const unsigned = n !== null ? ((n % 2 ** bits) + 2 ** bits) % 2 ** bits : 0;
  return (
    <section class="sim" aria-labelledby="fi-cv-title">
      <h2 class="sim__title" id="fi-cv-title">
        {L(lang, 'Decimale → complemento a 2 ed esadecimale', "Decimal → two's complement and hexadecimal")}
      </h2>
      <div class="sim__panel">
        <div class="field">
          <label class="field__label" for="fi-cv-dec">
            {L(lang, 'Numero decimale', 'Decimal number')}
          </label>
          <input
            id="fi-cv-dec"
            class="input input--mono"
            inputMode="numeric"
            value={text}
            aria-invalid={n === null}
            aria-describedby="fi-cv-hint"
            onInput={(e) => setText(e.currentTarget.value)}
          />
          <span class="field__hint" id="fi-cv-hint">
            {L(lang, 'Intero, anche negativo.', 'Integer, possibly negative.')}
          </span>
        </div>
        <BitsSelect id="fi-cv-bits" value={bits} onChange={setBits} lang={lang} />
      </div>
      <dl class="facts" aria-live="polite">
        {n === null ? (
          <Out label={L(lang, 'Errore', 'Error')} value={L(lang, 'non è un intero', 'not an integer')} warn />
        ) : (
          <>
            <Out
              label={L(lang, `CP2 su ${bits} bit`, `${bits}-bit two's complement`)}
              value={group(toBin(n, bits))}
            />
            <Out
              label={L(lang, 'Esadecimale', 'Hexadecimal')}
              value={`0x${toHex(unsigned, Math.ceil(bits / 4))}`}
            />
            <Out
              label={L(lang, 'Nell’intervallo?', 'In range?')}
              value={fits ? L(lang, 'sì', 'yes') : L(lang, 'no: overflow', 'no: overflow')}
              warn={!fits}
            />
          </>
        )}
      </dl>
    </section>
  );
}

export function Adder({ lang }: { lang: Lang }) {
  const [a, setA] = useState('100');
  const [b, setB] = useState('45');
  const [bits, setBits] = useState(8);
  const na = parseInt10(a);
  const nb = parseInt10(b);
  const ok = na !== null && nb !== null;
  const r = ok ? addTwos(na, nb, bits) : null;
  return (
    <section class="sim" aria-labelledby="fi-add-title">
      <h2 class="sim__title" id="fi-add-title">
        {L(lang, 'Sommatore binario con i due flag', 'Binary adder with both flags')}
      </h2>
      <div class="sim__panel">
        <div class="field">
          <label class="field__label" for="fi-add-a">
            A
          </label>
          <input
            id="fi-add-a"
            class="input input--mono"
            inputMode="numeric"
            value={a}
            aria-invalid={na === null}
            onInput={(e) => setA(e.currentTarget.value)}
          />
        </div>
        <div class="field">
          <label class="field__label" for="fi-add-b">
            B
          </label>
          <input
            id="fi-add-b"
            class="input input--mono"
            inputMode="numeric"
            value={b}
            aria-invalid={nb === null}
            onInput={(e) => setB(e.currentTarget.value)}
          />
        </div>
        <BitsSelect id="fi-add-bits" value={bits} onChange={setBits} lang={lang} options={[4, 8, 16, 32]} />
      </div>
      <dl class="facts" aria-live="polite">
        {r && na !== null && nb !== null ? (
          <>
            <Out label="A" value={group(toBin(na, bits))} />
            <Out label="B" value={group(toBin(nb, bits))} />
            <Out label={L(lang, `A + B su ${bits} bit`, `A + B on ${bits} bits`)} value={group(r.binary)} />
            <Out
              label={L(lang, 'Valore letto in CP2', "Value read in two's complement")}
              value={String(r.sum)}
              warn={r.overflow}
            />
            <Out label={L(lang, 'Riporto uscente', 'Carry-out')} value={r.carryOut ? '1' : '0'} />
            <Out label="Overflow" value={r.overflow ? '1' : '0'} warn={r.overflow} />
          </>
        ) : (
          <Out
            label={L(lang, 'Errore', 'Error')}
            value={L(lang, 'servono due interi', 'two integers are needed')}
            warn
          />
        )}
      </dl>
      <p class="sim-note">
        {L(
          lang,
          'Il riporto uscente segnala un errore solo per i numeri senza segno; in complemento a 2 conta l’overflow, cioè lo XOR fra il riporto che entra nel bit di segno e quello che ne esce.',
          "The carry-out signals an error only for unsigned numbers; in two's complement what counts is overflow, i.e. the XOR between the carry into the sign bit and the one out of it.",
        )}
      </p>
    </section>
  );
}

export function RangeTable({ lang }: { lang: Lang }) {
  const [bits, setBits] = useState(8);
  const u = rangeFor(bits, false);
  const s = rangeFor(bits, true);
  return (
    <section class="sim" aria-labelledby="fi-rg-title">
      <h2 class="sim__title" id="fi-rg-title">
        {L(lang, 'Intervalli rappresentabili', 'Representable ranges')}
      </h2>
      <div class="sim__panel">
        <div class="field">
          <label class="field__label" for="fi-rg-bits">
            {L(lang, 'Numero di bit (1–32)', 'Number of bits (1–32)')}
          </label>
          <input
            id="fi-rg-bits"
            class="input input--mono"
            type="number"
            min={1}
            max={32}
            value={bits}
            onInput={(e) => {
              const v = Number(e.currentTarget.value);
              if (Number.isInteger(v) && v >= 1 && v <= 32) setBits(v);
            }}
          />
        </div>
      </div>
      <dl class="facts" aria-live="polite">
        <Out label={L(lang, 'Senza segno', 'Unsigned')} value={`0 … ${u.max}`} />
        <Out label={L(lang, 'Complemento a 2', "Two's complement")} value={`${s.min} … ${s.max}`} />
        <Out
          label={L(lang, 'CP1 e modulo e segno', "Ones' complement and sign-magnitude")}
          value={`±${s.max}`}
        />
      </dl>
    </section>
  );
}

export default function Converters({ lang }: { lang: Lang }) {
  return (
    <div style="display: grid; gap: var(--space-l)">
      <Cp2Converter lang={lang} />
      <Adder lang={lang} />
      <RangeTable lang={lang} />
    </div>
  );
}
