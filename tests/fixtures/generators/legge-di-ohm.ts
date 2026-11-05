/** Generatore del corso finto "esempio" (solo build delle fixture e test). */
import { registerGenerator } from '../../../src/engine/generators/registry';
import { createRng } from '../../../src/engine/random';

export default registerGenerator({
  id: 'esempio/legge-di-ohm',
  topic: 'resistori',
  objectives: ['resistori.1'],
  generate(seed, lang) {
    const r = createRng(seed);
    const R = r.int(1, 10) * 100;
    const I = r.int(1, 9) / 1000;
    const V = Math.round(R * I * 1000) / 1000;
    const it = lang === 'it';
    return {
      statement: it
        ? `Calcola la tensione ai capi di $R = ${R}\\,\\Omega$ percorsa da $I = ${I}$ A.`
        : `Find the voltage across $R = ${R}\\,\\Omega$ carrying $I = ${I}$ A.`,
      steps: [
        { title: it ? 'Legge di Ohm' : "Ohm's law", body: '$V = R\\,I$' },
        { title: it ? 'Calcolo' : 'Computation', body: `$V = ${R} \\cdot ${I} = ${V}$ V` },
      ],
      answer: [{ label: 'V', value: V, unit: 'V' }],
    };
  },
});
