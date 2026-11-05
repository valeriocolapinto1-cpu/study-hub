import { wrap, line, dot, text, resH, resV, vsrcV, isrcV, capH, indH, gnd, arrow } from './svg.mjs';
export const F = {};
// Nodo con correnti (KCL)
F.kcl = wrap(260, 150, `${dot(130, 75)}${arrow(30, 75, 124, 75)}${arrow(136, 75, 230, 40)}${arrow(136, 75, 230, 115)}${text(60, 62, 'i₁')}${text(205, 48, 'i₂', 'end')}${text(205, 135, 'i₃', 'end')}${text(130, 100, 'i₁ = i₂ + i₃')}`);
// Bipolo e porta
F.bipolo = wrap(260, 130, `${line(20, 65, 90, 65)}<rect x="90" y="40" width="80" height="50"/>${line(170, 65, 240, 65)}${arrow(30, 65, 85, 65)}${text(55, 52, 'i')}${text(20, 88, 'v', 'start')}${text(130, 70, 'bipolo')}${dot(20, 65)}${dot(240, 65)}`);
// Trasformatore ideale
const coilL = (x, y) => `<path d="M${x} ${y} a8 8 0 0 1 0 16 a8 8 0 0 1 0 16 a8 8 0 0 1 0 16"/>`;
const coilR = (x, y) => `<path d="M${x} ${y} a8 8 0 0 0 0 16 a8 8 0 0 0 0 16 a8 8 0 0 0 0 16"/>`;
F.trasf = wrap(300, 150, `${line(30, 40, 110, 40)}${coilL(110, 40)}${line(110, 88, 110, 110)}${line(30, 110, 110, 110)}${line(145, 36, 145, 114)}${line(155, 36, 155, 114)}${coilR(190, 40)}${line(190, 88, 190, 110)}${line(190, 40, 270, 40)}${line(190, 110, 270, 110)}${dot(30, 40)}${dot(30, 110)}${dot(270, 40)}${dot(270, 110)}${arrow(40, 30, 80, 30)}${arrow(260, 30, 220, 30)}${text(60, 22, 'i₁')}${text(240, 22, 'i₂')}${text(18, 80, 'v₁', 'end')}${text(282, 80, 'v₂', 'start')}${text(150, 138, 'n : 1')}`);
// Nullore
F.nullore = wrap(300, 150, `<rect x="95" y="45" width="50" height="60"/><rect x="155" y="45" width="50" height="60"/>${line(40, 60, 95, 60)}${line(40, 90, 95, 90)}${line(205, 60, 260, 60)}${line(205, 90, 260, 90)}${text(120, 72, 'v=0')}${text(120, 92, 'i=0')}${text(180, 72, 'v, i')}${text(180, 92, 'libere')}${text(120, 38, 'nullatore')}${text(180, 38, 'noratore')}${dot(40, 60)}${dot(40, 90)}${dot(260, 60)}${dot(260, 90)}`);
// Invertente
F.invertente = wrap(340, 190, `<g transform="translate(0,16)">${line(20, 60, 40, 60)}${resH(40, 60, 'R₁')}${line(100, 60, 140, 60)}${line(140, 60, 140, 40)}<path d="M140 30 L140 130 L240 80 Z" transform="translate(0,-5)"/>${line(140, 105, 100, 105)}${line(100, 105, 100, 135)}${gnd(100, 135)}${line(240, 75, 300, 75)}${line(300, 75, 300, 20)}${line(300, 20, 120, 20)}${line(120, 20, 120, 60)}${dot(120, 60)}${resH(180, 20, '')}${text(210, 8, 'R₂')}${text(20, 50, 'Vg', 'start')}${text(320, 70, 'Vo', 'start')}${text(150, 64, '−', 'start')}${text(150, 110, '+', 'start')}${dot(300, 75)}</g>`);
// Grafo K4
const K4 = (alb) => wrap(280, 200, `${line(140, 20, 40, 160)}${line(140, 20, 240, 160)}${line(40, 160, 240, 160)}${line(140, 20, 140, 110)}${line(140, 110, 40, 160)}${line(140, 110, 240, 160)}${dot(140, 20)}${dot(40, 160)}${dot(240, 160)}${dot(140, 110)}${text(140, 12, '1')}${text(28, 175, '2')}${text(254, 175, '3')}${text(154, 104, '0', 'start')}${alb || ''}`);
F.k4 = K4('');
F.k4tree = wrap(280, 200, `<g stroke-width="4">${line(140, 20, 140, 110)}${line(140, 110, 40, 160)}${line(140, 110, 240, 160)}</g><g stroke-dasharray="6 5">${line(140, 20, 40, 160)}${line(140, 20, 240, 160)}${line(40, 160, 240, 160)}</g>${dot(140, 20)}${dot(40, 160)}${dot(240, 160)}${dot(140, 110)}${text(140, 12, '1')}${text(28, 175, '2')}${text(254, 175, '3')}${text(154, 104, '0', 'start')}${text(90, 130, 'albero', 'end')}`);
// Partitore
F.partitore = wrap(260, 200, `${line(40, 30, 130, 30)}${vsrcV(40, 30, 'V')}${line(40, 90, 40, 160)}${line(130, 30, 130, 30)}${resV(130, 30, 'R₁')}${resV(130, 100, 'R₂')}${line(40, 160, 130, 160)}${line(130, 160, 130, 160)}${dot(130, 95)}${line(130, 95, 190, 95)}${text(200, 99, 'v₂', 'start')}${gnd(40, 160).replace('', '')}`);
