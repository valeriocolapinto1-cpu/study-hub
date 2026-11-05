const T = String.raw;
export const B4 = {};

B4['IV-01'] = {
  obiettivi: ['Definire la trasformata di Laplace unilatera', 'Conoscere le proprietà fondamentali', 'Dimostrare la proprietà della derivata'],
  teoria: [
    T`La trasformata unilatera di $x(t)$ (nulla per $t<0^-$) è $X(s)=\int_{0^-}^{\infty}x(t)e^{-st}\,dt$, con $s=\sigma+j\omega$, definita nel semipiano di convergenza. Il limite inferiore $0^-$ include gli impulsi in $t=0$ e rende naturali le condizioni iniziali $x(0^-)$.`,
    T`<strong>Proprietà.</strong> Linearità: $ax+by\to aX+bY$. Derivata: $\dot x\to sX-x(0^-)$; $\ddot x\to s^2X-sx(0^-)-\dot x(0^-)$. Integrale: $\int_{0^-}^{t}x\to X/s$. Ritardo: $x(t-T)u_{-1}(t-T)\to e^{-sT}X$. Traslazione in frequenza: $e^{-at}x\to X(s+a)$. Convoluzione: $x*y\to XY$.`,
    T`<strong>Teoremi dei valori.</strong> Valore iniziale: $x(0^+)=\lim_{s\to\infty}sX(s)$. Valore finale: $\lim_{t\to\infty}x(t)=\lim_{s\to0}sX(s)$ se tutti i poli di $sX(s)$ hanno parte reale negativa.`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Trasformata della derivata', enunciato: T`$\mathcal L\{\dot x\}=sX(s)-x(0^-)$.`, passi: [T`Per definizione $\mathcal L\{\dot x\}=\int_{0^-}^{\infty}\dot x(t)e^{-st}dt$.`, T`Integrando per parti: $\left[x(t)e^{-st}\right]_{0^-}^{\infty}+s\int_{0^-}^{\infty}x(t)e^{-st}dt$.`, T`Nella regione di convergenza il termine all'infinito è nullo: resta $-x(0^-)+sX(s)$. $\square$`] }],
  esempi: [
    { titolo: 'Derivata di un esponenziale', testo: T`$x=e^{-2t}u_{-1}(t)$, $x(0^-)=0$: verifica $\mathcal L\{\dot x\}$.`, soluzione: [T`$X=1/(s+2)$; $sX-0=\dfrac{s}{s+2}$.`, T`Diretto: $\dot x=-2e^{-2t}u_{-1}+\delta(t)\to\dfrac{-2}{s+2}+1=\dfrac{s}{s+2}$ ✓ (l'impulso compare grazie al limite $0^-$).`] },
    { titolo: 'Valori iniziale e finale', testo: T`$X(s)=\dfrac{3}{s(s+1)}$.`, soluzione: [T`$sX=\dfrac3{s+1}$: $x(0^+)=\lim_{s\to\infty}=0$, $x(\infty)=\lim_{s\to0}=3$ (il polo $-1$ è stabile).`] },
    { titolo: 'Ritardo', testo: T`$x(t)=e^{-t}u_{-1}(t)$ ritardato di $2$.`, soluzione: [T`$\mathcal L\{x(t-2)u_{-1}(t-2)\}=\dfrac{e^{-2s}}{s+1}$.`] },
  ],
  errori: [{ sbagliato: T`Usare il teorema del valore finale con poli sull'asse immaginario.`, corretto: T`Serve che $sX(s)$ abbia tutti i poli nel semipiano sinistro aperto.` }, { sbagliato: T`Dimenticare $x(0^-)$ nella trasformata della derivata.`, corretto: T`$\dot x\to sX-x(0^-)$.` }],
  esame: T`Laplace: proprietà e uso: 14-7-2000, 29-4-2002 (L–Z), 25-9-2007, 17-4-2008 [STORICO].`,
  formulario: ['laplace-def', 'laplace-lin', 'laplace-der', 'laplace-der2', 'laplace-int', 'laplace-ritardo', 'laplace-shift', 'laplace-conv', 'val-iniz', 'val-fin'],
};

B4['IV-02'] = {
  obiettivi: ['Conoscere le trasformate notevoli', 'Dedurle dalla definizione', 'Trasformare segnali a tratti con gradini ritardati'],
  teoria: [
    T`<div class="table-wrap"><table><thead><tr><th>$x(t)$ ($t>0$)</th><th>$X(s)$</th></tr></thead><tbody><tr><td>$\delta(t)$</td><td>$1$</td></tr><tr><td>$u_{-1}(t)$</td><td>$1/s$</td></tr><tr><td>$t$</td><td>$1/s^2$</td></tr><tr><td>$t^n/n!$</td><td>$1/s^{n+1}$</td></tr><tr><td>$e^{-at}$</td><td>$1/(s+a)$</td></tr><tr><td>$te^{-at}$</td><td>$1/(s+a)^2$</td></tr><tr><td>$\cos\omega t$</td><td>$s/(s^2+\omega^2)$</td></tr><tr><td>$\sin\omega t$</td><td>$\omega/(s^2+\omega^2)$</td></tr><tr><td>$e^{-at}\cos\omega t$</td><td>$(s+a)/((s+a)^2+\omega^2)$</td></tr><tr><td>$e^{-at}\sin\omega t$</td><td>$\omega/((s+a)^2+\omega^2)$</td></tr></tbody></table></div>`,
    T`Un segnale a tratti si scrive con gradini ritardati: l'impulso rettangolare $A[u_{-1}(t)-u_{-1}(t-T)]$ ha trasformata $A\,\dfrac{1-e^{-sT}}{s}$.`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Trasformata di $e^{-at}$ e del coseno', passi: [T`$\int_0^\infty e^{-at}e^{-st}dt=\left[-\dfrac{e^{-(s+a)t}}{s+a}\right]_0^\infty=\dfrac{1}{s+a}$ (per $\mathrm{Re}\,s>-a$).`, T`$\cos\omega t=\tfrac12(e^{j\omega t}+e^{-j\omega t})$: $\mathcal L=\tfrac12\left(\dfrac1{s-j\omega}+\dfrac1{s+j\omega}\right)=\dfrac{s}{s^2+\omega^2}$. $\square$`] }],
  esempi: [
    { titolo: 'Combinazione lineare', testo: T`$x(t)=3e^{-2t}+4\sin3t$.`, soluzione: [T`$X(s)=\dfrac{3}{s+2}+\dfrac{12}{s^2+9}$.`] },
    { titolo: 'Impulso rettangolare', testo: T`$x=3$ per $0<t<2$, nulla altrove.`, soluzione: [T`$x=3[u_{-1}(t)-u_{-1}(t-2)]$, $X(s)=\dfrac{3(1-e^{-2s})}{s}$.`] },
    { titolo: 'Rampa troncata', testo: T`$x=t$ per $0<t<1$, nulla altrove.`, soluzione: [T`$t\,u_{-1}(t)-t\,u_{-1}(t-1)$ e $t\,u_{-1}(t-1)=(t-1)u_{-1}(t-1)+u_{-1}(t-1)$.`, T`$X(s)=\dfrac1{s^2}-e^{-s}\left(\dfrac1{s^2}+\dfrac1s\right)$.`] },
  ],
  errori: [{ sbagliato: T`Trasformare $\cos\omega t$ come $\omega/(s^2+\omega^2)$.`, corretto: T`Il coseno dà $s/(s^2+\omega^2)$, il seno $\omega/(s^2+\omega^2)$.` }],
  esame: T`Trasformata di un segnale a tratti: 14-7-2000, 29-4-2002 (L–Z) [STORICO].`,
  formulario: ['l-delta', 'l-gradino', 'l-rampa', 'l-exp', 'l-cos', 'l-sin', 'l-texp', 'l-expcos', 'l-expsin', 'l-impulso-rett'],
};

B4['IV-03'] = {
  obiettivi: ['Scomporre una funzione razionale in fratti semplici', 'Antitrasformare termine a termine', 'Trattare poli doppi'],
  teoria: [
    T`Una $F(s)=N(s)/D(s)$ con $\deg N<\deg D$ si scompone in fratti semplici. Per un polo semplice $p$ il termine è $\dfrac{r}{s-p}$ con residuo $r=\lim_{s\to p}(s-p)F(s)$ e dà $re^{pt}$. Se $\deg N\ge\deg D$ si esegue prima la divisione (compare un termine polinomiale in $s$, cioè impulsi).`,
    T`Per un polo doppio $p$: $\dfrac{r_2}{(s-p)^2}+\dfrac{r_1}{s-p}$ con $r_2=\lim(s-p)^2F$, $r_1=\lim\dfrac{d}{ds}\left[(s-p)^2F\right]$; dà $(r_2t+r_1)e^{pt}$.`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'Due poli reali', testo: T`$F(s)=\dfrac{3s+5}{(s+1)(s+3)}$.`, soluzione: [T`$A=\left.\dfrac{3s+5}{s+3}\right|_{-1}=1$, $B=\left.\dfrac{3s+5}{s+1}\right|_{-3}=2$.`, T`$f(t)=e^{-t}+2e^{-3t}$ ($t>0$).`] },
    { titolo: 'Polo doppio', testo: T`$F(s)=\dfrac{1}{s(s+1)^2}$.`, soluzione: [T`$\dfrac1s-\dfrac1{s+1}-\dfrac1{(s+1)^2}$.`, T`$f(t)=1-e^{-t}-te^{-t}$.`, T`Verifica a $s=1$: $1-\tfrac12-\tfrac14=\tfrac14$ ✓.`] },
    { titolo: 'Grado uguale', testo: T`$F(s)=\dfrac{s+3}{s+1}$.`, soluzione: [T`$F=1+\dfrac2{s+1}$.`, T`$f(t)=\delta(t)+2e^{-t}u_{-1}(t)$.`] },
  ],
  errori: [{ sbagliato: T`Scomporre senza dividere quando $\deg N=\deg D$.`, corretto: T`Dividi prima: il quoziente dà un impulso.` }],
  esame: T`Antitrasformata con fratti semplici è il passo 6 dell'esercizio d'analisi [STORICO].`,
  formulario: ['residuo', 'polo-doppio'],
};

B4['IV-04'] = {
  obiettivi: ['Antitrasformare poli complessi coniugati', 'Ricondurre il denominatore a $(s+\\alpha)^2+\\omega^2$', 'Interpretare smorzamento e oscillazione'],
  teoria: [
    T`Poli $-\alpha\pm j\omega$ compaiono in coppie coniugate per coefficienti reali. Si scrive il denominatore come $(s+\alpha)^2+\omega^2$ e il numeratore come $a(s+\alpha)+c$: $$\mathcal L^{-1}\left\{\frac{as+b}{(s+\alpha)^2+\omega^2}\right\}=e^{-\alpha t}\left[a\cos\omega t+\frac{b-a\alpha}{\omega}\sin\omega t\right].$$`,
    T`$\alpha>0$: oscillazione smorzata; $\alpha=0$: oscillazione permanente (marginale); $\alpha<0$: crescente (instabile).`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'Poli immaginari puri', testo: T`$F(s)=\dfrac{2s+6}{s^2+9}$.`, soluzione: [T`$\alpha=0$, $\omega=3$, $a=2$, $b=6$: $f=2\cos3t+2\sin3t$.`] },
    { titolo: 'Poli con parte reale', testo: T`$F(s)=\dfrac{s+3}{s^2+2s+5}$.`, soluzione: [T`$(s+1)^2+4$: $\alpha=1$, $\omega=2$, $a=1$, $b=3$.`, T`$f=e^{-t}\left[\cos2t+\dfrac{3-1}{2}\sin2t\right]=e^{-t}(\cos2t+\sin2t)$.`] },
    { titolo: 'Ampiezza e fase', testo: T`Scrivi $e^{-t}(\cos2t+\sin2t)$ in ampiezza-fase.`, soluzione: [T`$\cos2t+\sin2t=\sqrt2\cos(2t-45^\circ)$.`, T`$f=\sqrt2e^{-t}\cos(2t-45^\circ)$.`] },
  ],
  errori: [{ sbagliato: T`Scomporre $s^2+2s+5$ in fattori reali.`, corretto: T`Ha radici complesse: si usa il completamento del quadrato.` }],
  esame: T`Antitrasformate con poli complessi coniugati: errore tipico elencato per l'esercizio d'analisi [STORICO].`,
  formulario: ['complessi-antitr'],
};

