import { F2 } from './figure2.mjs';
const T = String.raw;
export const B3 = {};

B3['III-01'] = {
  obiettivi: ['Risolvere un circuito del primo ordine con eccitazione costante o variabile', 'Scrivere risposta libera e forzata', 'Calcolare la costante di tempo con $R_{eq}$'],
  teoria: [
    T`Un circuito con un solo elemento di memoria e generatori indipendenti è descritto da $\dot x+\dfrac{x}{\tau}=\dfrac{f(t)}{\tau}$, con $x=v_C$ o $i_L$, $\tau=R_{eq}C$ oppure $L/R_{eq}$ ($R_{eq}$ vista dai morsetti dell'elemento con memoria, indipendenti spenti, controllati non spenti).`,
    T`<strong>Eccitazione costante.</strong> $x(t)=x_\infty+(x_0-x_\infty)e^{-t/\tau}$ con $x_\infty$ valore di regime ($C$ aperto, $L$ corto) e $x_0=x(0^-)$ (continuità di $v_C$, $i_L$). Questa è la regola del «valore iniziale, valore finale, costante di tempo».`,
    T`<strong>Eccitazione variabile.</strong> $x(t)=x_0e^{-t/\tau}+\dfrac1\tau\int_0^te^{-(t-s)/\tau}f(s)\,ds$: somma di risposta libera (dipende da $x_0$) e forzata (dipende da $f$). Per un ingresso sinusoidale la forzata contiene una parte di regime sinusoidale e una transitoria $\propto e^{-t/\tau}$.`,
  ],
  figure: [{ alt: 'Circuito RC serie con generatore di tensione v_g, resistore R e condensatore C; si osserva v_C', svg: F2.rc }],
  dimostrazioni: [{ titolo: 'Soluzione dell\'equazione del primo ordine', enunciato: T`La soluzione di $\dot x+a\,x=g(t)$, $x(0)=x_0$ è $x(t)=e^{-at}x_0+\int_0^te^{-a(t-s)}g(s)\,ds$.`, passi: [T`Moltiplica per $e^{at}$: $\dfrac{d}{dt}\left(e^{at}x\right)=e^{at}g(t)$.`, T`Integra da $0$ a $t$: $e^{at}x(t)-x_0=\int_0^te^{as}g(s)ds$.`, T`Moltiplica per $e^{-at}$ e riordina. Con $a=1/\tau$ e $g=f/\tau$ si ha la formula del testo. $\square$`] }],
  esempi: [
    { titolo: 'RC con gradino', testo: T`$R=2\,\Omega$, $C=\tfrac12\,\mathrm F$, $v_g=10\,\mathrm V$ per $t>0$, $v_C(0)=2\,\mathrm V$. Trova $v_C(t)$.`, soluzione: [T`$\tau=RC=1\,\mathrm s$, $v_\infty=10$, $v_0=2$.`, T`$v_C(t)=10+(2-10)e^{-t}=10-8e^{-t}\,\mathrm V$ per $t>0$.`] },
    { titolo: 'RL con gradino', testo: T`$L=3\,\mathrm H$, $R=6\,\Omega$, $v_g=12\,\mathrm V$ per $t>0$, $i_L(0)=0$. Trova $i_L(t)$.`, soluzione: [T`$\tau=L/R=\tfrac12\,\mathrm s$, $i_\infty=12/6=2\,\mathrm A$.`, T`$i_L(t)=2\left(1-e^{-2t}\right)\,\mathrm A$.`] },
    { titolo: 'Ingresso sinusoidale', testo: T`$\dot y+y=\cos t$, $y(0)=0$ ($\tau=1$). Trova $y(t)$.`, soluzione: [T`Regime: fasore $\dot Y=\dfrac1{1+j}=\tfrac12-\tfrac12j$, quindi $y_p=\tfrac12\cos t+\tfrac12\sin t$.`, T`Transitorio $Ae^{-t}$ con $y(0)=\tfrac12+A=0\Rightarrow A=-\tfrac12$.`, T`$y(t)=\tfrac12\cos t+\tfrac12\sin t-\tfrac12e^{-t}$ per $t>0$.`] },
  ],
  errori: [{ sbagliato: T`Usare $R$ del generatore o di una resistenza qualsiasi come $R_{eq}$.`, corretto: T`$R_{eq}$ è la resistenza vista dai morsetti dell'elemento con memoria con gli indipendenti spenti.` }, { sbagliato: T`Imporre $x(0^+)=0$ perché «il generatore è partito da zero».`, corretto: T`$x(0^+)=x(0^-)$ con il valore raggiunto nel regime precedente.` }],
  esame: T`Costante di tempo e scarica/carica RC: 14-7-2000, 3-7-2001, 18-9-2002, 25-9-2007, 17-4-2008; è il cuore dell'esercizio d'analisi [STORICO].`,
  formulario: ['tau-rc', 'tau-rl', 'sol-primo-ordine', 'regola-vfc'],
};

