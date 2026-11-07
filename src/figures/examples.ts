/**
 * Esempi di ogni tipo di figura: alimentano il catalogo (/<lang>/stile/figure/)
 * e i test (validità, determinismo, colori, accessibilità). Aggiungendo un tipo
 * si aggiunge qui almeno un esempio.
 */
import type { DiagramSpec } from './schemas';

export interface DiagramExample {
  id: string;
  caption: { it: string; en: string };
  spec: DiagramSpec;
}

const ex = (id: string, it: string, en: string, spec: DiagramSpec): DiagramExample => ({
  id,
  caption: { it, en },
  spec,
});

export const EXAMPLES: DiagramExample[] = [
  // ---------------------------------------------------------------- meccanica
  ex('corpo-libero', 'Blocco trainato con attrito', 'Block pulled with friction', {
    type: 'free-body',
    params: {
      bodyLabel: 'm',
      ground: true,
      forces: [
        { label: 'mg', angle: 270, magnitude: 1.2, kind: 'weight' },
        { label: 'N', angle: 90, magnitude: 0.9, kind: 'normal' },
        { label: 'F', angle: 30, magnitude: 1.1, kind: 'applied' },
        { label: 'f_d', angle: 180, magnitude: 0.6, kind: 'friction' },
      ],
      acceleration: { angle: 0 },
    },
  }),
  ex('corpo-libero-assi', 'Punto materiale con assi ruotati', 'Point mass with rotated axes', {
    type: 'free-body',
    params: {
      body: 'point',
      axes: true,
      axesAngle: 30,
      forces: [
        { label: 'T_1', angle: 150, kind: 'tension' },
        { label: 'T_2', angle: 40, magnitude: 0.8, kind: 'tension' },
        { label: 'mg', angle: 270, magnitude: 1.1, kind: 'weight' },
      ],
    },
  }),
  ex(
    'piano-inclinato',
    'Piano inclinato con attrito e componenti del peso',
    'Rough incline with weight components',
    {
      type: 'inclined-plane',
      params: { angle: 30, friction: true, components: true, motion: 'down' },
    },
  ),
  ex(
    'piano-carrucola',
    'Piano inclinato con carrucola e massa sospesa',
    'Incline with pulley and hanging mass',
    {
      type: 'inclined-plane',
      params: {
        angle: 35,
        pulley: true,
        friction: true,
        motion: 'up',
        massLabel: 'm_1',
        hangingLabel: 'm_2',
      },
    },
  ),
  ex('molla', 'Molla orizzontale allungata', 'Stretched horizontal spring', {
    type: 'spring-mass',
    params: { displacement: 0.5 },
  }),
  ex('molla-verticale', 'Molla verticale con smorzatore', 'Vertical spring with damper', {
    type: 'spring-mass',
    params: { orientation: 'vertical', displacement: -0.4, damper: true },
  }),
  ex('pendolo', 'Pendolo con componenti del peso', 'Pendulum with weight components', {
    type: 'pendulum',
    params: { angle: 25, components: true },
  }),
  ex('proiettile', 'Lancio da terra a 50°', 'Launch from the ground at 50°', {
    type: 'projectile',
    params: { v0: 20, angle: 50, vectors: 4 },
  }),
  ex('proiettile-quota', 'Lancio orizzontale da 20 m', 'Horizontal launch from 20 m', {
    type: 'projectile',
    params: { v0: 12, angle: 0, h0: 20, vectors: 3, apex: false },
  }),
  ex('moto-circolare', 'Moto circolare non uniforme', 'Non-uniform circular motion', {
    type: 'circular-motion',
    params: { angle: 40, tangential: 'speeding' },
  }),
  ex('leggi-orarie', 'Accelera, procede costante, frena', 'Speeds up, cruises, brakes', {
    type: 'motion-graphs',
    params: {
      segments: [
        { duration: 4, a: 2 },
        { duration: 4, a: 0 },
        { duration: 2, a: -4 },
      ],
    },
  }),
  ex(
    'grafico-funzione',
    'Carica e scarica: esponenziali e asintoto',
    'Charge and discharge: exponentials and asymptote',
    {
      type: 'function-plot',
      params: {
        x: { min: 0, max: 5, label: 't', unit: 's' },
        y: { min: 0, max: 1.2, label: 'v', unit: 'V' },
        series: [
          { kind: 'exp', a: -1, b: -1, c: 1, label: 'v_C' },
          { kind: 'exp', a: 1, b: -1, label: 'v_R', dash: true },
        ],
        hlines: [{ y: 1, label: 'V_0' }],
        vlines: [{ x: 1, label: 'τ' }],
        markers: [{ x: 1, y: 0.632, label: '63%' }],
      },
    },
  ),
  ex('grafico-area', 'Area sotto la curva (lavoro di una forza)', 'Area under the curve (work of a force)', {
    type: 'function-plot',
    params: {
      x: { min: 0, max: 4, label: 'x', unit: 'm' },
      y: { label: 'F', unit: 'N' },
      series: [{ kind: 'poly', coeffs: [1, 0, 0.5] }],
      area: { series: 0, from: 1, to: 3, label: 'L' },
    },
  }),
  ex('urto-1d', 'Urto elastico lungo una retta', 'Elastic collision in one dimension', {
    type: 'collision',
    params: {
      before: [
        { label: 'A', mass: 'm_A', v: 3 },
        { label: 'B', mass: 'm_B', v: -1 },
      ],
      after: [
        { label: 'A', mass: 'm_A', v: -1 },
        { label: 'B', mass: 'm_B', v: 3 },
      ],
    },
  }),
  ex('urto-2d', 'Urto nel piano', 'Collision in the plane', {
    type: 'collision',
    params: {
      before: [
        { label: 'A', v: 4, angle: 0 },
        { label: 'B', v: 0, angle: 0 },
      ],
      after: [
        { label: 'A', v: 2.8, angle: 35 },
        { label: 'B', v: 2.3, angle: -45 },
      ],
    },
  }),
  // -------------------------------------------------------------- termodinamica
  ex('ciclo-carnot', 'Ciclo di Carnot (γ = 1,4)', 'Carnot cycle (γ = 1.4)', {
    type: 'pv-cycle',
    params: {
      states: [
        { id: 'A', V: 10, p: 400 },
        { id: 'B', V: 30, p: 133.33 },
        { id: 'C', V: 60, p: 50.53 },
        { id: 'D', V: 20, p: 151.59 },
      ],
      processes: [
        { from: 'A', to: 'B', kind: 'isothermal' },
        { from: 'B', to: 'C', kind: 'adiabatic' },
        { from: 'C', to: 'D', kind: 'isothermal' },
        { from: 'D', to: 'A', kind: 'adiabatic' },
      ],
      isotherms: false,
    },
  }),
  ex(
    'ciclo-rettangolare',
    'Ciclo di isocore e isobare con isoterme',
    'Isochoric–isobaric cycle with isotherms',
    {
      type: 'pv-cycle',
      params: {
        states: [
          { id: '1', V: 2, p: 300 },
          { id: '2', V: 6, p: 300 },
          { id: '3', V: 6, p: 100 },
          { id: '4', V: 2, p: 100 },
        ],
        processes: [
          { from: '1', to: '2', kind: 'isobaric' },
          { from: '2', to: '3', kind: 'isochoric' },
          { from: '3', to: '4', kind: 'isobaric' },
          { from: '4', to: '1', kind: 'isochoric' },
        ],
        isotherms: true,
      },
    },
  ),
  // ---------------------------------------------------------- elettromagnetismo
  ex('dipolo', 'Dipolo elettrico con equipotenziali', 'Electric dipole with equipotentials', {
    type: 'point-charges',
    params: {
      charges: [
        { x: -1, y: 0, q: 1, label: '+q' },
        { x: 1, y: 0, q: -1, label: '−q' },
      ],
      testPoint: { x: 0, y: 1.2, label: 'P' },
    },
  }),
  ex('cariche-uguali', 'Due cariche positive diverse', 'Two unequal positive charges', {
    type: 'point-charges',
    params: {
      charges: [
        { x: -1, y: 0, q: 2 },
        { x: 1, y: 0, q: 1 },
      ],
      lines: 6,
      equipotentials: 3,
    },
  }),
  ex(
    'condensatore-piano',
    'Condensatore piano con dielettrico ed effetti di bordo',
    'Parallel-plate capacitor with dielectric and fringing',
    {
      type: 'capacitor',
      params: { geometry: 'parallel', dielectric: 'half', fringe: true },
    },
  ),
  ex('condensatore-sferico', 'Condensatore sferico', 'Spherical capacitor', {
    type: 'capacitor',
    params: { geometry: 'spherical', innerLabel: 'R_1', outerLabel: 'R_2' },
  }),
  ex('condensatore-cilindrico', 'Condensatore cilindrico', 'Cylindrical capacitor', {
    type: 'capacitor',
    params: { geometry: 'cylindrical' },
  }),
  ex('filo', 'Filo rettilineo con la regola della mano destra', 'Straight wire with the right-hand rule', {
    type: 'magnetic-field',
    params: { source: 'wire', rightHand: true },
  }),
  ex('filo-sezione', 'Filo in sezione, corrente entrante', 'Wire in cross-section, current into the page', {
    type: 'magnetic-field',
    params: { source: 'wire-section', current: 'negative' },
  }),
  ex('spira', 'Spira circolare vista di taglio', 'Circular loop seen edge-on', {
    type: 'magnetic-field',
    params: { source: 'loop', rightHand: true },
  }),
  ex('solenoide', 'Solenoide', 'Solenoid', {
    type: 'magnetic-field',
    params: { source: 'solenoid', turns: 8 },
  }),
  ex('condensatore-strati', 'Due dielettrici in serie', 'Two dielectrics in series', {
    type: 'capacitor',
    params: { geometry: 'parallel', dielectric: 'layers' },
  }),
  ex('condensatore-affiancati', 'Due dielettrici in parallelo', 'Two dielectrics in parallel', {
    type: 'capacitor',
    params: { geometry: 'parallel', dielectric: 'side-by-side', field: false },
  }),
  ex(
    'coppia-fili',
    'Due fili con correnti concordi: si attraggono',
    'Two wires with parallel currents attract',
    {
      type: 'magnetic-field',
      params: { source: 'wire-pair' },
    },
  ),
  ex('coppia-fili-opposti', 'Correnti opposte: i fili si respingono', 'Opposite currents: the wires repel', {
    type: 'magnetic-field',
    params: { source: 'wire-pair', current2: 'negative' },
  }),
  ex('coassiale', 'Cavo coassiale in sezione', 'Coaxial cable in cross-section', {
    type: 'magnetic-field',
    params: { source: 'coax' },
  }),
  ex('toroide-traferro', 'Toroide con traferro', 'Toroid with an air gap', {
    type: 'magnetic-field',
    params: { source: 'toroid', gap: true, turns: 12 },
  }),
  ex('filo-u', 'Filo a U: campo nel centro del semicerchio', 'U-shaped wire: field at the centre', {
    type: 'magnetic-field',
    params: { source: 'hairpin' },
  }),
  ex('filo-spesso', 'Conduttore cilindrico spesso', 'Thick cylindrical conductor', {
    type: 'magnetic-field',
    params: { source: 'wire-section', radiusLabel: 'R' },
  }),
  // ------------------------------------------------------ distribuzioni e Gauss
  ex(
    'gauss-sfera',
    'Sfera carica e superficie di Gauss interna',
    'Charged sphere and inner Gaussian surface',
    {
      type: 'charge-distribution',
      params: { shape: 'sphere', gaussian: 0.6, densityLabel: 'ρ' },
    },
  ),
  ex('gauss-guscio', 'Guscio carico, superficie esterna', 'Charged shell, outer surface', {
    type: 'charge-distribution',
    params: { shape: 'shell', gaussian: 1.4 },
  }),
  ex('gauss-conduttore', 'Sfera conduttrice: campo nullo dentro', 'Conducting sphere: zero field inside', {
    type: 'charge-distribution',
    params: { shape: 'sphere', conductor: true, gaussian: 0.6 },
  }),
  ex('gauss-cilindro', 'Cilindro carico in sezione', 'Charged cylinder in cross-section', {
    type: 'charge-distribution',
    params: { shape: 'cylinder', gaussian: 2, gaussLabel: '2R' },
  }),
  ex('gauss-piano', 'Piano carico e cilindretto di Gauss', 'Charged plane and Gaussian pillbox', {
    type: 'charge-distribution',
    params: { shape: 'plane' },
  }),
  ex('gauss-filo', 'Filo carico e cilindro di Gauss', 'Charged wire and Gaussian cylinder', {
    type: 'charge-distribution',
    params: { shape: 'wire' },
  }),
  ex('anello', 'Anello carico: campo sull’asse', 'Charged ring: field on the axis', {
    type: 'charge-distribution',
    params: { shape: 'ring', point: { distance: 1 } },
  }),
  ex('segmento', 'Segmento carico: campo in P', 'Charged segment: field at P', {
    type: 'charge-distribution',
    params: { shape: 'rod', point: { distance: 0.8 } },
  }),
  ex('sfera-guscio', 'Sfera e guscio conduttori', 'Conducting sphere and shell', {
    type: 'charge-distribution',
    params: { shape: 'sphere-in-shell' },
  }),
  // ------------------------------------------------------------ campi uniformi
  ex('lorentz', 'Protone in un campo B entrante', 'Proton in a field B into the page', {
    type: 'uniform-field',
    params: { field: 'B-in', object: 'particle' },
  }),
  ex('lorentz-elettrone', 'Elettrone in un campo B uscente', 'Electron in a field B out of the page', {
    type: 'uniform-field',
    params: { field: 'B-out', object: 'particle', charge: 'negative' },
  }),
  ex('deflessione-e', 'Carica deviata da un campo elettrico', 'Charge deflected by an electric field', {
    type: 'uniform-field',
    params: { field: 'E-down', object: 'particle', charge: 'negative' },
  }),
  ex('dipolo-campo', 'Dipolo in un campo uniforme', 'Dipole in a uniform field', {
    type: 'uniform-field',
    params: { field: 'E-right', object: 'dipole', angle: 40 },
  }),
  ex('spira-campo', 'Spira in un campo B uniforme', 'Loop in a uniform field B', {
    type: 'uniform-field',
    params: { field: 'B-right', object: 'loop', angle: 50 },
  }),
  // ------------------------------------------------------------------ induzione
  ex('rotaie', 'Barretta su rotaie', 'Bar on rails', {
    type: 'induction',
    params: { setup: 'sliding-bar' },
  }),
  ex('sbarra-rotante', 'Sbarra che ruota in un campo', 'Rod rotating in a field', {
    type: 'induction',
    params: { setup: 'rotating-rod' },
  }),
  ex('alternatore', 'Spira rotante (alternatore)', 'Rotating loop (alternator)', {
    type: 'induction',
    params: { setup: 'rotating-loop', angle: 50 },
  }),
  ex('spira-filo', 'Spira che si allontana dal filo', 'Loop moving away from the wire', {
    type: 'induction',
    params: { setup: 'loop-near-wire', motion: 'away' },
  }),
  ex('spira-b-variabile', 'Spira in un campo che cresce', 'Loop in an increasing field', {
    type: 'induction',
    params: { setup: 'loop-in-field', fieldLabel: 'B(t)' },
  }),
  // ------------------------------------------------------------------------ onde
  ex('onda-progressiva', 'Onda progressiva', 'Travelling wave', {
    type: 'wave',
    params: { kind: 'traveling', wavelengths: 2.25 },
  }),
  ex('onda-stazionaria', 'Terza armonica, estremi fissi', 'Third harmonic, fixed ends', {
    type: 'wave',
    params: { kind: 'standing', harmonic: 3, snapshots: 4 },
  }),
  ex('onda-tubo', 'Tubo chiuso a un estremo, seconda armonica', 'Pipe closed at one end, second harmonic', {
    type: 'wave',
    params: { kind: 'standing', harmonic: 2, boundary: 'fixed-free' },
  }),
  ex('onda-em', 'Onda elettromagnetica piana', 'Plane electromagnetic wave', {
    type: 'wave',
    params: { kind: 'electromagnetic' },
  }),
  ex('onda-sferica', 'Onda sferica da una sorgente puntiforme', 'Spherical wave from a point source', {
    type: 'wave',
    params: { kind: 'spherical' },
  }),
  // ---------------------------------------------------------------------- ottica
  ex('snell', 'Dall’aria al vetro', 'From air into glass', {
    type: 'refraction',
    params: { n1: 1, n2: 1.5, incidence: 40 },
  }),
  ex('riflessione-totale', 'Riflessione totale dal vetro all’aria', 'Total reflection from glass to air', {
    type: 'refraction',
    params: { n1: 1.5, n2: 1, incidence: 50 },
  }),
  ex('brewster', 'Angolo di Brewster', 'Brewster’s angle', {
    type: 'refraction',
    params: { n1: 1, n2: 1.5, incidence: 56.31, polarization: true },
  }),
  ex('young', 'Doppia fenditura', 'Double slit', {
    type: 'slits',
    params: { slits: 2 },
  }),
  ex('fenditura', 'Fenditura singola', 'Single slit', {
    type: 'slits',
    params: { slits: 1 },
  }),
  ex('polarizzatori', 'Due polarizzatori a 60°', 'Two polarizers at 60°', {
    type: 'polarizers',
    params: { axes: [0, 60] },
  }),
  // ---------------------------------------------------------------------- vettori
  ex('somma-vettori', 'Somma con il parallelogramma', 'Sum by the parallelogram rule', {
    type: 'vectors',
    params: {
      vectors: [
        { id: 'a', label: 'a', dx: 4, dy: 1 },
        { id: 'b', label: 'b', dx: 1, dy: 3 },
      ],
      sum: { of: ['a', 'b'], label: 'a + b', parallelogram: true },
    },
  }),
  ex('componenti', 'Componenti cartesiane e metodo punta-coda', 'Cartesian components and tip-to-tail', {
    type: 'vectors',
    params: {
      vectors: [
        { id: 'u', label: 'u', dx: 3, dy: 2, components: true },
        { id: 'w', label: 'w', dx: -1, dy: 2, from: 'u' },
      ],
      sum: { of: ['u', 'w'], label: 's' },
    },
  }),
  ex('riferimenti', 'Due sistemi di riferimento', 'Two reference frames', {
    type: 'vectors',
    params: {
      axes: false,
      grid: false,
      range: { xMin: -1, xMax: 7, yMin: -1, yMax: 5 },
      vectors: [
        { label: 'r', x: 0, y: 0, dx: 5, dy: 3, tone: 'accent' },
        { label: "r'", x: 3, y: 1, dx: 2, dy: 2, tone: 'info', dashed: true },
      ],
      frames: [
        { x: 0, y: 0, labels: ['x', 'y'], origin: 'O', length: 2.5 },
        { x: 3, y: 1, angle: 25, origin: "O'", length: 2 },
      ],
    },
  }),
  // ------------------------------------------------------------------ informatica
  ex('flowchart', 'Massimo di una sequenza', 'Maximum of a sequence', {
    type: 'flowchart',
    params: {
      nodes: [
        { id: 'start', kind: 'start', text: { it: 'Inizio', en: 'Start' } },
        { id: 'read', kind: 'io', text: { it: 'leggi n', en: 'read n' } },
        { id: 'init', kind: 'process', text: 'max ← a[0], i ← 1' },
        { id: 'loop', kind: 'decision', text: 'i < n ?' },
        { id: 'cmp', kind: 'decision', text: 'a[i] > max ?' },
        { id: 'upd', kind: 'process', text: 'max ← a[i]' },
        { id: 'inc', kind: 'process', text: 'i ← i + 1' },
        { id: 'out', kind: 'io', text: { it: 'scrivi max', en: 'print max' } },
        { id: 'end', kind: 'end', text: { it: 'Fine', en: 'End' } },
      ],
      edges: [
        { from: 'start', to: 'read' },
        { from: 'read', to: 'init' },
        { from: 'init', to: 'loop' },
        { from: 'loop', to: 'cmp', label: { it: 'sì', en: 'yes' } },
        { from: 'loop', to: 'out', label: 'no' },
        { from: 'cmp', to: 'upd', label: { it: 'sì', en: 'yes' } },
        { from: 'cmp', to: 'inc', label: 'no' },
        { from: 'upd', to: 'inc' },
        { from: 'inc', to: 'loop' },
        { from: 'out', to: 'end' },
      ],
    },
  }),
  ex('blocchi', 'Architettura di von Neumann', 'Von Neumann architecture', {
    type: 'block-diagram',
    params: {
      blocks: [
        { id: 'cpu', text: 'CPU', col: 0, row: 0, emphasis: true },
        { id: 'mem', text: { it: 'Memoria centrale', en: 'Main memory' }, col: 2, row: 0 },
        { id: 'bus', text: { it: 'Bus di sistema', en: 'System bus' }, col: 0, row: 1, span: 3 },
        { id: 'io', text: { it: 'Periferiche I/O', en: 'I/O devices' }, col: 1, row: 2 },
      ],
      links: [
        { from: 'cpu', to: 'bus', both: true },
        { from: 'mem', to: 'bus', both: true },
        { from: 'io', to: 'bus', both: true, label: { it: 'interruzioni', en: 'interrupts' } },
      ],
    },
  }),
  ex('array', 'Array con due indici', 'Array with two indices', {
    type: 'memory',
    params: {
      kind: 'array',
      cells: [
        { value: '7' },
        { value: '3' },
        { value: '9', highlight: true },
        { value: '1' },
        { value: '4' },
        { value: '8' },
      ],
      pointers: [
        { label: 'i', index: 2 },
        { label: 'j', index: 5 },
      ],
    },
  }),
  ex('memoria', 'Memoria con indirizzi e puntatore', 'Memory with addresses and a pointer', {
    type: 'memory',
    params: {
      kind: 'memory',
      title: { it: 'Memoria (byte)', en: 'Memory (bytes)' },
      cells: [
        { label: '0x1000', value: '0x2A' },
        { label: '0x1001', value: '0x00' },
        { label: '0x1002', value: '0x10', highlight: true },
        { label: '0x1003', value: '0xFF' },
      ],
      pointers: [{ label: 'p', index: 2 }],
    },
  }),
  ex('pila', 'Pila dopo tre push', 'Stack after three pushes', {
    type: 'memory',
    params: {
      kind: 'stack',
      cells: [{ value: 'ret addr' }, { value: 'x = 5' }, { value: 'y = 2', highlight: true }],
    },
  }),
  ex('lista', 'Lista concatenata', 'Linked list', {
    type: 'linked-list',
    params: { nodes: [{ value: '12' }, { value: '7', highlight: true }, { value: '30' }], tail: 'tail' },
  }),
  ex('lista-doppia', 'Lista doppiamente concatenata', 'Doubly linked list', {
    type: 'linked-list',
    params: { nodes: [{ value: 'A' }, { value: 'B' }, { value: 'C' }], doubly: true },
  }),
  ex('albero', 'Albero binario di ricerca', 'Binary search tree', {
    type: 'tree',
    params: {
      binary: true,
      root: {
        value: '8',
        children: [
          {
            value: '3',
            children: [{ value: '1' }, { value: '6', children: [{ value: '4' }, { value: '7' }] }],
          },
          {
            value: '10',
            children: [null, { value: '14', highlight: true, children: [{ value: '13' }, null] }],
          },
        ],
      },
    },
  }),
  ex('tabella-verita', 'Sommatore completo', 'Full adder', {
    type: 'truth-table',
    params: {
      inputs: ['A', 'B', 'Cin'],
      outputs: [
        { label: 'S', values: [0, 1, 1, 0, 1, 0, 0, 1] },
        { label: 'Cout', values: [0, 0, 0, 1, 0, 1, 1, 1] },
      ],
      highlight: [7],
    },
  }),
];