B4['IV-05'] = {
  obiettivi: ['Risolvere equazioni integro-differenziali con Laplace', 'Inserire le condizioni iniziali', 'Antitrasformare la soluzione'],
  teoria: [
    T`Si trasforma l'equazione con le proprietà di derivata e integrale, ottenendo un'equazione <em>algebrica</em> in $Y(s)$ con le condizioni iniziali già incluse; si risolve per $Y(s)$ e si antitrasforma con i fratti semplici.`,
    T`Il vantaggio rispetto al metodo classico (omogenea + particolare + costanti) è che condizioni iniziali e termine noto entrano nello stesso passaggio.`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'Libera del secondo ordine', testo: T`$\ddot y+3\dot y+2y=0$, $y(0^-)=1$, $\dot y(0^-)=0$.`, soluzione: [T`$s^2Y-s+3(sY-1)+2Y=0\Rightarrow Y=\dfrac{s+3}{(s+1)(s+2)}$.`, T`Fratti semplici: $\dfrac{2}{s+1}-\dfrac1{s+2}$, quindi $y=2e^{-t}-e^{-2t}$.`, T`Verifica: $y(0)=1$, $\dot y(0)=-2+2=0$ ✓.`] },
    { titolo: 'Con forzamento', testo: T`$\dot y+2y=u_{-1}(t)$, $y(0^-)=0$.`, soluzione: [T`$(s+2)Y=1/s\Rightarrow Y=\dfrac1{s(s+2)}=\tfrac12\left(\dfrac1s-\dfrac1{s+2}\right)$.`, T`$y=\tfrac12(1-e^{-2t})$.`] },
    { titolo: 'Equazione integro-differenziale', testo: T`$\dot y+y+\int_0^ty\,d\tau=u_{-1}(t)$, $y(0^-)=0$.`, soluzione: [T`$sY+Y+Y/s=1/s\Rightarrow Y=\dfrac{1}{s^2+s+1}$.`, T`$(s+\tfrac12)^2+\tfrac34$: $y=\dfrac{2}{\sqrt3}e^{-t/2}\sin\dfrac{\sqrt3}{2}t$.`] },
  ],
  errori: [{ sbagliato: T`Dimenticare $y(0^-)$ nella derivata.`, corretto: T`$\dot y\to sY-y(0^-)$.` }],
  esame: T`Laplace e uso su equazioni: 25-9-2007, 17-4-2008 [STORICO].`,
  formulario: ['laplace-der', 'laplace-der2'],
};