B3['III-02'] = {
  obiettivi: ['Associare a una sinusoide il suo fasore e viceversa', 'Eseguire somme e derivate con i fasori', 'Passare tra forma $a\\cos+b\\sin$ e ampiezza-fase'],
  teoria: [
    T`A $v(t)=V_m\cos(\omega t+\varphi)$ si associa il <strong>fasore</strong> $\dot V=V_me^{j\varphi}$, con $v(t)=\mathrm{Re}\{\dot Ve^{j\omega t}\}$. Il fasore è un numero complesso costante: la dipendenza dal tempo è nel fattore $e^{j\omega t}$, comune a tutte le grandezze e sottinteso.`,
    T`La corrispondenza è lineare: somma di sinusoidi alla stessa frequenza ↔ somma di fasori. La derivata ↔ moltiplicazione per $j\omega$, l'integrale ↔ divisione per $j\omega$. Il seno si riduce al coseno: $\sin\omega t=\cos(\omega t-90^\circ)$, fasore $-j$.`,
    T`Forma cartesiana ↔ ampiezza-fase: $a\cos\omega t+b\sin\omega t=\mathrm{Re}\{(a-jb)e^{j\omega t}\}=\sqrt{a^2+b^2}\cos(\omega t-\arctan(b/a))$ (per $a>0$; in generale $\varphi=\mathrm{atan2}(-b,a)$).`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'Somma di una sinusoide e una cosinusoide', testo: T`Scrivi $3\cos t+4\sin t$ in ampiezza-fase.`, soluzione: [T`Fasore: $3-4j$, modulo $5$, fase $-\arctan(4/3)\approx-53{,}13^\circ$.`, T`$3\cos t+4\sin t=5\cos(t-53{,}13^\circ)$.`] },
    { titolo: 'Derivata di una sinusoide', testo: T`$v(t)=10\cos(2t+30^\circ)$. Trova $\dot v$.`, soluzione: [T`$\dot V=10e^{j30^\circ}$; $j\omega\dot V=2e^{j90^\circ}\cdot10e^{j30^\circ}=20e^{j120^\circ}$.`, T`$\dot v=20\cos(2t+120^\circ)=-20\sin(2t+30^\circ)$ ✓.`] },
    { titolo: 'Fasore di un seno', testo: T`Fasore di $5\sin(3t)$ nella convenzione del coseno?`, soluzione: [T`$5\sin3t=5\cos(3t-90^\circ)$, quindi $\dot V=5e^{-j90^\circ}=-5j$.`] },
  ],
  errori: [{ sbagliato: T`Dimenticare che il seno ha fase $-90^\circ$ rispetto al coseno e usare il fasore $+5j$.`, corretto: T`$\sin\omega t\leftrightarrow-j$.` }, { sbagliato: T`Confondere ampiezza di picco ed efficace: $V_m=\sqrt2V$.`, corretto: T`Dichiara sempre se i fasori sono di picco o efficaci (cambia $P$, $Q$).` }],
  esame: T`Fasori: validità e applicabilità: 1-6-2000, 13-2-2002, 29-4-2002 (A–I), 23-9-2008 [STORICO].`,
  formulario: ['fasore', 'fasore-sin', 'deriv-fasore', 'cos-sin-ampl'],
};

