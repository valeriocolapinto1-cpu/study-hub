import { describe, expect, it } from 'vitest';
import { Complex } from '../../src/sim/circuits/complex';
import {
  ac,
  dc,
  firstOrder,
  maxPower,
  steadyState,
  sweep,
  thevenin,
  transfer,
  transient,
} from '../../src/sim/circuits/mna';
import type { NetlistInput } from '../../src/sim/circuits/netlist';

const close = (a: number, b: number, rel = 1e-9, abs = 1e-9): void => {
  expect(Math.abs(a - b)).toBeLessThanOrEqual(abs + rel * Math.max(Math.abs(a), Math.abs(b)));
};
const cclose = (a: Complex, b: Complex, rel = 1e-9): void => {
  expect(a.approxEq(b, rel, 1e-9)).toBe(true);
};

describe('MNA in continua', () => {
  it('partitore di tensione', () => {
    const s = dc({
      elements: [
        { type: 'V', id: 'V1', a: 'in', b: '0', dc: 12 },
        { type: 'R', id: 'R1', a: 'in', b: 'out', value: '2k' },
        { type: 'R', id: 'R2', a: 'out', b: 'gnd', value: '1k' },
      ],
    });
    close(s.v('out'), 4);
    close(s.i('R1'), 4e-3);
    // il generatore eroga: corrente da a verso b negativa (utilizzatori)
    close(s.i('V1'), -4e-3);
    close(s.power('V1'), -48e-3);
    close(s.power('R1') + s.power('R2'), 48e-3);
    close(s.powerBalance(), 0, 0, 1e-12);
  });

  it('partitore di corrente con generatore di corrente', () => {
    const s = dc({
      elements: [
        { type: 'I', id: 'I1', a: '0', b: 'n', dc: 3 },
        { type: 'R', id: 'R1', a: 'n', b: '0', value: 6 },
        { type: 'R', id: 'R2', a: 'n', b: '0', value: 3 },
      ],
    });
    close(s.v('n'), 6);
    close(s.i('R1'), 1);
    close(s.i('R2'), 2);
    close(s.powerBalance(), 0, 0, 1e-12);
  });

  it('ponte di Wheatstone: equilibrio e corrente nel galvanometro', () => {
    const bridge = (r4: number): NetlistInput => ({
      elements: [
        { type: 'V', id: 'V1', a: 'A', b: '0', dc: 10 },
        { type: 'R', id: 'R1', a: 'A', b: 'B', value: 100 },
        { type: 'R', id: 'R2', a: 'A', b: 'C', value: 200 },
        { type: 'R', id: 'R3', a: 'B', b: '0', value: 300 },
        { type: 'R', id: 'R4', a: 'C', b: '0', value: r4 },
        { type: 'R', id: 'R5', a: 'B', b: 'C', value: 50 },
      ],
    });
    close(dc(bridge(600)).i('R5'), 0, 0, 1e-12);
    // fuori equilibrio: confronto con Thévenin visto dal ramo R5
    const s = dc(bridge(400));
    const vth = (10 * 300) / 400 - (10 * 400) / 600;
    const rth = (100 * 300) / 400 + (200 * 400) / 600;
    close(s.i('R5'), vth / (rth + 50));
  });

  it('nodo flottante tra due condensatori in serie: gmin come in SPICE', () => {
    const s = dc({
      elements: [
        { type: 'V', id: 'V1', a: 'a', b: '0', dc: 5 },
        { type: 'C', id: 'C1', a: 'a', b: 'm', value: 1e-6 },
        { type: 'C', id: 'C2', a: 'm', b: '0', value: 1e-6 },
      ],
    });
    expect(Number.isFinite(s.v('m'))).toBe(true);
  });

  it('generatori pilotati: VCVS, VCCS, CCVS, CCCS', () => {
    // VCVS: v(o) = 3 v(x), con v(x) = 2
    const e = dc({
      elements: [
        { type: 'V', id: 'V1', a: 'x', b: '0', dc: 2 },
        { type: 'E', id: 'E1', a: 'o', b: '0', cp: 'x', cn: '0', gain: 3 },
        { type: 'R', id: 'RL', a: 'o', b: '0', value: 10 },
      ],
    });
    close(e.v('o'), 6);
    // VCCS: i(a→b) = g v(x): corrente iniettata in o (a=0, b=o) su 5 Ω
    const g = dc({
      elements: [
        { type: 'V', id: 'V1', a: 'x', b: '0', dc: 2 },
        { type: 'G', id: 'G1', a: '0', b: 'o', cp: 'x', cn: '0', gain: 0.5 },
        { type: 'R', id: 'RL', a: 'o', b: '0', value: 5 },
      ],
    });
    close(g.v('o'), 5);
    // CCVS controllata dalla corrente in un resistore (senza incognita propria)
    const h = dc({
      elements: [
        { type: 'V', id: 'V1', a: 'x', b: '0', dc: 4 },
        { type: 'R', id: 'R1', a: 'x', b: '0', value: 2 },
        { type: 'H', id: 'H1', a: 'o', b: '0', ctrl: 'R1', gain: 7 },
        { type: 'R', id: 'RL', a: 'o', b: '0', value: 1 },
      ],
    });
    close(h.v('o'), 14);
    // CCCS: i(a→b) = 2 i(V1)
    const f = dc({
      elements: [
        { type: 'V', id: 'V1', a: 'x', b: '0', dc: 1 },
        { type: 'R', id: 'R1', a: 'x', b: '0', value: 1 },
        { type: 'F', id: 'F1', a: 'o', b: '0', ctrl: 'R1', gain: 2 },
        { type: 'R', id: 'RL', a: 'o', b: '0', value: 3 },
      ],
    });
    // 2 A da o verso massa dentro il generatore: v(o) = −6
    close(f.v('o'), -6);
    close(f.powerBalance(), 0, 0, 1e-12);
  });

  it('amplificatore operazionale ideale: invertente e non invertente', () => {
    const inv = dc({
      elements: [
        { type: 'V', id: 'Vi', a: 'in', b: '0', dc: 1 },
        { type: 'R', id: 'R1', a: 'in', b: 'm', value: '1k' },
        { type: 'R', id: 'Rf', a: 'm', b: 'out', value: '4.7k' },
        { type: 'OA', id: 'U1', plus: '0', minus: 'm', out: 'out' },
      ],
    });
    close(inv.v('out'), -4.7);
    close(inv.v('m'), 0, 0, 1e-12);
    const non = dc({
      elements: [
        { type: 'V', id: 'Vi', a: 'in', b: '0', dc: 1 },
        { type: 'R', id: 'R1', a: 'm', b: '0', value: '1k' },
        { type: 'R', id: 'Rf', a: 'm', b: 'out', value: '9k' },
        { type: 'OA', id: 'U1', plus: 'in', minus: 'm', out: 'out' },
        { type: 'R', id: 'RL', a: 'out', b: '0', value: 100 },
      ],
    });
    close(non.v('out'), 10);
    // guadagno finito: tende al valore ideale
    const fin = dc({
      elements: [
        { type: 'V', id: 'Vi', a: 'in', b: '0', dc: 1 },
        { type: 'R', id: 'R1', a: 'm', b: '0', value: '1k' },
        { type: 'R', id: 'Rf', a: 'm', b: 'out', value: '9k' },
        { type: 'OA', id: 'U1', plus: 'in', minus: 'm', out: 'out', gain: 1e5 },
      ],
    });
    close(fin.v('out'), 10 / (1 + 10 / 1e5), 1e-9);
  });

  it('nullore equivalente all’op-amp', () => {
    const s = dc({
      elements: [
        { type: 'V', id: 'Vi', a: 'in', b: '0', dc: 2 },
        { type: 'R', id: 'R1', a: 'in', b: 'x', value: 1 },
        { type: 'R', id: 'Rf', a: 'x', b: 'y', value: 3 },
        { type: 'N', id: 'N1', na: 'x', nb: '0', ra: 'y', rb: '0' },
      ],
    });
    close(s.v('y'), -6);
  });

  it('trasformatore ideale: impedenza riportata n²RL e potenza nulla', () => {
    const s = dc({
      elements: [
        { type: 'V', id: 'V1', a: 'p', b: '0', dc: 10 },
        { type: 'T', id: 'T1', p1a: 'p', p1b: '0', p2a: 's', p2b: '0', n: 2 },
        { type: 'R', id: 'RL', a: 's', b: '0', value: 5 },
      ],
    });
    close(s.v('s'), 5);
    close(-s.i('V1'), 10 / (4 * 5));
    close(s.power('T1'), 0, 0, 1e-12);
    close(s.i('T1', 1), -s.i('T1', 2) / 2);
  });

  it('doppio bipolo Z, Y, H, ABCD descrivono la stessa rete a T', () => {
    // rete a T: Ra = 1, Rb = 2 (serie), Rc = 3 (derivazione)
    const z: [[number, number], [number, number]] = [
      [4, 3],
      [3, 5],
    ];
    const det = 4 * 5 - 9;
    const y: [[number, number], [number, number]] = [
      [5 / det, -3 / det],
      [-3 / det, 4 / det],
    ];
    const h: [[number, number], [number, number]] = [
      [det / 5, 3 / 5],
      [-3 / 5, 1 / 5],
    ];
    const t: [[number, number], [number, number]] = [
      [4 / 3, det / 3],
      [1 / 3, 5 / 3],
    ];
    const ref = dc({
      elements: [
        { type: 'V', id: 'V1', a: 'i', b: '0', dc: 10 },
        { type: 'R', id: 'Ra', a: 'i', b: 'c', value: 1 },
        { type: 'R', id: 'Rb', a: 'c', b: 'o', value: 2 },
        { type: 'R', id: 'Rc', a: 'c', b: '0', value: 3 },
        { type: 'R', id: 'RL', a: 'o', b: '0', value: 7 },
      ],
    }).v('o');
    for (const [kind, m] of [
      ['Z', z],
      ['Y', y],
      ['H', h],
      ['ABCD', t],
    ] as const) {
      const s = dc({
        elements: [
          { type: 'V', id: 'V1', a: 'i', b: '0', dc: 10 },
          { type: 'P', id: 'P1', p1a: 'i', p1b: '0', p2a: 'o', p2b: '0', kind, m },
          { type: 'R', id: 'RL', a: 'o', b: '0', value: 7 },
        ],
      });
      close(s.v('o'), ref, 1e-9);
    }
  });

  it('interruttore: lo stato dipende dall’istante richiesto', () => {
    const net: NetlistInput = {
      elements: [
        { type: 'V', id: 'V1', a: 'a', b: '0', dc: 10 },
        { type: 'R', id: 'R1', a: 'a', b: 'b', value: 1 },
        { type: 'R', id: 'R2', a: 'b', b: '0', value: 1 },
        { type: 'SW', id: 'S1', a: 'b', b: '0', closed: false, toggleAt: 0 },
      ],
    };
    close(dc(net).v('b'), 5);
    close(dc(net, { t: 1 }).v('b'), 0);
  });

  it('errore leggibile per una maglia di generatori di tensione', () => {
    expect(() =>
      dc({
        elements: [
          { type: 'V', id: 'V1', a: 'a', b: '0', dc: 1 },
          { type: 'V', id: 'V2', a: 'a', b: '0', dc: 2 },
        ],
      }),
    ).toThrow(/singolare/);
  });
});