B4['IV-06'] = {
  obiettivi: ['Trasformare un circuito con memoria nel dominio di Laplace', 'Usare impedenze $R$, $sL$, $1/(sC)$', 'Risolvere con partitori e maglie'],
  teoria: [
    T`Nel dominio di $s$ gli elementi diventano: $R$, $sL$, $\dfrac1{sC}$, con le condizioni iniziali come generatori (IV-07). KCL e KVL restano valide; il circuito è un circuito «resistivo» con impedenze $Z(s)$ risolvibile con partitori, nodi e maglie.`,
    T`Un generatore costante $V_0u_{-1}(t)$ diventa $V_0/s$; un generatore sinusoidale $V_m\cos\omega t$ diventa $V_ms/(s^2+\omega^2)$.`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'RC con gradino e condizione iniziale', testo: T`$R=2$, $C=\tfrac12$, $v_g=10u_{-1}(t)$, $v_C(0^-)=2$.`, soluzione: [T`Modello serie: $I=\dfrac{10/s-2/s}{2+2/s}=\dfrac{4}{s+1}$.`, T`$V_C=\dfrac{I}{sC}+\dfrac2s=\dfrac{8}{s(s+1)}+\dfrac2s=\dfrac{10}{s}-\dfrac8{s+1}$.`, T`$v_C=10-8e^{-t}$ ✓ (stesso risultato di III-01).`] },
    { titolo: 'Funzione di trasferimento di un RC', testo: T`Uscita sul condensatore, $R=C=1$.`, soluzione: [T`Partitore: $H(s)=\dfrac{1/s}{1+1/s}=\dfrac{1}{s+1}$.`] },
    { titolo: 'RL con generatore sinusoidale', testo: T`$R=1$, $L=1$, $v_g=\cos t$, $i(0)=0$: $I(s)$.`, soluzione: [T`$I=\dfrac{V_g}{R+sL}=\dfrac{s}{(s+1)(s^2+1)}$.`] },
  ],
  errori: [{ sbagliato: T`Usare $j\omega L$ invece di $sL$ nel transitorio.`, corretto: T`$s$ è la variabile complessa; $s=j\omega$ solo per il regime.` }],
  esame: T`Metodo di Laplace per i circuiti con memoria (condizioni iniziali come generatori) [UFFICIALE].`,
  formulario: ['imped-s', 'l-cos-gen'],
};