B3['III-03'] = {
  obiettivi: ['Definire impedenza e ammettenza', 'Scrivere le impedenze di $R$, $L$, $C$', 'Ridurre reti con serie, parallelo e partitori complessi'],
  teoria: [
    T`In regime sinusoidale un bipolo lineare ha <strong>impedenza</strong> $Z=\dot V/\dot I$ (convenzione degli utilizzatori) e <strong>ammettenza</strong> $Y=1/Z$. $Z=R+jX$: $R$ resistenza, $X$ reattanza; $Y=G+jB$.`,
    T`$Z_R=R$, $Z_L=j\omega L$, $Z_C=\dfrac1{j\omega C}=-\dfrac{j}{\omega C}$. Il <strong>circuito fittizio nel dominio dei fasori</strong> si ottiene sostituendo ogni bipolo con la sua impedenza e ogni generatore con il suo fasore: valgono KCL, KVL, serie, parallelo, partitori, Thevenin, nodi e maglie con numeri complessi.`,
    T`Un induttore ha reattanza positiva (ritarda la corrente rispetto alla tensione), un condensatore negativa. A bassa frequenza $C$ si comporta come aperto e $L$ come corto; ad alta frequenza il contrario.`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'RL serie', testo: T`$R=3\,\Omega$, $L=2\,\mathrm H$, $\omega=2\,\mathrm{rad/s}$. Trova $Z$ e $Y$.`, soluzione: [T`$Z=3+j\cdot2\cdot2=3+4j=5e^{j53{,}13^\circ}$.`, T`$Y=\dfrac1Z=\dfrac{3-4j}{25}=0{,}12-0{,}16j\,\mathrm S$.`] },
    { titolo: 'RC parallelo', testo: T`$R=1\,\Omega$ in parallelo a $C=1\,\mathrm F$, $\omega=1$. Trova $Z$.`, soluzione: [T`$Y=1+j$, $Z=\dfrac1{1+j}=\tfrac12-\tfrac12j$.`] },
    { titolo: 'Partitore complesso', testo: T`$R=1$ in serie con $C=1$ ($\omega=1$), $\dot V_g=1$. Tensione sul condensatore?`, soluzione: [T`$\dot V_C=\dot V_g\dfrac{-j}{1-j}=\dfrac{-j(1+j)}{2}=\dfrac{1-j}{2}$.`] },
  ],
  errori: [{ sbagliato: T`Scrivere $Z_C=j\omega C$.`, corretto: T`$Z_C=1/(j\omega C)=-j/(\omega C)$.` }],
  esame: T`Impedenze e partitori complessi sono alla base della parte «$t<0$ sinusoidale» dell'esercizio d'analisi [STORICO].`,
  formulario: ['imped-r', 'imped-l', 'imped-c', 'ammettenza', 'serie-imped', 'part-v-fasori'],
};