describe('Thévenin, Norton, potenza massima', () => {
  const net: NetlistInput = {
    elements: [
      { type: 'V', id: 'V1', a: 'a', b: '0', dc: 12 },
      { type: 'R', id: 'R1', a: 'a', b: 'b', value: 4 },
      { type: 'R', id: 'R2', a: 'b', b: '0', value: 12 },
      { type: 'R', id: 'R3', a: 'b', b: 'c', value: 2 },
    ],
  };
  it('equivalente tra c e massa', () => {
    const eq = thevenin(net, 'c');
    close(eq.vth!.re, 9);
    close((eq.zth as Complex).re, 5);
    close(eq.isc!.re, 9 / 5);
  });
  it('con generatore pilotato (solo prova esterna)', () => {
    // VCVS con retroazione: Rth = R/(1+A) per un inseguitore con R in uscita
    const eq = thevenin(
      {
        elements: [
          { type: 'V', id: 'V1', a: 'i', b: '0', dc: 1 },
          { type: 'E', id: 'E1', a: 'x', b: '0', cp: 'i', cn: 'o', gain: 9 },
          { type: 'R', id: 'Ro', a: 'x', b: 'o', value: 10 },
        ],
      },
      'o',
    );
    close((eq.zth as Complex).re, 1);
    close(eq.vth!.re, 0.9);
  });
  it('generatore di corrente ideale: Norton senza Thévenin finito', () => {
    const eq = thevenin(
      {
        elements: [
          { type: 'I', id: 'I1', a: '0', b: 'x', dc: 2 },
          { type: 'R', id: 'R1', a: 'x', b: 'y', value: 3 },
        ],
      },
      'y',
    );
    expect(eq.zth).toBe(Infinity);
  });
  it('potenza massima in continua e in alternata', () => {
    close(maxPower(net, 'c').pmax, 81 / 20);
    const acNet: NetlistInput = {
      omega: 1000,
      elements: [
        { type: 'V', id: 'V1', a: 'a', b: '0', ac: { mag: 10, phase: 0 } },
        { type: 'R', id: 'R1', a: 'a', b: 'b', value: 50 },
        { type: 'L', id: 'L1', a: 'b', b: 'c', value: 0.1 },
      ],
    };
    const mp = maxPower(acNet, 'c');
    cclose(mp.zLoad, new Complex(50, -100));
    close(mp.pmax, 100 / (8 * 50));
    // verifica: carico coniugato → potenza attiva sul carico = pmax
    const loaded = ac({
      ...acNet,
      elements: [
        ...(acNet.elements as object[]),
        { type: 'R', id: 'RL', a: 'c', b: 'd', value: 50 },
        { type: 'C', id: 'CL', a: 'd', b: '0', value: 1 / (1000 * 100) },
      ],
    } as NetlistInput);
    close(loaded.power('RL').p, mp.pmax, 1e-9);
  });
});

