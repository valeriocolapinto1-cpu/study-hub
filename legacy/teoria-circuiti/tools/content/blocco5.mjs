import { F2 } from './figure2.mjs';
const T = String.raw;
export const B5 = {};

B5['V-01'] = {
  obiettivi: ['Definire la funzione di rete', 'Dimostrare che è razionale a coefficienti reali', 'Individuare poli e zeri'],
  teoria: [
    T`La <strong>funzione di rete</strong> è $H(s)=\dfrac{Y(s)}{X(s)}$ con condizioni iniziali nulle, tra una grandezza d'uscita $Y$ e una d'ingresso $X$. Se ingresso e uscita sono sulla stessa porta si parla di impedenza o ammettenza di punto pilota; altrimenti di funzione di trasferimento (rapporto di tensioni, correnti, transimpedenza, transammettenza).`,
    T`Per circuiti lineari tempo-invarianti a costanti concentrate $H(s)=\dfrac{N(s)}{D(s)}$ è <em>razionale a coefficienti reali</em>. Le radici di $D$ sono i <strong>poli</strong>, quelle di $N$ gli <strong>zeri</strong>; poli e zeri non reali sono in coppie complesse coniugate.`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Le funzioni di rete sono razionali a coefficienti reali', passi: [T`Nel dominio di $s$, con condizioni iniziali nulle, ogni elemento ha una relazione algebrica: $V=RI$, $V=sLI$, $I=sCV$, con $R,L,C$ reali; i generatori controllati hanno guadagni reali.`, T`KCL e KVL hanno coefficienti $0,\pm1$. Il circuito è quindi descritto da un sistema lineare $\mathcal A(s)\mathbf z=\mathbf b$ i cui coefficienti sono polinomi in $s$ a coefficienti reali.`, T`Per la regola di Cramer ogni incognita è $\det\mathcal A_k(s)/\det\mathcal A(s)$: rapporto di polinomi in $s$ a coefficienti reali.`, T`Quindi $H=Y/X$ è un rapporto di polinomi reali. I polinomi reali hanno radici non reali in coppie coniugate. $\square$`] }],
  esempi: [
    { titolo: 'RC passa-basso', testo: T`$R=2$, $C=\tfrac12$, uscita su $C$: $H(s)$, poli, zeri.`, soluzione: [T`$H=\dfrac{1/(sC)}{R+1/(sC)}=\dfrac{1}{1+sRC}=\dfrac{1}{s+1}$.`, T`Polo in $-1$, nessuno zero.`] },
    { titolo: 'RL passa-alto', testo: T`$R=1$, $L=1$, uscita su $L$.`, soluzione: [T`$H=\dfrac{sL}{R+sL}=\dfrac{s}{s+1}$: zero in $0$, polo in $-1$.`] },
    { titolo: 'Impedenza di punto pilota', testo: T`$Z(s)$ di una serie $R=1$, $C=1$.`, soluzione: [T`$Z=1+\dfrac1s=\dfrac{s+1}{s}$: zero in $-1$, polo in $0$.`] },
  ],
  errori: [{ sbagliato: T`Calcolare $H(s)$ con $v_C(0^-)\ne0$ senza metterlo a zero.`, corretto: T`La funzione di rete è definita con condizioni iniziali nulle.` }],
  esame: T`Funzioni di rete razionali a coefficienti reali: 4-7-2000 [STORICO].`,
  formulario: ['h-def', 'h-razionale', 'h-rc-lp', 'h-rc-hp'],
};

B5['V-02'] = {
  obiettivi: ['Definire la risposta impulsiva', 'Dimostrare $h=\\mathcal L^{-1}\\{H\\}$', 'Usare la convoluzione e la risposta al gradino'],
  teoria: [
    T`La <strong>risposta impulsiva</strong> $h(t)$ è l'uscita a $x=\delta(t)$ con condizioni iniziali nulle. Per un sistema causale $h(t)=0$ per $t<0$. L'uscita a un ingresso qualsiasi (condizioni iniziali nulle) è la <strong>convoluzione</strong> $y(t)=\int_{0}^{t}h(\tau)x(t-\tau)\,d\tau$. La risposta al gradino è l'integrale di $h$.`,
    T`Il legame con la funzione di rete è $h(t)=\mathcal L^{-1}\{H(s)\}$: i poli di $H$ determinano i modi di $h$ e quindi la stabilità (se $h$ è assolutamente integrabile il sistema è stabile).`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Risposta impulsiva e funzione di rete', enunciato: T`$h(t)=\mathcal L^{-1}\{H(s)\}$ e $y=h*x$.`, passi: [T`Per $x=\delta(t)$ si ha $X(s)=1$.`, T`A condizioni iniziali nulle $Y(s)=H(s)X(s)=H(s)$.`, T`Antitrasformando $y=h=\mathcal L^{-1}\{H\}$.`, T`Per un ingresso qualsiasi $Y=HX$; poiché $\mathcal L\{h*x\}=HX$ (proprietà della convoluzione), $y=h*x$. $\square$`] }],
  esempi: [
    { titolo: 'Risposta impulsiva di un RC', testo: T`$H=\dfrac{1}{s+1}$.`, soluzione: [T`$h(t)=e^{-t}u_{-1}(t)$.`] },
    { titolo: 'Risposta al gradino', testo: T`Stesso sistema, ingresso $u_{-1}$.`, soluzione: [T`$y=\int_0^th=1-e^{-t}$ per $t>0$.`] },
    { titolo: 'Impulso rettangolare', testo: T`Stesso sistema, ingresso $1$ per $0<t<1$.`, soluzione: [T`$0<t<1$: $y=1-e^{-t}$.`, T`$t>1$: $y=(1-e^{-1})e^{-(t-1)}$ (continuità in $t=1$).`] },
  ],
  errori: [{ sbagliato: T`Dedurre $h$ dalla risposta al gradino senza derivare.`, corretto: T`$h=\dfrac{d}{dt}y_{gradino}$.` }],
  esame: T`Risposta impulsiva e funzione di rete: 18-9-2002, 19-11-2003 [STORICO].`,
  formulario: ['h-imp', 'y-conv', 'y-gradino'],
};

B5['V-03'] = {
  obiettivi: ['Distinguere risposta libera e forzata', 'Calcolarle con Laplace', 'Ricomporre la risposta completa'],
  teoria: [
    T`<strong>Libera</strong>: ingresso nullo, condizioni iniziali non nulle (dipende solo dai modi naturali, cioè dai poli). <strong>Forzata</strong>: condizioni iniziali nulle e ingresso non nullo. In un sistema lineare la risposta completa è la somma $y=y_{lib}+y_{forz}$.`,
    T`Con Laplace: nel circuito trasformato si pongono a zero le condizioni iniziali (forzata) oppure gli ingressi (libera).`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'RC con gradino', testo: T`$R=2$, $C=\tfrac12$, $v_C(0)=2$, ingresso $10u_{-1}$.`, soluzione: [T`Libera: $v_C=2e^{-t}$.`, T`Forzata: $10(1-e^{-t})$.`, T`Somma: $10-8e^{-t}$ ✓.`] },
    { titolo: 'Solo libera', testo: T`RL $R=4$, $L=2$, $i(0)=3$, generatori spenti.`, soluzione: [T`$i=3e^{-2t}$.`] },
    { titolo: 'Solo forzata', testo: T`$H=\dfrac1{s+1}$ con $x=u_{-1}$, condizioni nulle.`, soluzione: [T`$Y=\dfrac1{s(s+1)}\Rightarrow y=1-e^{-t}$.`] },
  ],
  errori: [{ sbagliato: T`Attribuire il transitorio alla sola risposta libera.`, corretto: T`La forzata contiene anche termini transitori ($-10e^{-t}$ sopra).` }],
  esame: T`Risposta libera e forzata: 25-9-2007, 17-4-2008 (Laplace) [STORICO].`,
  formulario: ['y-libera-forzata'],
};

B5['V-04'] = {
  obiettivi: ['Enunciare la condizione di stabilità in termini di poli', 'Dimostrarla', 'Applicare i criteri di Routh per gradi 2 e 3'],
  teoria: [
    T`Un sistema lineare è <strong>asintoticamente stabile</strong> se la risposta libera tende a zero per ogni condizione iniziale; condizione necessaria e sufficiente: tutti i poli di $H(s)$ (senza cancellazioni) hanno parte reale negativa. È <strong>marginalmente stabile</strong> con poli semplici sull'asse immaginario (e gli altri a parte reale negativa); è <strong>instabile</strong> con un polo a parte reale positiva o poli multipli sull'asse immaginario.`,
    T`<strong>Criteri per polinomi.</strong> Grado 2: $s^2+a_1s+a_0$ stabile se $a_1,a_0>0$. Grado 3: $s^3+a_2s^2+a_1s+a_0$ stabile se $a_2,a_1,a_0>0$ e $a_2a_1>a_0$.`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Condizione di stabilità: poli nel semipiano sinistro aperto', passi: [T`Scomponendo in fratti semplici, ogni polo $p$ di molteplicità $m$ dà modi $t^ke^{pt}$ con $0\le k<m$.`, T`Se $\mathrm{Re}\,p<0$: $|t^ke^{pt}|=t^ke^{\mathrm{Re}(p)t}\to0$ (l'esponenziale prevale sulla potenza).`, T`Se tutti i poli hanno $\mathrm{Re}<0$, ogni modo, e quindi la risposta libera, tende a zero.`, T`Se un polo ha $\mathrm{Re}\,p>0$ il modo diverge; se $\mathrm{Re}\,p=0$ il modo non tende a zero ($|e^{j\omega t}|=1$) e se la molteplicità è $\ge2$ compare $t\,e^{j\omega t}$, illimitato. $\square$`] }],
  esempi: [
    { titolo: 'Secondo ordine con parametro', testo: T`$D(s)=s^2+(k-3)s+2$.`, soluzione: [T`Serve $k-3>0$: stabile per $k>3$.`] },
    { titolo: 'Terzo ordine', testo: T`$D(s)=s^3+2s^2+3s+k$.`, soluzione: [T`$k>0$ e $2\cdot3>k$: stabile per $0<k<6$.`, T`Per $k=6$: poli sull'asse immaginario ($s=\pm j\sqrt3$): marginale.`] },
    { titolo: 'Polo in $+1$', testo: T`$H=\dfrac{1}{s-1}$.`, soluzione: [T`Polo in $s=1$: $h=e^{t}$ diverge, instabile.`] },
  ],
  errori: [{ sbagliato: T`Dire che un polo sull'asse immaginario rende il sistema stabile.`, corretto: T`Al più marginale: la risposta non decade e può diventare illimitata (polo multiplo o ingresso risonante).` }],
  esame: T`Stabilità, poli, stabilità al variare di $k$: 12-6-2000, 15-9-2000, 29-4-2002, 24-4-2003 [STORICO].`,
  formulario: ['stab-poli', 'routh2', 'routh3'],
};