B4['IV-07'] = {
  obiettivi: ['Modellare $L$ e $C$ con condizioni iniziali', 'Passare tra modello serie e parallelo', 'Applicare il modello al calcolo di $V_{out}(s)$'],
  teoria: [
    T`<strong>Condensatore.</strong> $V=\dfrac1{sC}I+\dfrac{v_C(0^-)}{s}$: impedenza $1/(sC)$ in serie con un generatore di tensione $v_C(0^-)/s$; oppure $I=sCV-Cv_C(0^-)$: ammettenza $sC$ in parallelo con un generatore di corrente $Cv_C(0^-)$.`,
    T`<strong>Induttore.</strong> $V=sLI-Li_L(0^-)$: impedenza $sL$ in serie con un generatore $-Li_L(0^-)$ (verso opposto alla caduta); oppure $I=\dfrac{V}{sL}+\dfrac{i_L(0^-)}{s}$: $sL$ in parallelo con un generatore di corrente $i_L(0^-)/s$.`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Modelli di $L$ e $C$ con condizioni iniziali', passi: [T`$C$: $i=C\,dv/dt\Rightarrow I=C[sV-v(0^-)]\Rightarrow V=\dfrac{I}{sC}+\dfrac{v(0^-)}{s}$.`, T`$L$: $v=L\,di/dt\Rightarrow V=L[sI-i(0^-)]=sLI-Li(0^-)$. $\square$`] }],
  esempi: [
    { titolo: 'RL libera', testo: T`$R=4\,\Omega$, $L=2\,\mathrm H$, $i_L(0^-)=3\,\mathrm A$, generatori spenti. Trova $i_L(t)$.`, soluzione: [T`$(R+sL)I=Li_0\Rightarrow I=\dfrac{2\cdot3}{4+2s}=\dfrac{3}{s+2}$.`, T`$i_L=3e^{-2t}\,\mathrm A$ ($\tau=L/R=\tfrac12$ ✓).`] },
    { titolo: 'RC libera', testo: T`$R=2$, $C=1$, $v_C(0^-)=4$.`, soluzione: [T`$V_C=\dfrac{4}{s+1/2}$, $v_C=4e^{-t/2}$.`] },
    { titolo: 'Uscita su un resistore', testo: T`Stesso RC: tensione sul resistore dopo $t=0$.`, soluzione: [T`$v_R=-v_C$ (KVL, generatori spenti): $v_R=-4e^{-t/2}$ — a $t=0^+$ salta da $v_R(0^-)$ a $-4$ (la tensione sul resistore non è continua).`] },
  ],
  errori: [{ sbagliato: T`Mettere il generatore $v_C(0^-)/s$ con polarità sbagliata.`, corretto: T`Dalla KVL: caduta su $1/(sC)$ più $v_C(0^-)/s$ uguale alla tensione ai morsetti.` }],
  esame: T`Condizioni iniziali come generatori: passo 4 dell'esercizio d'analisi [STORICO].`,
  formulario: ['modello-c-serie', 'modello-c-par', 'modello-l-serie', 'modello-l-par'],
};