describe('regime sinusoidale', () => {
  it('risonanza serie RLC', () => {
    const L = 10e-3;
    const C = 1e-6;
    const w0 = 1 / Math.sqrt(L * C);
    const s = ac({
      omega: w0,
      elements: [
        { type: 'V', id: 'V1', a: 'a', b: '0', ac: 1 },
        { type: 'R', id: 'R1', a: 'a', b: 'b', value: 10 },
        { type: 'L', id: 'L1', a: 'b', b: 'c', value: L },
        { type: 'C', id: 'C1', a: 'c', b: '0', value: C },
      ],
    });
    cclose(s.i('R1'), new Complex(0.1, 0));
    const Q = (w0 * L) / 10;
    close(s.vElement('L1').abs(), Q * 1, 1e-9);
    cclose(s.vElement('L1').add(s.vElement('C1')), Complex.ZERO);
    close(s.power('L1').p, 0, 0, 1e-12);
    close(s.power('L1').q + s.power('C1').q, 0, 0, 1e-9);
  });

  it('potenze attiva e reattiva, fasori di picco ed efficaci', () => {
    const elements = [
      { type: 'V' as const, id: 'V1', a: 'a', b: '0', ac: { mag: 100, phase: 0 } },
      { type: 'R' as const, id: 'R1', a: 'a', b: 'b', value: 3 },
      { type: 'L' as const, id: 'L1', a: 'b', b: '0', value: 4 },
    ];
    const peak = ac({ omega: 1, elements });
    // I = 100/(3+4j) → |I| = 20; P = ½·R·|I|² = 600, Q = ½·X·|I|² = 800
    close(peak.power('R1').p, 600);
    close(peak.power('L1').q, 800);
    close(peak.power('V1').p, -600);
    close(peak.power('V1').pf, -0.6);
    const rms = ac({ omega: 1, phasor: 'rms', elements });
    close(rms.power('R1').p, 1200);
    cclose(rms.powerBalance(), Complex.ZERO);
  });

  it('rifasamento a cos φ = 1 con la capacità da formulario', () => {
    const omega = 2 * Math.PI * 50;
    const Vrms = 230;
    const load = [
      { type: 'V' as const, id: 'V1', a: 'a', b: '0', ac: Vrms },
      { type: 'R' as const, id: 'R1', a: 'a', b: 'b', value: 8 },
      { type: 'L' as const, id: 'L1', a: 'b', b: '0', value: 0.02 },
    ];
    const before = ac({ omega, phasor: 'rms', elements: load });
    const P = before.power('R1').p;
    const phi1 = Math.atan((omega * 0.02) / 8);
    const C = (P * (Math.tan(phi1) - 0)) / (omega * Vrms ** 2);
    const after = ac({
      omega,
      phasor: 'rms',
      elements: [...load, { type: 'C' as const, id: 'Cr', a: 'a', b: '0', value: C }],
    });
    close(after.power('V1').pf, -1, 1e-9);
    close(after.power('Cr').q, -omega * C * Vrms ** 2, 1e-9);
  });

  it('induttori accoppiati: impedenza d’ingresso riflessa', () => {
    const w = 100;
    const L1 = 0.2;
    const L2 = 0.5;
    const k = 0.6;
    const M = k * Math.sqrt(L1 * L2);
    const R = 30;
    const s = ac({
      omega: w,
      elements: [
        { type: 'V', id: 'V1', a: 'p', b: '0', ac: 1 },
        { type: 'L', id: 'L1', a: 'p', b: '0', value: L1 },
        { type: 'L', id: 'L2', a: 's', b: '0', value: L2 },
        { type: 'K', id: 'K1', l1: 'L1', l2: 'L2', k },
        { type: 'R', id: 'RL', a: 's', b: '0', value: R },
      ],
    });
    const zin = new Complex(0, w * L1).add(new Complex(w * w * M * M, 0).div(new Complex(R, w * L2)));
    cclose(Complex.ONE.div(s.i('L1')), zin, 1e-9);
  });

  it('sovrapposizione di continua e due sinusoidi', () => {
    const net: NetlistInput = {
      elements: [
        { type: 'V', id: 'V1', a: 'a', b: '0', dc: 1, wave: { kind: 'sin', offset: 1, amp: 2, omega: 10 } },
        { type: 'I', id: 'I1', a: '0', b: 'b', wave: { kind: 'sin', amp: 1, omega: 20, phase: 90 } },
        { type: 'R', id: 'R1', a: 'a', b: 'b', value: 1 },
        { type: 'R', id: 'R2', a: 'b', b: '0', value: 1 },
      ],
    };
    const ss = steadyState(net);
    const t = 0.123;
    const expected = (1 + 2 * Math.cos(10 * t)) / 2 + 0.5 * Math.cos(20 * t + Math.PI / 2);
    close(ss.v('b', t), expected, 1e-9);
    expect(ss.harmonics).toHaveLength(2);
  });
});