B5['V-05'] = {
  obiettivi: ['Separare transitoria e permanente', 'Ricavarle da $F(s)$ e $x(t)$', 'Calcolare la permanente con $F(j\\omega)$'],
  teoria: [
    T`Per un sistema stabile e ingresso sinusoidale $x=A\cos(\omega_0t+\varphi)$ la <strong>risposta permanente</strong> è $y_p=A|F(j\omega_0)|\cos(\omega_0t+\varphi+\arg F(j\omega_0))$; la <strong>transitoria</strong> è formata dai modi naturali (poli di $F$) e si estingue.`,
    T`Con Laplace: $Y(s)=F(s)X(s)$; nella scomposizione in fratti semplici i poli di $X$ danno la permanente, i poli di $F$ il transitorio.`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'RC con ingresso coseno', testo: T`$F=\dfrac1{s+1}$, $x=\cos t$, condizioni nulle.`, soluzione: [T`$F(j)=\dfrac{1}{1+j}=\tfrac{1}{\sqrt2}e^{-j45^\circ}$: $y_p=\tfrac1{\sqrt2}\cos(t-45^\circ)=\tfrac12\cos t+\tfrac12\sin t$.`, T`$Y=\dfrac{s}{(s+1)(s^2+1)}=\dfrac{-1/2}{s+1}+\dfrac{\tfrac12s+\tfrac12}{s^2+1}$: transitorio $-\tfrac12e^{-t}$.`] },
    { titolo: 'Tempo di estinzione', testo: T`Dopo quanto il transitorio $-\tfrac12e^{-t}$ è sotto l'$1\%$ dell'ampiezza di regime ($\tfrac1{\sqrt2}$)?`, soluzione: [T`$\tfrac12e^{-t}<0{,}007\Rightarrow t>\ln(71)\approx4{,}3\,\mathrm s\approx4{,}3\tau$.`] },
    { titolo: 'Ingresso gradino', testo: T`Stesso $F$, $x=u_{-1}$.`, soluzione: [T`Permanente: $F(0)=1$ (costante); transitoria: $-e^{-t}$.`] },
  ],
  errori: [{ sbagliato: T`Calcolare la permanente con $F(s)$ a $s=\omega_0$.`, corretto: T`Si valuta $F$ in $s=j\omega_0$.` }],
  esame: T`Risposta permanente e transitoria da $F(s)$ e $x(t)$: 25-9-2003, 12-7-2005, 7-7-2008, 24-4-2009 [STORICO].`,
  formulario: ['y-permanente'],
};

