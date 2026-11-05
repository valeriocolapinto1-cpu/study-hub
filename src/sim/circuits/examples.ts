/**
 * Circuiti di esempio: pagina demo, test visivi e documentazione (docs/SIM.md).
 * Coprono le topologie che il layout automatico deve saper disegnare.
 */
import type { NetlistInput } from './netlist';

export const EXAMPLES = {
  partitore: {
    title: 'Partitore di tensione',
    elements: [
      { type: 'V', id: 'V1', a: 'in', b: '0', dc: 12 },
      { type: 'R', id: 'R1', a: 'in', b: 'out', value: '2k', show: { i: true } },
      { type: 'R', id: 'R2', a: 'out', b: '0', value: '1k', show: { v: 'v_{out}' } },
    ],
  },
  scala: {
    title: 'Rete a scala',
    elements: [
      { type: 'V', id: 'Vs', a: 'a', b: '0', dc: 10 },
      { type: 'R', id: 'R1', a: 'a', b: 'b', value: 100 },
      { type: 'R', id: 'R2', a: 'b', b: '0', value: 220 },
      { type: 'R', id: 'R3', a: 'b', b: 'c', value: 150 },
      { type: 'R', id: 'R4', a: 'c', b: '0', value: 330 },
      { type: 'R', id: 'R5', a: 'c', b: 'd', value: 68 },
      { type: 'C', id: 'C1', a: 'd', b: '0', value: '10u' },
    ],
  },
  rlcSerie: {
    title: 'RLC serie in regime sinusoidale',
    omega: 1000,
    elements: [
      { type: 'V', id: 'V1', a: 'a', b: '0', ac: { mag: 10, phase: 30 } },
      { type: 'R', id: 'R1', a: 'a', b: 'b', value: 10 },
      { type: 'L', id: 'L1', a: 'b', b: 'c', value: '10m' },
      { type: 'C', id: 'C1', a: 'c', b: '0', value: '100u', show: { v: true } },
    ],
  },
  ponte: {
    title: 'Ponte di Wheatstone',
    layout: { mode: 'bridge' },
    elements: [
      { type: 'V', id: 'V1', a: 'A', b: '0', dc: 10 },
      { type: 'R', id: 'R1', a: 'A', b: 'B', value: 100 },
      { type: 'R', id: 'R2', a: 'A', b: 'C', value: 200 },
      { type: 'R', id: 'R3', a: 'B', b: '0', value: 300 },
      { type: 'R', id: 'R4', a: 'C', b: '0', value: 600 },
      { type: 'R', id: 'R5', a: 'B', b: 'C', value: 50, show: { i: true } },
    ],
  },
  invertente: {
    title: 'Amplificatore invertente',
    elements: [
      { type: 'V', id: 'Vi', a: 'in', b: '0', dc: 1 },
      { type: 'R', id: 'R1', a: 'in', b: 'm', value: '1k' },
      { type: 'OA', id: 'U1', plus: '0', minus: 'm', out: 'out' },
      { type: 'R', id: 'Rf', a: 'm', b: 'out', value: '4.7k' },
      { type: 'R', id: 'RL', a: 'out', b: '0', value: '10k', show: { v: 'v_{o}' } },
    ],
  },
  integratore: {
    title: 'Integratore invertente con resistenza di retroazione',
    elements: [
      { type: 'V', id: 'Vi', a: 'in', b: '0', wave: { kind: 'step', after: 1 } },
      { type: 'R', id: 'R1', a: 'in', b: 'm', value: '10k' },
      { type: 'OA', id: 'U1', plus: '0', minus: 'm', out: 'out' },
      { type: 'C', id: 'Cf', a: 'm', b: 'out', value: '100n' },
      { type: 'R', id: 'Rf', a: 'm', b: 'out', value: '100k' },
    ],
  },
  trasformatore: {
    title: 'Trasformatore ideale con carico',
    omega: 314.159,
    elements: [
      { type: 'V', id: 'V1', a: 'p', b: '0', ac: 230 },
      { type: 'R', id: 'Rs', a: 'p', b: 'q', value: 2 },
      { type: 'T', id: 'T1', p1a: 'q', p1b: '0', p2a: 's', p2b: '0', n: 10 },
      { type: 'R', id: 'RL', a: 's', b: '0', value: 4 },
    ],
  },
  accoppiati: {
    title: 'Induttori accoppiati',
    omega: 100,
    elements: [
      { type: 'V', id: 'V1', a: 'p', b: '0', ac: 1 },
      { type: 'R', id: 'R1', a: 'p', b: 'q', value: 5 },
      { type: 'L', id: 'L1', a: 'q', b: '0', value: 0.2 },
      { type: 'L', id: 'L2', a: 's', b: '0', value: 0.5 },
      { type: 'K', id: 'K1', l1: 'L1', l2: 'L2', k: 0.6 },
      { type: 'R', id: 'RL', a: 's', b: '0', value: 30 },
    ],
  },
  pilotato: {
    title: 'Generatore di corrente pilotato in tensione',
    elements: [
      { type: 'V', id: 'V1', a: 'a', b: '0', dc: 5 },
      { type: 'R', id: 'R1', a: 'a', b: 'x', value: 1 },
      { type: 'R', id: 'R2', a: 'x', b: '0', value: 2 },
      { type: 'G', id: 'G1', a: 'y', b: '0', cp: 'x', cn: '0', gain: 0.5 },
      { type: 'R', id: 'R3', a: 'x', b: 'y', value: 4 },
      { type: 'R', id: 'RL', a: 'y', b: '0', value: 3 },
    ],
  },
  transitorioRC: {
    title: 'Transitorio RC con interruttore',
    elements: [
      { type: 'V', id: 'V1', a: 'a', b: '0', dc: 10 },
      { type: 'SW', id: 'S1', a: 'a', b: 'b', closed: false, toggleAt: 0 },
      { type: 'R', id: 'R1', a: 'b', b: 'c', value: '1k' },
      { type: 'C', id: 'C1', a: 'c', b: '0', value: '1u', show: { v: 'v_C' } },
    ],
  },
  thevenin: {
    title: 'Equivalente di Thévenin ai morsetti A–B',
    ports: [{ id: 'AB', plus: 'c', minus: '0', label: 'A–B' }],
    elements: [
      { type: 'V', id: 'V1', a: 'a', b: '0', dc: 12 },
      { type: 'R', id: 'R1', a: 'a', b: 'b', value: 4 },
      { type: 'R', id: 'R2', a: 'b', b: '0', value: 12 },
      { type: 'I', id: 'I1', a: '0', b: 'b', dc: 1 },
      { type: 'R', id: 'R3', a: 'b', b: 'c', value: 2 },
    ],
  },
  doppioBipolo: {
    title: 'Doppio bipolo descritto dalla matrice Z',
    elements: [
      { type: 'V', id: 'V1', a: 'i', b: '0', dc: 10 },
      { type: 'R', id: 'Rs', a: 'i', b: 'p', value: 1 },
      {
        type: 'P',
        id: 'P1',
        p1a: 'p',
        p1b: '0',
        p2a: 'o',
        p2b: '0',
        kind: 'Z',
        m: [
          [4, 3],
          [3, 5],
        ],
      },
      { type: 'R', id: 'RL', a: 'o', b: '0', value: 7 },
    ],
  },
  manuale: {
    title: 'Layout manuale: RC con generatore di corrente',
    elements: [
      { type: 'I', id: 'I1', a: '0', b: 'n', dc: '2m', at: { x: 0, y: 4, dir: 'up', label: 'left' } },
      { type: 'R', id: 'R1', a: 'n', b: '0', value: '1k', at: { x: 5, y: 0, dir: 'down' } },
      { type: 'C', id: 'C1', a: 'n', b: '0', value: '1u', at: { x: 10, y: 0, dir: 'down' } },
    ],
  },
} satisfies Record<string, NetlistInput>;

export type ExampleId = keyof typeof EXAMPLES;