describe('funzione di trasferimento', () => {
  it('passa-basso RC: −3 dB e −45° alla pulsazione di taglio', () => {
    const net: NetlistInput = {
      elements: [
        { type: 'V', id: 'Vin', a: 'i', b: '0', ac: 1 },
        { type: 'R', id: 'R1', a: 'i', b: 'o', value: '1k' },
        { type: 'C', id: 'C1', a: 'o', b: '0', value: '1u' },
      ],
    };
    const wc = 1000;
    const H = transfer(net, 'Vin', { v: 'o' }, wc);
    close(20 * Math.log10(H.abs()), -10 * Math.log10(2), 1e-9);
    close(H.argDeg(), -45, 1e-9);
    const sw = sweep(net, 'Vin', { v: 'o' }, { omegaMin: 1, omegaMax: 1e7, points: 71 });
    expect(sw.omega).toHaveLength(71);
    // −20 dB/decade lontano dal taglio
    close(sw.magDb[70]! - sw.magDb[60]!, -20, 1e-3);
    close(sw.phaseDeg[70]!, -90, 1e-3);
  });
  it('fase srotolata per un filtro del 3° ordine', () => {
    const net: NetlistInput = {
      elements: [
        { type: 'V', id: 'Vin', a: 'i', b: '0', ac: 1 },
        { type: 'R', id: 'R1', a: 'i', b: 'x', value: 1 },
        { type: 'C', id: 'C1', a: 'x', b: '0', value: 1 },
        { type: 'E', id: 'B1', a: 'x2', b: '0', cp: 'x', cn: '0', gain: 1 },
        { type: 'R', id: 'R2', a: 'x2', b: 'y', value: 1 },
        { type: 'C', id: 'C2', a: 'y', b: '0', value: 1 },
        { type: 'E', id: 'B2', a: 'y2', b: '0', cp: 'y', cn: '0', gain: 1 },
        { type: 'R', id: 'R3', a: 'y2', b: 'z', value: 1 },
        { type: 'C', id: 'C3', a: 'z', b: '0', value: 1 },
      ],
    };
    const sw = sweep(net, 'Vin', { v: 'z' }, { omegaMin: 0.01, omegaMax: 1000, points: 100 });
    close(sw.phaseDeg[99]!, -270, 1e-3);
  });
});