B5['V-06'] = {
  obiettivi: ['Collegare $H(s)$ a $H(j\\omega)$', 'Calcolare modulo e fase', 'Sapere quando il legame vale'],
  teoria: [
    T`La funzione di rete per i fasori è $H(j\omega)=H(s)\big|_{s=j\omega}$, valida per sistemi stabili. Modulo $|H(j\omega)|$ e fase $\arg H(j\omega)$ dicono come l'uscita sinusoidale a regime è scalata e sfasata rispetto all'ingresso.`,
    T`Le equazioni dei fasori sono quelle di Laplace con $s=j\omega$ e <em>senza</em> condizioni iniziali: il metodo dei fasori vede solo il regime.`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'Modulo e fase', testo: T`$H=\dfrac{1}{s+1}$ a $\omega=1$.`, soluzione: [T`$H(j)=\dfrac1{1+j}$: $|H|=\tfrac1{\sqrt2}\approx0{,}707$, $\arg=-45^\circ$.`] },
    { titolo: 'Passa-alto', testo: T`$H=\dfrac{s}{s+1}$ a $\omega=1$.`, soluzione: [T`$\dfrac{j}{1+j}=\dfrac{j(1-j)}2=\dfrac{1+j}{2}$: $|H|=\tfrac1{\sqrt2}$, $\arg=+45^\circ$.`] },
    { titolo: 'Uscita a regime', testo: T`$x=4\cos t$ nel primo sistema.`, soluzione: [T`$y_p=4\cdot0{,}707\cos(t-45^\circ)\approx2{,}83\cos(t-45^\circ)$.`] },
  ],
  errori: [{ sbagliato: T`Usare $H(j\omega)$ per sistemi instabili.`, corretto: T`Il legame vale solo con poli a parte reale negativa.` }],
  esame: T`Relazione fasori–Laplace; risposta in frequenza [STORICO].`,
  formulario: ['hjw-def', 'mod-fase'],
};

