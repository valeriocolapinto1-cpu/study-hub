/**
 * Primitive IEEE 754 a singola precisione.
 *
 * La codifica non è ricalcolata a mano: si passa per un `DataView`, che applica
 * lo standard esattamente come farebbe l'hardware. Costruendo i quesiti a
 * partire dai **campi** e ricavandone poi il valore, il numero mostrato è
 * rappresentabile per costruzione e non c'è alcun arrotondamento di mezzo.
 */

export const BIAS = 127;
export const EXPONENT_BITS = 8;
export const MANTISSA_BITS = 23;

export interface Ieee754Fields {
  sign: 0 | 1;
  /** Esponente **polarizzato**, 8 bit: esponente reale + 127. */
  exponent: number;
  /** Mantissa su 23 bit, senza il bit implicito. */
  mantissa: number;
}

function view(): DataView {
  return new DataView(new ArrayBuffer(4));
}

/** Scompone un valore nei tre campi dello standard. */
export function encodeIeee754(value: number): Ieee754Fields {
  const dv = view();
  dv.setFloat32(0, value);
  const bits = dv.getUint32(0);
  return {
    sign: ((bits >>> 31) & 1) as 0 | 1,
    exponent: (bits >>> 23) & 0xff,
    mantissa: bits & 0x7fffff,
  };
}

/** Ricostruisce il valore dai tre campi. */
export function decodeIeee754({ sign, exponent, mantissa }: Ieee754Fields): number {
  const bits = ((sign << 31) | ((exponent & 0xff) << 23) | (mantissa & 0x7fffff)) >>> 0;
  const dv = view();
  dv.setUint32(0, bits);
  return dv.getFloat32(0);
}

/** I 32 bit in fila, senza separatori. */
export function fieldsToBits(fields: Ieee754Fields): string {
  return (
    String(fields.sign) +
    fields.exponent.toString(2).padStart(EXPONENT_BITS, '0') +
    fields.mantissa.toString(2).padStart(MANTISSA_BITS, '0')
  );
}

/** I 32 bit separati per campo: `1 10000001 1010…` */
export function fieldsToGroupedBits(fields: Ieee754Fields): string {
  const bits = fieldsToBits(fields);
  return [bits.slice(0, 1), bits.slice(1, 1 + EXPONENT_BITS), bits.slice(1 + EXPONENT_BITS)].join(
    ' ',
  );
}

export function bitsToFields(bits: string): Ieee754Fields {
  const clean = bits.replace(/[^01]/g, '').padStart(32, '0');
  return {
    sign: (clean[0] === '1' ? 1 : 0) as 0 | 1,
    exponent: Number.parseInt(clean.slice(1, 1 + EXPONENT_BITS), 2),
    mantissa: Number.parseInt(clean.slice(1 + EXPONENT_BITS), 2),
  };
}

/** Esponente reale, cioè al netto della polarizzazione. */
export function realExponent(fields: Ieee754Fields): number {
  return fields.exponent - BIAS;
}

/**
 * Numeri a virgola in stile italiano: 6.5 → «6,5».
 * I valori generati sono razionali diadici, quindi la rappresentazione
 * decimale è finita e `String()` la stampa per intero.
 */
export function fmtDecimal(value: number): string {
  return String(value).replace('.', ',');
}