describe('transitori', () => {
  it('carica RC: numerico (trapezi) contro forma chiusa', () => {
    const net: NetlistInput = {
      elements: [
        { type: 'V', id: 'V1', a: 'a', b: '0', wave: { kind: 'step', before: 0, after: 5, at: 0 } },
        { type: 'R', id: 'R1', a: 'a', b: 'b', value: '1k' },
        { type: 'C', id: 'C1', a: 'b', b: '0', value: '1u' },
      ],
    };
    const tau = 1e-3;
    const tr = transient(net, { tEnd: 5 * tau, dt: tau / 200 });
    const v = tr.v('b');
    for (const tq of [0, tau / 2, tau, 3 * tau]) close(tr.at(v, tq), 5 * (1 - Math.exp(-tq / tau)), 0, 1e-4);
    // corrente a 0⁺: salto a V/R
    close(tr.i('C1')[0]!, 5e-3, 1e-9);
    const fo = firstOrder(net);
    close(fo.tau, tau);
    close(fo.at(tau), 5 * (1 - Math.exp(-1)));
  });

  it('RL con interruttore che si apre: forma chiusa e numerico', () => {
    const net: NetlistInput = {
      elements: [
        { type: 'V', id: 'V1', a: 'a', b: '0', dc: 10 },
        { type: 'R', id: 'R1', a: 'a', b: 'b', value: 10 },
        { type: 'SW', id: 'S1', a: 'b', b: 'c', closed: true, toggleAt: 0 },
        { type: 'R', id: 'R2', a: 'b', b: 'c', value: 30 },
        { type: 'L', id: 'L1', a: 'c', b: '0', value: 0.4 },
      ],
    };
    const fo = firstOrder(net);
    close(fo.y0, 1); // iL(0⁻) = 10/10
    close(fo.yss(0), 0.25);
    close(fo.tau, 0.4 / 40);
    const out = firstOrder(net, { v: 'c' });
    // v_L(0⁺) = 10 − 40·1 = −30
    close(out.y0, -30, 1e-9);
    const tr = transient(net, { tEnd: 0.05, dt: 1e-5 });
    const iL = tr.i('L1');
    for (const tq of [0, 0.005, 0.01, 0.03]) close(tr.at(iL, tq), fo.at(tq), 0, 1e-5);
  });

  it('RLC serie sottosmorzato (2° ordine) contro soluzione analitica', () => {
    const R = 2;
    const L = 1;
    const C = 0.25;
    const net: NetlistInput = {
      elements: [
        { type: 'V', id: 'V1', a: 'a', b: '0', wave: { kind: 'step', after: 1 } },
        { type: 'R', id: 'R1', a: 'a', b: 'b', value: R },
        { type: 'L', id: 'L1', a: 'b', b: 'c', value: L },
        { type: 'C', id: 'C1', a: 'c', b: '0', value: C },
      ],
    };
    const alpha = R / (2 * L);
    const w0 = 1 / Math.sqrt(L * C);
    const wd = Math.sqrt(w0 * w0 - alpha * alpha);
    const exact = (t: number): number =>
      1 - Math.exp(-alpha * t) * (Math.cos(wd * t) + (alpha / wd) * Math.sin(wd * t));
    const tr = transient(net, { tEnd: 10, dt: 1e-3 });
    const vc = tr.v('c');
    let maxErr = 0;
    for (let k = 0; k < tr.t.length; k += 50) maxErr = Math.max(maxErr, Math.abs(vc[k]! - exact(tr.t[k]!)));
    expect(maxErr).toBeLessThan(1e-5);
    // Eulero implicito: stabile ma meno accurato
    const be = transient(net, { tEnd: 10, dt: 1e-3, method: 'be' });
    expect(Math.abs(be.at(be.v('c'), 2) - exact(2))).toBeLessThan(5e-3);
  });

  it('caso misto: regime sinusoidale per t < 0, poi spento', () => {
    const net: NetlistInput = {
      omega: 2,
      elements: [
        { type: 'V', id: 'V1', a: 'a', b: '0', ac: { mag: 3, phase: 30 } },
        { type: 'SW', id: 'S1', a: 'a', b: 'b', closed: true, toggleAt: 0 },
        { type: 'R', id: 'R1', a: 'b', b: 'c', value: 1 },
        { type: 'C', id: 'C1', a: 'c', b: '0', value: 0.5 },
        { type: 'R', id: 'R2', a: 'c', b: '0', value: 1 },
      ],
    };
    const fo = firstOrder(net);
    // regime precedente: Vc = V·Z/(R1+Z), Z = R2 ∥ 1/(jωC)
    const V = Complex.polarDeg(3, 30);
    const Z = Complex.ONE.div(new Complex(1, 2 * 0.5));
    const Vc = V.mul(Z).div(Z.add(1));
    close(fo.y0, Vc.re, 1e-9);
    close(fo.tau, 1 * 0.5);
    const tr = transient(net, { tEnd: 3, dt: 1e-3 });
    for (const tq of [0, 0.25, 1, 2]) close(tr.at(tr.v('c'), tq), fo.at(tq), 0, 1e-5);
  });

  it('impulso e PWL: i fronti cadono sui campioni', () => {
    const tr = transient(
      {
        elements: [
          {
            type: 'V',
            id: 'V1',
            a: 'a',
            b: '0',
            wave: { kind: 'pulse', high: 1, delay: 0.1, width: 0.2, period: 1 },
          },
          { type: 'R', id: 'R1', a: 'a', b: '0', value: 1 },
        ],
      },
      { tEnd: 1.5, dt: 0.03 },
    );
    expect([...tr.t].some((t) => Math.abs(t - 0.1) < 1e-12)).toBe(true);
    expect([...tr.t].some((t) => Math.abs(t - 1.3) < 1e-12)).toBe(true);
    close(tr.at(tr.v('a'), 0.2), 1);
    close(tr.at(tr.v('a'), 0.5), 0);
  });

  it('trasformatore e induttori accoppiati nel tempo: conservazione dell’energia', () => {
    const tr = transient(
      {
        elements: [
          { type: 'V', id: 'V1', a: 'p', b: '0', wave: { kind: 'step', after: 1 } },
          { type: 'R', id: 'Rs', a: 'p', b: 'q', value: 1 },
          { type: 'L', id: 'L1', a: 'q', b: '0', value: 1 },
          { type: 'L', id: 'L2', a: 's', b: '0', value: 1 },
          { type: 'K', id: 'K1', l1: 'L1', l2: 'L2', k: 0.5 },
          { type: 'R', id: 'RL', a: 's', b: '0', value: 1 },
        ],
      },
      { tEnd: 20, dt: 1e-3 },
    );
    // regime: L1 in cortocircuito, nessuna variazione di flusso → i2 → 0
    close(tr.at(tr.i('L1'), 20), 1, 0, 1e-6);
    close(tr.at(tr.i('L2'), 20), 0, 0, 1e-6);
  });
});