B5['V-07'] = {
  obiettivi: ['Tracciare modulo e fase della risposta in frequenza', 'Riconoscere il tipo di filtro', 'Calcolare la frequenza di taglio a 3 dB'],
  teoria: [
    T`<strong>Passa-basso del primo ordine</strong> $H=\dfrac{1}{1+s/\omega_c}$: $|H(j\omega)|=\dfrac{1}{\sqrt{1+(\omega/\omega_c)^2}}$, fase $-\arctan(\omega/\omega_c)$. A $\omega_c$ il modulo vale $1/\sqrt2$ ($-3\,\mathrm{dB}$) e la fase $-45^\circ$; oltre $\omega_c$ scende di $20\,\mathrm{dB/dec}$. RC: $\omega_c=1/(RC)$; RL (uscita su $R$): $\omega_c=R/L$.`,
    T`<strong>Passa-alto</strong> $H=\dfrac{s/\omega_c}{1+s/\omega_c}$: blocca la continua e passa le alte frequenze. Il guadagno in dB è $20\log_{10}|H|$.`,
  ],
  figure: [{ alt: 'Diagramma asintotico di Bode del modulo di un passa-basso: piatto fino a ω_c, poi −20 dB/decade', svg: F2.bode }],
  dimostrazioni: [],
  esempi: [
    { titolo: 'Taglio di un RC', testo: T`$R=2\,\Omega$, $C=\tfrac12\,\mathrm F$.`, soluzione: [T`$\omega_c=\dfrac1{RC}=1\,\mathrm{rad/s}$, $f_c=\dfrac{\omega_c}{2\pi}\approx0{,}159\,\mathrm{Hz}$.`] },
    { titolo: 'Guadagno a una decade sopra', testo: T`Passa-basso con $\omega_c=1$: $|H|$ a $\omega=10$.`, soluzione: [T`$\dfrac{1}{\sqrt{101}}\approx0{,}0995\to-20{,}04\,\mathrm{dB}$ ($\approx-20\,\mathrm{dB}$).`] },
    { titolo: 'Tipo di filtro', testo: T`$H=\dfrac{s}{s+2}$.`, soluzione: [T`$H(0)=0$, $|H(\infty)|=1$: passa-alto con $\omega_c=2$.`] },
  ],
  errori: [{ sbagliato: T`Dire che la frequenza di taglio a 3 dB è dove il modulo è la metà del massimo.`, corretto: T`È dove il modulo è $|H|_{max}/\sqrt2$ (potenza dimezzata).` }],
  esame: T`Risposta in frequenza, tipo di filtro, taglio a 3 dB: 3-7-2001, 29-4-2002, 19-6-2002, 17-7-2002, 24-4-2003, 3-7-2003, 19-11-2003, 11-2-2008 [STORICO].`,
  formulario: ['wc-rc', 'wc-rl', 'mod-lp', 'db', 'bode-pend'],
};

