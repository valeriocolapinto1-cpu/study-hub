import { wrap, line, dot, text, resH, resV, vsrcV, capH, indH, gnd, arrow } from './svg.mjs';
export const F2 = {};
// RC serie con generatore
F2.rc = wrap(300, 170, `${vsrcV(40, 40, 'v_g')}${line(40, 40, 40, 30)}${line(40, 30, 70, 30)}${resH(70, 30, 'R')}${line(130, 30, 220, 30)}${line(220, 30, 220, 55)}<g transform="translate(220,55) rotate(90)">${capH(0, 0, '')}</g>${text(236, 90, 'C', 'start')}${line(220, 115, 220, 130)}${line(40, 100, 40, 130)}${line(40, 130, 220, 130)}${gnd(130, 130)}${text(240, 40, 'v_C', 'start')}`);
// Equivalente di Thevenin
F2.thevenin = wrap(300, 150, `${text(70, 70, 'bipolo', 'middle')}<rect x="30" y="40" width="80" height="60" rx="6"/>${line(110, 55, 150, 55)}${line(110, 85, 150, 85)}${dot(150, 55)}${dot(150, 85)}${text(170, 52, 'A', 'start')}${text(170, 92, 'B', 'start')}${text(200, 120, '⇔', 'middle')}`);
// Equivalente Thevenin: generatore + Zth
F2.theveninEq = wrap(320, 150, `${vsrcV(50, 30, 'V_th')}${line(50, 30, 90, 30)}${resH(90, 30, 'Z_th')}${line(150, 30, 200, 30)}${dot(200, 30)}${text(212, 34, 'A', 'start')}${line(50, 90, 200, 90)}${dot(200, 90)}${text(212, 94, 'B', 'start')}`);
// Equivalente Norton
F2.nortonEq = wrap(320, 150, `${line(60, 30, 140, 30)}${line(60, 30, 60, 35)}<circle cx="60" cy="60" r="18"/>${line(60, 50, 60, 70)}${line(55, 56, 60, 50, 65, 56)}${text(30, 64, 'I_N', 'end')}${line(60, 78, 60, 90)}${line(140, 30, 140, 45)}<g transform="translate(140,45) rotate(90)">${resH(0, 0, '')}</g>${text(160, 78, 'Z_N', 'start')}${line(140, 105, 140, 90)}${line(60, 90, 140, 90)}${line(140, 30, 200, 30)}${dot(200, 30)}${line(140, 90, 200, 90)}${dot(200, 90)}${text(212, 34, 'A', 'start')}${text(212, 94, 'B', 'start')}`);
// Doppio bipolo
F2.duebipoli = wrap(320, 160, `<rect x="100" y="30" width="120" height="100" rx="6"/>${line(40, 50, 100, 50)}${line(40, 110, 100, 110)}${line(220, 50, 280, 50)}${line(220, 110, 280, 110)}${dot(40, 50)}${dot(40, 110)}${dot(280, 50)}${dot(280, 110)}${arrow(50, 40, 90, 40)}${arrow(270, 40, 230, 40)}${text(70, 32, 'i₁')}${text(250, 32, 'i₂')}${text(28, 84, 'v₁', 'end')}${text(292, 84, 'v₂', 'start')}${text(160, 85, 'N', 'middle')}`);
// RLC serie
F2.rlc = wrap(380, 150, `${vsrcV(40, 20, 'v_g')}${line(40, 20, 70, 20)}${resH(70, 20, 'R')}${indH(130, 20, 'L')}${capH(190, 20, 'C')}${line(250, 20, 280, 20)}${line(280, 20, 280, 100)}${line(40, 80, 40, 100)}${line(40, 100, 280, 100)}${gnd(160, 100)}`);
// Bode asintotico passa-basso
F2.bode = wrap(340, 200, `${line(40, 20, 40, 160, 320, 160)}${line(40, 60, 160, 60, 300, 140)}<g stroke-dasharray="4 3">${line(160, 60, 160, 160)}</g>${text(160, 178, 'ω_c')}${text(30, 64, '0 dB', 'end')}${text(190, 50, '−20 dB/dec', 'start')}${text(180, 18, '|H| (dB)', 'start')}${text(320, 178, 'ω (log)', 'end')}${dot(160, 60)}`);
// Cascata
F2.cascata = wrap(380, 150, `<rect x="60" y="30" width="90" height="80" rx="5"/><rect x="220" y="30" width="90" height="80" rx="5"/>${text(105, 75, 'N_a')}${text(265, 75, 'N_b')}${line(20, 45, 60, 45)}${line(20, 95, 60, 95)}${line(150, 45, 220, 45)}${line(150, 95, 220, 95)}${line(310, 45, 350, 45)}${line(310, 95, 350, 95)}${dot(20, 45)}${dot(20, 95)}${dot(350, 45)}${dot(350, 95)}`);
// Serie-serie
F2.serieserie = wrap(380, 180, `<rect x="120" y="20" width="100" height="50" rx="5"/><rect x="120" y="100" width="100" height="50" rx="5"/>${text(170, 50, 'N_a')}${text(170, 130, 'N_b')}${line(40, 35, 120, 35)}${line(40, 135, 120, 135)}${line(220, 35, 300, 35)}${line(220, 135, 300, 135)}${line(120, 55, 100, 55)}${line(100, 55, 100, 115)}${line(100, 115, 120, 115)}${line(220, 55, 240, 55)}${line(240, 55, 240, 115)}${line(240, 115, 220, 115)}${dot(40, 35)}${dot(40, 135)}${dot(300, 35)}${dot(300, 135)}${text(170, 90, 'serie-serie', 'middle')}`);
