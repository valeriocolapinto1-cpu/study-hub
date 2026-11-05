import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { addTwos, cleanBin, cp2Valid, fromBinCP2, rangeFor, toBin, toHex } from '~/engine/numeric';

const WIDTHS = [4, 8, 16, 32] as const;

function OutBox({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}): JSX.Element {
  return (
    <div class={`out-box${warn ? ' warn' : ''}`}>
      <div class="ol">{label}</div>
      <div class="ov">{value}</div>
    </div>
  );
}

/** Raggruppa i bit a quattro a quattro: 11110110 → 1111 0110 */
function groupBits(bits: string): string {
  return bits.replace(/(.{4})(?=.)/g, '$1 ');
}

function Converter(): JSX.Element {
  const [decimal, setDecimal] = useState('-10');
  const [bits, setBits] = useState(8);

  const value = Number.parseInt(decimal, 10);
  const valid = Number.isFinite(value);
  const fits = valid && cp2Valid(value, bits);
  const unsigned = valid ? ((value % 2 ** bits) + 2 ** bits) % 2 ** bits : 0;

  return (
    <div class="tool" style="margin-top:20px">
      <h3>Convertitore &amp; complemento a 2</h3>
      <div class="th-ref">Rappresentazione dei numeri con segno</div>
      <div class="field">
        <label for="cv-dec">Decimale</label>
        <input
          id="cv-dec"
          type="number"
          style="width:120px"
          value={decimal}
          onInput={(event) => setDecimal((event.target as HTMLInputElement).value)}
        />
        <label for="cv-bits">Bit</label>
        <select
          id="cv-bits"
          value={String(bits)}
          onChange={(event) => setBits(Number((event.target as HTMLSelectElement).value))}
        >
          {WIDTHS.map((width) => (
            <option key={width} value={String(width)}>
              {width}
            </option>
          ))}
        </select>
      </div>
      {valid && (
        <div class="out-grid">
          <OutBox label={`CP2 (${bits} bit)`} value={groupBits(toBin(value, bits))} />
          <OutBox label="Esadecimale" value={`0x${toHex(unsigned, Math.ceil(bits / 4))}`} />
          <OutBox label="Nell'intervallo?" value={fits ? 'sì' : 'OVERFLOW'} warn={!fits} />
        </div>
      )}
    </div>
  );
}

function Adder(): JSX.Element {
  const [a, setA] = useState('0110');
  const [b, setB] = useState('0101');

  const cleanA = cleanBin(a);
  const cleanB = cleanBin(b);
  const ready = cleanA.length > 0 && cleanB.length > 0;

  // L'ampiezza si deduce dagli operandi RIPULITI. Il prototipo la leggeva dal
  // valore grezzo, quindi uno spazio o una lettera gonfiava il numero di bit
  // e falsava il flag di overflow.
  const bits = Math.min(32, Math.max(cleanA.length, cleanB.length, 4));

  const left = ready ? fromBinCP2(cleanA, bits) : 0;
  const right = ready ? fromBinCP2(cleanB, bits) : 0;
  const sum = ready ? addTwos(left, right, bits) : null;

  return (
    <div class="tool">
      <h3>Sommatore binario con flag di overflow</h3>
      <div class="th-ref">
        Aritmetica in complemento a 2 · overflow ⇔ XOR dei riporti sul bit di
        segno
      </div>
      <div class="field">
        <label for="add-a">A (CP2)</label>
        <input
          id="add-a"
          type="text"
          style="width:130px"
          inputMode="numeric"
          autocomplete="off"
          value={a}
          onInput={(event) => setA((event.target as HTMLInputElement).value)}
        />
        <label for="add-b">B (CP2)</label>
        <input
          id="add-b"
          type="text"
          style="width:130px"
          inputMode="numeric"
          autocomplete="off"
          value={b}
          onInput={(event) => setB((event.target as HTMLInputElement).value)}
        />
      </div>
      {sum && (
        <div class="out-grid">
          <OutBox
            label={`A + B (decimale, ${bits} bit)`}
            value={`${left} + ${right} = ${left + right}`}
          />
          <OutBox label={`Risultato (${bits} bit)`} value={groupBits(sum.binary)} />
          <OutBox
            label="Flag overflow"
            value={sum.overflow ? '1 · OVERFLOW' : '0'}
            warn={sum.overflow}
          />
          {/* Tenuto distinto dall'overflow: confonderli è la trappola classica. */}
          <OutBox label="Riporto uscente" value={sum.carryOut ? '1' : '0'} />
        </div>
      )}
    </div>
  );
}

function RangeTool(): JSX.Element {
  const [bits, setBits] = useState(8);
  const valid = Number.isInteger(bits) && bits >= 1 && bits <= 32;
  const unsigned = valid ? rangeFor(bits, false) : null;
  const signed = valid ? rangeFor(bits, true) : null;

  return (
    <div class="tool">
      <h3>Range rappresentabile</h3>
      <div class="th-ref">Interi con e senza segno</div>
      <div class="field">
        <label for="rg-bits">Bit (1–32)</label>
        <input
          id="rg-bits"
          type="number"
          min={1}
          max={32}
          style="width:90px"
          value={String(bits)}
          onInput={(event) => setBits(Number((event.target as HTMLInputElement).value))}
        />
      </div>
      {unsigned && signed && (
        <div class="out-grid">
          <OutBox label="Senza segno" value={`0 … ${unsigned.max}`} />
          <OutBox label="CP2" value={`${signed.min} … ${signed.max}`} />
          <OutBox label="CP1 / modulo-segno" value={`±${signed.max}`} />
        </div>
      )}
    </div>
  );
}

/**
 * I vecchi «strumenti»: calcolano al posto tuo, quindi non allenano. Restano
 * in fondo alla pagina di allenamento come banco di verifica — utili per
 * controllare un conto già fatto a mano, non per farlo al posto tuo.
 */
export function Converters(): JSX.Element {
  return (
    <>
      <Adder />
      <Converter />
      <RangeTool />
    </>
  );
}