B5['V-08'] = {
  obiettivi: ['Ricavare risonanza, $Q$ e banda di RLC serie e parallelo', 'Dimostrare $B=\\omega_0/Q$', 'Interpretare sovratensioni e sovracorrenti'],
  teoria: [
    T`<strong>RLC serie.</strong> $Z=R+j(\omega L-1/(\omega C))$. Alla <strong>risonanza</strong> $\omega_0=1/\sqrt{LC}$ la reattanza è nulla, $|Z|$ è minima e uguale a $R$. Fattore di merito $Q=\dfrac{\omega_0L}{R}=\dfrac{1}{\omega_0RC}$; banda a $3\,\mathrm{dB}$ $B=\omega_0/Q=R/L$. Alla risonanza la tensione su $L$ e $C$ vale $Q$ volte quella del generatore.`,
    T`<strong>RLC parallelo.</strong> $Y=G+j(\omega C-1/(\omega L))$: alla risonanza l'ammettenza è minima e l'impedenza massima ($=R$). $Q=\dfrac{R}{\omega_0L}=\omega_0RC$, $B=\omega_0/Q=1/(RC)$. È il duale del serie.`,
  ],
  figure: [{ alt: 'Circuito RLC serie con generatore: R, L e C in serie', svg: F2.rlc }],
  dimostrazioni: [{ titolo: 'Banda a 3 dB del RLC serie', enunciato: T`La banda a $3\,\mathrm{dB}$ della corrente è esattamente $B=\omega_2-\omega_1=R/L=\omega_0/Q$.`, passi: [T`$|I|/|I|_{max}=1/\sqrt2$ quando $|X|=R$, cioè $\omega L-\dfrac1{\omega C}=\pm R$.`, T`Risolvendo $\omega^2LC\mp\omega RC-1=0$: $\omega_{1,2}=\mp\dfrac{R}{2L}+\sqrt{\left(\dfrac{R}{2L}\right)^2+\dfrac1{LC}}$ (radici positive).`, T`Sottraendo: $\omega_2-\omega_1=\dfrac{R}{L}=\dfrac{\omega_0}{Q}$ (le due radici positive differiscono esattamente di $R/L$). $\square$`] }],
  esempi: [
    { titolo: 'RLC serie numerico', testo: T`$R=1\,\Omega$, $L=1\,\mathrm H$, $C=\tfrac14\,\mathrm F$.`, soluzione: [T`$\omega_0=\dfrac{1}{\sqrt{1/4}}=2\,\mathrm{rad/s}$, $Q=\dfrac{2\cdot1}{1}=2$, $B=\dfrac{R}{L}=1\,\mathrm{rad/s}$ ($=\omega_0/Q$ ✓).`] },
    { titolo: 'RLC parallelo', testo: T`$R=4\,\Omega$, $L=1\,\mathrm H$, $C=1\,\mathrm F$.`, soluzione: [T`$\omega_0=1$, $Q=\dfrac{R}{\omega_0L}=4$, $B=\dfrac{1}{RC}=\tfrac14$.`] },
    { titolo: 'Sovratensione', testo: T`Serie con $Q=10$ alimentato da $1\,\mathrm V$.`, soluzione: [T`Alla risonanza $|V_C|=|V_L|=Q\cdot1=10\,\mathrm V$.`] },
  ],
  errori: [{ sbagliato: T`Usare $Q=\omega_0L/R$ anche per il parallelo.`, corretto: T`Nel parallelo $Q=R/(\omega_0L)=\omega_0RC$.` }],
  esame: T`Circuiti risonanti serie e parallelo, coefficiente di risonanza e banda: 4-7-2000, 25-10-2001, 25-9-2003, 7-7-2008 [STORICO].`,
  formulario: ['w0', 'q-serie', 'q-par', 'banda', 'z-ris-serie', 'z-ris-par'],
};