B3['III-04'] = {
  obiettivi: ['Enunciare le condizioni di validità del metodo dei fasori', 'Dimostrarle', 'Riconoscere i casi in cui non si applica'],
  teoria: [
    T`Il metodo dei fasori fornisce la <em>risposta di regime</em> (permanente) di un circuito <strong>lineare, tempo-invariante</strong> (a costanti concentrate) con generatori <strong>sinusoidali alla stessa frequenza</strong>, purché il circuito sia <strong>stabile</strong> (il transitorio si esaurisce).`,
    T`Non si applica a elementi non lineari (diodi, saturazioni) né a elementi tempo-varianti, né fornisce il transitorio. Con generatori a frequenze diverse si analizzano separatamente e si sommano le risposte <em>nel tempo</em>.`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Condizioni di validità del metodo dei fasori', enunciato: T`In un circuito lineare tempo-invariante con ingressi $x(t)=\mathrm{Re}\{Xe^{j\omega t}\}$ esiste una soluzione particolare $y_p(t)=\mathrm{Re}\{Ye^{j\omega t}\}$ con $Y$ ottenuto risolvendo equazioni algebriche in $j\omega$; se il circuito è stabile, $y_p$ è la risposta di regime.`, passi: [T`Le equazioni del circuito sono differenziali lineari a coefficienti costanti: $\sum a_k\,y^{(k)}=\sum b_k\,x^{(k)}$.`, T`Poiché $\frac{d}{dt}e^{j\omega t}=j\omega e^{j\omega t}$, ponendo $x=Xe^{j\omega t}$ e $y=Ye^{j\omega t}$ ogni derivata si riduce a una moltiplicazione per $j\omega$: $\left(\sum a_k(j\omega)^k\right)Y=\left(\sum b_k(j\omega)^k\right)X$.`, T`Se $D(j\omega)=\sum a_k(j\omega)^k\neq0$, $Y=H(j\omega)X$. I coefficienti sono reali, quindi $\mathrm{Re}\{\cdot\}$ commuta con l'operatore: $y_p=\mathrm{Re}\{Ye^{j\omega t}\}$ risolve l'equazione per l'ingresso reale $\mathrm{Re}\{Xe^{j\omega t}\}$.`, T`La soluzione generale è $y_p$ più la risposta libera: se i poli hanno parte reale negativa questa decade e resta $y_p$ (regime). Se il sistema è instabile non esiste un regime. $\square$`] }],
  esempi: [
    { titolo: 'Frequenze diverse', testo: T`$v_g=\cos t+\cos2t$ su un RC serie ($R=C=1$). Trova $v_C$ a regime.`, soluzione: [T`$\omega=1$: $\dfrac1{1+j}=\tfrac12-\tfrac12j\Rightarrow\tfrac12\cos t+\tfrac12\sin t$.`, T`$\omega=2$: $\dfrac1{1+2j}=\dfrac{1-2j}5\Rightarrow\tfrac15\cos2t+\tfrac25\sin2t$.`, T`$v_C=\tfrac12\cos t+\tfrac12\sin t+\tfrac15\cos2t+\tfrac25\sin2t$: somma <em>nel tempo</em>.`] },
    { titolo: 'Un caso in cui non si applica', testo: T`Un diodo in serie a un resistore con generatore $\cos\omega t$: si possono usare i fasori?`, soluzione: [T`No: il diodo è non lineare, la risposta contiene armoniche e componente continua non descrivibili con un solo fasore.`] },
    { titolo: 'Circuito instabile', testo: T`$H(s)=\dfrac{1}{s-1}$ con ingresso $\cos t$: ha senso $H(j)$?`, soluzione: [T`$H(j)$ esiste ma non descrive un regime: il modo $e^{t}$ diverge e la soluzione non tende a una sinusoide.`] },
  ],
  errori: [{ sbagliato: T`Sommare fasori di frequenze diverse.`, corretto: T`Sommare le risposte nel tempo.` }, { sbagliato: T`Usare i fasori per il transitorio dopo un'accensione.`, corretto: T`Il transitorio richiede Laplace o l'equazione differenziale.` }],
  esame: T`Fasori: validità e applicabilità a un circuito dato: 1-6-2000, 13-2-2002, 29-4-2002 (A–I), 23-9-2008 [STORICO]. Dimostrazione richiesta.`,
  formulario: ['fasori-validita', 'hjw-def'],
};

B3['III-05'] = {
  obiettivi: ['Applicare la sovrapposizione nel tempo con generatori a frequenze diverse', 'Trattare insieme continua e sinusoidale', 'Calcolare la condizione iniziale nel caso misto'],
  teoria: [
    T`In un circuito lineare con più generatori a frequenze diverse (la continua è frequenza zero) la risposta è la somma delle risposte a ciascun generatore, ciascuna calcolata con il proprio metodo: continua con $C$ aperto e $L$ corto, sinusoidale con i fasori a quella $\omega$.`,
    T`Mai sommare fasori di frequenze diverse: sono numeri associati a $e^{j\omega_kt}$ diversi. La somma si fa sulle espressioni nel tempo.`,
    T`<strong>Condizione iniziale nel caso misto.</strong> $x(0^-)=x_{dc}+\sum_k\mathrm{Re}\{X_k\}$ (il valore a $t=0$ di ogni termine $\mathrm{Re}\{X_ke^{j\omega_kt}\}$ è $\mathrm{Re}\{X_k\}$).`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'Continua più sinusoidale', testo: T`RC serie ($R=C=1$), $v_g=4+\cos t$ per $t<0$. Trova $v_C(t)$ per $t<0$ e $v_C(0^-)$.`, soluzione: [T`Continua: $v_C^{dc}=4$.`, T`Sinusoidale ($\omega=1$): $\tfrac12\cos t+\tfrac12\sin t$.`, T`$v_C(t)=4+\tfrac12\cos t+\tfrac12\sin t$; $v_C(0^-)=4+\tfrac12=\tfrac92$.`] },
    { titolo: 'Due sinusoidi', testo: T`Condizione iniziale per $v_C=\tfrac12\cos t+\tfrac12\sin t+\tfrac15\cos2t+\tfrac25\sin2t$.`, soluzione: [T`Valore a $t=0$: $\tfrac12+\tfrac15=\tfrac7{10}$ (i seni valgono $0$).`] },
    { titolo: 'Errore tipico', testo: T`Un allievo somma i moduli: $|X_1|+|X_2|$ come ampiezza totale. Perché è sbagliato?`, soluzione: [T`Le due sinusoidi hanno frequenze diverse: l'ampiezza totale non è la somma dei moduli: l'espressione nel tempo è la somma delle due sinusoidi. Il valore a $t=0$ è la somma dei valori istantanei.`] },
  ],
  errori: [{ sbagliato: T`Usare il modulo del fasore come condizione iniziale.`, corretto: T`Serve il valore all'istante $t=0$: la parte reale del fasore.` }],
  esame: T`Ingresso misto continua + sinusoidale: 1 caso su 14 negli esercizi 2015–2024 [STORICO].`,
  formulario: ['sovrapposizione', 'cond-iniz-mista'],
};

B3['III-06'] = {
  obiettivi: ['Definire P, Q, S e il fattore di potenza', 'Dimostrare $Q=2\\omega(W_L-W_C)$', 'Calcolare le potenze da $v(t)$ e $i(t)$'],
  teoria: [
    T`Con $v=V_m\cos\omega t$, $i=I_m\cos(\omega t-\varphi)$ la potenza istantanea è $p=\tfrac12V_mI_m[\cos\varphi+\cos(2\omega t-\varphi)]$. La <strong>potenza attiva</strong> è il valor medio: $P=\tfrac12V_mI_m\cos\varphi=VI\cos\varphi$ (efficaci $V=V_m/\sqrt2$). La <strong>reattiva</strong> è $Q=VI\sin\varphi$, la <strong>complessa</strong> $S=\dot V\dot I^*=P+jQ$, l'<strong>apparente</strong> $|S|=VI$. Il <strong>fattore di potenza</strong> è $\cos\varphi=P/|S|$.`,
    T`Per un bipolo di impedenza $Z=R+jX$ con corrente efficace $I$: $P=RI^2$, $Q=XI^2$. Per $R$: $Q=0$; per $L$: $Q=\omega LI^2>0$; per $C$: $Q=-I^2/(\omega C)<0$ (convenzione degli utilizzatori).`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Relazione tra potenza reattiva ed energie medie', enunciato: T`In regime sinusoidale, per un circuito con induttori e condensatori, $Q=2\omega(W_L-W_C)$, con $W_L$, $W_C$ somme delle energie medie immagazzinate.`, passi: [T`Induttore: $Q_L=\omega LI^2$ (efficace). L'energia istantanea $\tfrac12Li^2$ ha valor medio $W_L=\tfrac12L\,\overline{i^2}=\tfrac12LI^2$, quindi $Q_L=2\omega W_L$.`, T`Condensatore: $Q_C=-\dfrac{I^2}{\omega C}=-\omega CV_C^2$ e $W_C=\tfrac12CV_C^2$ (efficace), quindi $Q_C=-2\omega W_C$.`, T`Resistore: $Q_R=0$ e nessuna energia immagazzinata.`, T`Per la conservazione della potenza complessa (Tellegen) la reattiva totale assorbita dagli elementi è nulla se si include il generatore; la reattiva erogata dai generatori è la somma $\sum Q_k=2\omega(W_L-W_C)$ degli elementi passivi. $\square$`] }],
  esempi: [
    { titolo: 'Potenze da $v(t)$ e $i(t)$', testo: T`$v=20\cos\omega t$, $i=4\cos(\omega t-\varphi)$, $\cos\varphi=3/5$ ($\sin\varphi=4/5$). Trova $P$, $Q$, $|S|$.`, soluzione: [T`$\tfrac12V_mI_m=40$.`, T`$P=40\cdot\tfrac35=24\,\mathrm W$, $Q=40\cdot\tfrac45=32\,\mathrm{var}$, $|S|=40\,\mathrm{VA}$ (verifica: $\sqrt{24^2+32^2}=40$).`] },
    { titolo: 'Da $Z$ alle potenze', testo: T`$Z=3+4j\,\Omega$, corrente efficace $I=2\,\mathrm A$.`, soluzione: [T`$P=RI^2=12\,\mathrm W$, $Q=XI^2=16\,\mathrm{var}$, $|S|=20\,\mathrm{VA}$, $\cos\varphi=0{,}6$.`] },
    { titolo: 'Fattore di potenza', testo: T`$P=300\,\mathrm W$, $Q=400\,\mathrm{var}$.`, soluzione: [T`$|S|=500\,\mathrm{VA}$, $\cos\varphi=0{,}6$ (carico induttivo).`] },
  ],
  errori: [{ sbagliato: T`Usare $P=V_mI_m\cos\varphi$ con valori di picco.`, corretto: T`Con picchi serve il fattore $\tfrac12$; con efficaci no.` }],
  esame: T`Potenze attiva, reattiva, complessa, fattore di potenza; $Q\leftrightarrow$ energia media: 1-6-2000, 14-7-2000, 15-9-2000, 13-2-2001, 13-2-2002, 12-7-2005, 12-7-2007, 25-9-2007, 11-2-2008 [STORICO].`,
  formulario: ['p-picco', 'p-eff', 'q-eff', 's-compl', 'cosphi', 'p-ri2', 'q-xi2', 'q-energia'],
};

B3['III-07'] = {
  obiettivi: ['Dimostrare la conservazione della potenza complessa', 'Fare il bilancio delle potenze di un circuito', 'Capire cosa si conserva (P e Q) e cosa no'],
  teoria: [
    T`In regime sinusoidale la somma delle potenze complesse assorbite da tutti i rami (generatori inclusi, convenzione degli utilizzatori) è nulla: $\sum_k\dot V_k\dot I_k^*=0$. Quindi si conservano separatamente $\sum P_k=0$ e $\sum Q_k=0$, mentre i moduli $|S_k|$ non si conservano.`,
    T`<strong>Bilancio.</strong> La potenza attiva erogata dai generatori è uguale a quella assorbita dai resistori; la reattiva erogata è uguale alla reattiva assorbita da induttori e condensatori (con segno).`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Conservazione della potenza complessa', enunciato: T`$\sum_k\dot V_k\dot I_k^*=0$ (valori efficaci, convenzione degli utilizzatori).`, passi: [T`I fasori $\dot{\mathbf V}$ soddisfano la KVL e $\dot{\mathbf I}$ la KCL (le equazioni hanno coefficienti reali $0,\pm1$).`, T`Anche $\dot{\mathbf I}^*$ soddisfa la KCL, perché la coniugazione conserva le equazioni a coefficienti reali.`, T`Per il teorema di Tellegen $\dot{\mathbf V}^{\mathsf T}\dot{\mathbf I}^*=0$, cioè $\sum_k\dot V_k\dot I_k^*=0$. Parte reale: $\sum P_k=0$; parte immaginaria: $\sum Q_k=0$. $\square$`] }],
  esempi: [
    { titolo: 'Bilancio su RL serie', testo: T`$\dot V_g=10\,\mathrm V$ (efficace) su $R=3\,\Omega$ in serie a $X_L=4\,\Omega$. Verifica il bilancio.`, soluzione: [T`$\dot I=\dfrac{10}{3+4j}=1{,}2-1{,}6j$, $|I|^2=4$.`, T`Generatore (erogata): $S=\dot V\dot I^*=10(1{,}2+1{,}6j)=12+16j$.`, T`Assorbite: $R$: $P=3\cdot4=12$; $L$: $Q=4\cdot4=16$. Quadra. ✓`] },
    { titolo: 'Cosa non si conserva', testo: T`In un circuito $|S_g|=20$, $|S_R|=12$, $|S_L|=16$. Si conservano i moduli?`, soluzione: [T`$12+16=28\ne20$: i moduli no; si conservano $P$ ($12$) e $Q$ ($16$).`] },
    { titolo: 'Reattiva con condensatore', testo: T`Carico $P=12$, $Q_L=16$ con un condensatore che assorbe $Q_C=-16$.`, soluzione: [T`$\sum Q=16-16=0$: il generatore eroga solo potenza attiva: rifasamento completo.`] },
  ],
  errori: [{ sbagliato: T`Sommare le potenze apparenti dei rami.`, corretto: T`Si sommano le potenze complesse (o $P$ e $Q$ separatamente).` }],
  esame: T`Conservazione e bilancio: 12-7-2005, 12-7-2007, 25-9-2007, 11-2-2008 [STORICO].`,
  formulario: ['cons-s', 'bilancio-p'],
};

B3['III-08'] = {
  obiettivi: ['Spiegare lo scopo del rifasamento', 'Calcolare la capacità di rifasamento', 'Verificare il risultato con la potenza reattiva'],
  teoria: [
    T`Un carico induttivo con $P$ e $\cos\varphi_1$ assorbe $Q_1=P\tan\varphi_1$. Collegando in parallelo un condensatore $C$, la tensione sul carico non cambia e il condensatore assorbe $Q_C=-\omega CV^2$. La reattiva totale diventa $Q_2=Q_1-\omega CV^2=P\tan\varphi_2$, con $\varphi_2$ nuovo sfasamento.`,
    T`$$C=\frac{P(\tan\varphi_1-\tan\varphi_2)}{\omega V^2}\quad(V\text{ efficace}).$$ Lo scopo è ridurre la corrente (e quindi le perdite) a parità di $P$: $I=P/(V\cos\varphi)$.`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'Rifasamento completo', testo: T`$P=100\,\mathrm W$, $V=10\,\mathrm V$, $\omega=10\,\mathrm{rad/s}$, $\cos\varphi_1=0{,}8$ (induttivo), $\cos\varphi_2=1$.`, soluzione: [T`$\tan\varphi_1=3/4$, $\tan\varphi_2=0$.`, T`$C=\dfrac{100\cdot0{,}75}{10\cdot100}=0{,}075\,\mathrm F$.`, T`Verifica: $Q_1=75\,\mathrm{var}$, $Q_C=-\omega CV^2=-10\cdot0{,}075\cdot100=-75$: reattiva totale nulla. ✓`] },
    { titolo: 'Rifasamento parziale', testo: T`Stesso carico, ma si vuole $\cos\varphi_2=12/13$ ($\tan\varphi_2=5/12$).`, soluzione: [T`$C=\dfrac{100(3/4-5/12)}{1000}=\dfrac{100\cdot1/3}{1000}=\tfrac1{30}\approx0{,}0333\,\mathrm F$.`] },
    { titolo: 'Corrente prima e dopo', testo: T`Stesso carico: confronta le correnti efficaci prima e dopo il rifasamento completo.`, soluzione: [T`Prima: $I_1=P/(V\cos\varphi_1)=100/(10\cdot0{,}8)=12{,}5\,\mathrm A$. Dopo: $I_2=100/10=10\,\mathrm A$.`] },
  ],
  errori: [{ sbagliato: T`Collegare l'induttore di rifasamento (invece del condensatore) o il condensatore in serie.`, corretto: T`Il condensatore va in parallelo al carico induttivo.` }],
  esame: T`Rifasamento: 19-6-2002 [STORICO].`,
  formulario: ['rifasamento-c', 'q-c'],
};
