import { F2 } from './figure2.mjs';
const T = String.raw;
export const B6 = {};

B6['VI-01'] = {
  obiettivi: ['Enunciare il teorema di sostituzione', 'Precisarne le condizioni', 'Usarlo per semplificare un circuito'],
  teoria: [
    T`<strong>Teorema di sostituzione.</strong> Se un circuito ha soluzione unica e un suo bipolo (o una sua porta) ha tensione $v^*$ e corrente $i^*$ nella soluzione, esso può essere sostituito con un generatore ideale di tensione $v^*$ o con un generatore ideale di corrente $i^*$ senza modificare tensioni e correnti del resto del circuito, purché il circuito modificato abbia ancora soluzione unica.`,
    T`Il teorema non richiede la linearità. Serve da base per Thevenin, Norton e per l'analisi per parti (si sostituisce una parte con un generatore equivalente).`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Sostituzione con un generatore', passi: [T`Siano $(\mathbf v^*,\mathbf i^*)$ la soluzione del circuito originale.`, T`Nel circuito modificato le equazioni (KCL, KVL e costitutive degli elementi rimasti) sono le stesse di prima, salvo la relazione del bipolo sostituito, che diventa $v=v^*$ (o $i=i^*$).`, T`$(\mathbf v^*,\mathbf i^*)$ le soddisfa tutte: il bipolo sostituito ha proprio $v=v^*$. Se la soluzione del modificato è unica, coincide con $(\mathbf v^*,\mathbf i^*)$. $\square$`] }],
  esempi: [
    { titolo: 'Sostituire un resistore', testo: T`$V=12$, $R_1=2$, $R_2=4$ in serie; la tensione su $R_2$ è $8\,\mathrm V$. Sostituisci $R_2$.`, soluzione: [T`$R_2\to$ generatore di tensione $8\,\mathrm V$: la corrente in $R_1$ è $\dfrac{12-8}{2}=2\,\mathrm A$, come prima ($12/6$).`] },
    { titolo: 'Sostituzione con corrente', testo: T`Stesso circuito: $R_2\to$ generatore di corrente $2\,\mathrm A$.`, soluzione: [T`La tensione su $R_1$ è $2\cdot2=4\,\mathrm V$, quella sul generatore $8\,\mathrm V$: identiche ✓.`] },
    { titolo: 'Quando non vale', testo: T`Sostituire $R_2$ con un generatore di tensione $v^*$ in parallelo a un altro generatore di tensione diverso.`, soluzione: [T`Violerebbe la KVL: il circuito modificato non ha soluzione, quindi il teorema non è applicabile.`] },
  ],
  errori: [{ sbagliato: T`Applicare la sostituzione senza verificare l'unicità della soluzione.`, corretto: T`Il circuito modificato deve avere soluzione unica.` }],
  esame: T`Teorema di sostituzione: 19-11-2003, 12-7-2007 [STORICO].`,
  formulario: ['sost'],
};

B6['VI-02'] = {
  obiettivi: ['Enunciare Thevenin con le ipotesi', 'Dimostrarlo', 'Calcolare $V_{th}$ e $R_{th}$ anche con generatori controllati'],
  teoria: [
    T`<strong>Teorema di Thevenin.</strong> Un bipolo lineare (che non sia accoppiato con il carico) è equivalente, ai fini del carico collegato, a un generatore ideale di tensione $V_{th}$ in serie con un'impedenza $Z_{th}$: $V_{th}$ è la tensione a vuoto; $Z_{th}$ è l'impedenza vista ai morsetti con i generatori <em>indipendenti</em> spenti (tensione → corto, corrente → aperto), oppure $V_{th}/I_{sc}$. Con generatori controllati, $Z_{th}$ si trova con un generatore di prova ($V/I$) lasciando i controllati.`,
    T`<strong>Non applicabilità.</strong> Il teorema non vale se il bipolo contiene elementi non lineari, o se tra bipolo e carico c'è un accoppiamento (controlli incrociati). Per un generatore ideale di corrente $Z_{th}=\infty$: esiste solo Norton.`,
  ],
  figure: [{ alt: 'Un bipolo ai morsetti A e B e il suo equivalente di Thevenin: generatore V_th in serie a Z_th', svg: F2.theveninEq }],
  dimostrazioni: [{ titolo: 'Teorema di Thevenin', enunciato: T`Per un bipolo lineare $\mathcal N$ con morsetti $A$, $B$: $v=V_{th}-Z_{th}\,i$ (con $i$ entrante nel carico).`, passi: [T`Collega al bipolo un carico qualsiasi; per il teorema di sostituzione lo si sostituisce con un generatore di corrente $i$ (la corrente che esce dal bipolo).`, T`Il circuito è lineare: per la sovrapposizione degli effetti la tensione $v$ ai morsetti è la somma di due contributi.`, T`Primo contributo: generatori interni accesi e generatore di corrente $i$ spento (circuito aperto): è la tensione a vuoto $V_{th}$.`, T`Secondo contributo: generatori indipendenti interni spenti e solo il generatore $i$ acceso: per linearità è proporzionale a $i$, $-Z_{th}\,i$, con $Z_{th}$ impedenza vista dai morsetti a indipendenti spenti.`, T`$v=V_{th}-Z_{th}i$ è la caratteristica di un generatore $V_{th}$ in serie a $Z_{th}$. $\square$`] }],
  esempi: [
    { titolo: 'Partitore', testo: T`$12\,\mathrm V$ in serie a $R_1=2\,\Omega$, poi $R_2=4\,\Omega$ verso massa; porta ai capi di $R_2$.`, soluzione: [T`$V_{th}=12\cdot\dfrac46=8\,\mathrm V$, $R_{th}=2\parallel4=\dfrac43\,\Omega$.`] },
    { titolo: 'Con generatore controllato', testo: T`$V_g=4\,\mathrm V$, $R_1=2\,\Omega$ tra $a$ e $o$; un VCCS assorbe tra $o$ e massa la corrente $i=\tfrac12v_o$. Porta in $o$.`, soluzione: [T`Il VCCS si comporta come un resistore da $2\,\Omega$ verso massa e <em>non si spegne</em>.`, T`$V_{th}=4\cdot\dfrac{2}{2+2}=2\,\mathrm V$.`, T`Generatore di prova $1\,\mathrm A$ in $o$ (con $V_g$ in corto): $v_o=1/(\tfrac12+\tfrac12)=1\,\mathrm V$, $R_{th}=1\,\Omega$.`] },
    { titolo: 'Verifica con corto', testo: T`Stesso esempio: corrente di cortocircuito.`, soluzione: [T`Con $o$ in corto ($v_o=0$) il VCCS non assorbe: $I_{sc}=4/2=2\,\mathrm A$.`, T`$V_{th}/R_{th}=2/1=2$ ✓.`] },
  ],
  errori: [{ sbagliato: T`Spegnere anche i generatori controllati per trovare $R_{th}$.`, corretto: T`Si spengono solo gli indipendenti; i controllati restano e si usa il generatore di prova.` }, { sbagliato: T`Applicare Thevenin a un bipolo non lineare.`, corretto: T`Serve la linearità.` }],
  esame: T`Thevenin: enunciato, dimostrazione, condizioni, esempio di non applicabilità: 4-7-2000, 13-2-2002, 29-4-2002 (L–Z), 30-10-2002, 24-4-2009 B; negli esercizi 2015–2024 compare in 9 casi su 14 [STORICO].`,
  formulario: ['th-vth', 'th-zth', 'th-eq', 'th-prova'],
};

B6['VI-03'] = {
  obiettivi: ['Enunciare Norton', 'Legarlo a Thevenin', 'Calcolare $I_N$ con la porta in corto'],
  teoria: [
    T`<strong>Teorema di Norton.</strong> Un bipolo lineare è equivalente a un generatore ideale di corrente $I_N$ in parallelo a un'impedenza $Z_N$: $I_N$ è la corrente di cortocircuito della porta; $Z_N=Z_{th}$ (indipendenti spenti). Legame: $I_N=V_{th}/Z_{th}$ (trasformazione di generatori).`,
    T`Esiste anche se non esiste Thevenin (per $Z_{th}=0$ non esiste Norton).`,
  ],
  figure: [{ alt: 'Equivalente di Norton: generatore di corrente I_N in parallelo a Z_N ai morsetti A e B', svg: F2.nortonEq }],
  dimostrazioni: [{ titolo: 'Teorema di Norton', passi: [T`Sostituisci il carico con un generatore di tensione $v$ (sostituzione).`, T`Per la sovrapposizione: $i=I_{sc}-Y\,v$, dove $I_{sc}$ è la corrente con $v=0$ (porta in corto) e $Y=1/Z_N$ è l'ammettenza vista a indipendenti spenti.`, T`Questa è la caratteristica di un generatore di corrente $I_N=I_{sc}$ in parallelo a $Z_N$. Dal confronto con Thevenin $I_N=V_{th}/Z_{th}$ e $Z_N=Z_{th}$. $\square$`] }],
  esempi: [
    { titolo: 'Trasformazione di generatori', testo: T`$V_{th}=8\,\mathrm V$, $R_{th}=4\,\Omega$.`, soluzione: [T`$I_N=8/4=2\,\mathrm A$, $R_N=4\,\Omega$.`] },
    { titolo: 'Partitore: Norton', testo: T`$12\,\mathrm V$, $2\,\Omega$, $4\,\Omega$ (porta ai capi di $4\,\Omega$).`, soluzione: [T`$I_N=\dfrac{V_{th}}{R_{th}}=\dfrac{8}{4/3}=6\,\mathrm A$.`, T`Verifica: con la porta in corto la corrente è $12/2=6$ ✓.`] },
    { titolo: 'Carico sul Norton', testo: T`$I_N=6$, $R_N=\tfrac43$, carico $R_L=4$.`, soluzione: [T`Partitore di corrente: $i_L=6\cdot\dfrac{4/3}{4/3+4}=6\cdot\tfrac14=1{,}5\,\mathrm A$, $v_L=6\,\mathrm V$; con Thevenin: $8\cdot\dfrac{4}{4/3+4}=6$ ✓.`] },
  ],
  errori: [{ sbagliato: T`Calcolare $I_N$ a porta aperta.`, corretto: T`$I_N$ è la corrente a porta in cortocircuito.` }],
  esame: T`Norton: 13-2-2001, 29-4-2002 (A–I), 24-4-2009 A [STORICO].`,
  formulario: ['n-in', 'n-zn', 'th-norton'],
};

B6['VI-04'] = {
  obiettivi: ['Definire una rete a $N$ porte', 'Contare le relazioni che la descrivono', 'Capire la condizione di porta'],
  teoria: [
    T`Una <strong>rete a $N$ porte</strong> è un circuito con $N$ coppie di morsetti accessibili (porte), per ciascuna delle quali la corrente entrante in un morsetto è uguale a quella uscente dall'altro. Nei casi lineari è descritta da $N$ relazioni lineari tra le $2N$ variabili $v_k,i_k$: se ne scelgono $N$ come indipendenti e le altre ne sono funzione (rappresentazioni $Z$, $Y$, ibride, di trasmissione).`,
    T`Un doppio bipolo ($N=2$) ha due relazioni tra $v_1,i_1,v_2,i_2$.`,
  ],
  figure: [{ alt: 'Doppio bipolo con le correnti i1, i2 entranti e le tensioni v1, v2 alle porte', svg: F2.duebipoli }],
  dimostrazioni: [],
  esempi: [
    { titolo: 'Conteggio', testo: T`Quante relazioni descrivono una rete a 3 porte lineare?`, soluzione: [T`3 relazioni tra 6 variabili ($v_1,v_2,v_3,i_1,i_2,i_3$).`] },
    { titolo: 'Condizione di porta', testo: T`Un doppio bipolo ha $i_1=2$ entrante in $A$ e $1$ uscente da $B$. È una porta?`, soluzione: [T`No: la corrente entrante non è uguale a quella uscente; la coppia non rispetta la condizione di porta.`] },
    { titolo: 'Doppio bipolo noto', testo: T`Il trasformatore ideale: quali variabili sono indipendenti?`, soluzione: [T`$v_1=nv_2$, $i_1=-i_2/n$: si possono scegliere $(v_2,i_2)$; non esistono $Z$ né $Y$.`] },
  ],
  errori: [{ sbagliato: T`Trattare come porta una coppia di morsetti che non soddisfa la condizione di porta.`, corretto: T`Verifica che $i_{entrante}=i_{uscente}$.` }],
  esame: T`Reti $N$-porte e doppi bipoli: 15-9-2000, 17-7-2002, 3-7-2003, 23-9-2008 [STORICO].`,
  formulario: ['nporte-rel'],
};

B6['VI-05'] = {
  obiettivi: ['Definire le matrici $Z$ e $Y$', 'Misurare/calcolare i parametri con prove a vuoto e in corto', 'Riconoscere la reciprocità'],
  teoria: [
    T`Con correnti entranti nelle porte: $\mathbf v=Z\mathbf i$, cioè $v_1=z_{11}i_1+z_{12}i_2$, $v_2=z_{21}i_1+z_{22}i_2$. Parametri a <em>vuoto</em>: $z_{11}=v_1/i_1|_{i_2=0}$, $z_{21}=v_2/i_1|_{i_2=0}$, $z_{12}=v_1/i_2|_{i_1=0}$, $z_{22}=v_2/i_2|_{i_1=0}$. $\mathbf i=Y\mathbf v$ con parametri in <em>cortocircuito</em>: $y_{11}=i_1/v_1|_{v_2=0}$ ecc. Se esistono entrambe, $Y=Z^{-1}$.`,
    T`Rete <strong>reciproca</strong> (soli $R$, $L$, $C$ e trasformatori accoppiati): $z_{12}=z_{21}$, $y_{12}=y_{21}$. Con generatori controllati può non esserlo. Il trasformatore ideale non ha né $Z$ né $Y$.`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [
    { titolo: 'Doppio bipolo a T', testo: T`$R_a=1$ (porta 1), $R_b=2$ (porta 2), $R_c=3$ in derivazione.`, soluzione: [T`Porta 2 aperta: $z_{11}=R_a+R_c=4$, $z_{21}=R_c=3$.`, T`Porta 1 aperta: $z_{22}=R_b+R_c=5$, $z_{12}=R_c=3$.`, T`$Z=\begin{pmatrix}4&3\\3&5\end{pmatrix}$ (reciproca).`] },
    { titolo: 'Doppio bipolo a π', testo: T`$G_a=1$ (porta 1), $G_b=2$ (porta 2), $G_c=3$ in serie tra i morsetti superiori.`, soluzione: [T`Porta 2 in corto: $y_{11}=G_a+G_c=4$, $y_{21}=-G_c=-3$.`, T`Porta 1 in corto: $y_{22}=G_b+G_c=5$, $y_{12}=-3$.`, T`$Y=\begin{pmatrix}4&-3\\-3&5\end{pmatrix}$ e $Z=Y^{-1}=\dfrac1{11}\begin{pmatrix}5&3\\3&4\end{pmatrix}$.`] },
    { titolo: 'Uso della matrice', testo: T`$Z$ come sopra: $i_1=1$, porta 2 aperta ($i_2=0$).`, soluzione: [T`$v_1=4$, $v_2=3$.`] },
  ],
  errori: [{ sbagliato: T`Misurare $z_{11}$ con la porta 2 in corto.`, corretto: T`$z_{11}$ si misura con la porta 2 <em>aperta</em> ($i_2=0$).` }, { sbagliato: T`Segni delle correnti: assumere $i_2$ uscente.`, corretto: T`Convenzione standard: correnti entranti in entrambe le porte.` }],
  esame: T`Doppi bipoli: matrici $Z$, $Y$ e calcolo su un circuito: 15-9-2000, 17-7-2002, 3-7-2003, 23-9-2008; compaiono solo $Z$ e $Y$ negli esercizi 2015–2024 [STORICO].`,
  formulario: ['z-def', 'y-def', 'z-y-inv', 'z11', 'y11', 'reciprocita', 'rete-t', 'rete-pi'],
};

B6['VI-06'] = {
  obiettivi: ['Definire la matrice di trasmissione inversa', 'Convertire $Z\\to T$', 'Usare ibride e trasmissione per la cascata'],
  teoria: [
    T`<strong>Matrice di trasmissione inversa</strong> (ABCD): $\begin{pmatrix}v_1\\i_1\end{pmatrix}=\begin{pmatrix}A&B\\C&D\end{pmatrix}\begin{pmatrix}v_2\\-i_2\end{pmatrix}$. Da $Z$: $A=\dfrac{z_{11}}{z_{21}}$, $B=\dfrac{\Delta_z}{z_{21}}$, $C=\dfrac{1}{z_{21}}$, $D=\dfrac{z_{22}}{z_{21}}$ con $\Delta_z=z_{11}z_{22}-z_{12}z_{21}$. Rete reciproca: $AD-BC=1$.`,
    T`<strong>Ibride</strong> $h$: $v_1=h_{11}i_1+h_{12}v_2$, $i_2=h_{21}i_1+h_{22}v_2$ (tipiche dei transistor).`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Da $Z$ alla matrice di trasmissione', passi: [T`Da $v_2=z_{21}i_1+z_{22}i_2$: $i_1=\dfrac{v_2-z_{22}i_2}{z_{21}}=\dfrac1{z_{21}}v_2+\dfrac{z_{22}}{z_{21}}(-i_2)$: $C=1/z_{21}$, $D=z_{22}/z_{21}$.`, T`Sostituendo in $v_1=z_{11}i_1+z_{12}i_2$: $v_1=\dfrac{z_{11}}{z_{21}}v_2+\left(\dfrac{z_{11}z_{22}}{z_{21}}-z_{12}\right)(-i_2)$.`, T`Quindi $A=z_{11}/z_{21}$ e $B=\Delta_z/z_{21}$. $\square$`] }],
  esempi: [
    { titolo: 'Rete a T', testo: T`$Z=\begin{pmatrix}4&3\\3&5\end{pmatrix}$.`, soluzione: [T`$\Delta_z=20-9=11$: $A=\tfrac43$, $B=\tfrac{11}3$, $C=\tfrac13$, $D=\tfrac53$.`, T`$AD-BC=\tfrac{20}{9}-\tfrac{11}{9}=1$ ✓.`] },
    { titolo: 'Resistore in serie', testo: T`$R=2$ in serie sul ramo superiore.`, soluzione: [T`$v_1=v_2+R(-i_2)$, $i_1=-i_2$: $T=\begin{pmatrix}1&2\\0&1\end{pmatrix}$.`] },
    { titolo: 'Conduttore in derivazione', testo: T`$G=\tfrac13$ tra i due rami.`, soluzione: [T`$v_1=v_2$, $i_1=Gv_2+(-i_2)$: $T=\begin{pmatrix}1&0\\1/3&1\end{pmatrix}$.`] },
  ],
  errori: [{ sbagliato: T`Usare $i_2$ al posto di $-i_2$ nella matrice di trasmissione.`, corretto: T`La corrente $-i_2$ esce dalla porta 2 (verso il carico).` }],
  esame: T`Doppi bipoli: matrici $Z$, $Y$, $T$ inversa: 15-9-2000, 17-7-2002, 3-7-2003, 23-9-2008 [STORICO].`,
  formulario: ['t-def', 't-da-z', 't-recip', 'h-def2'],
};

B6['VI-07'] = {
  obiettivi: ['Combinare doppi bipoli', 'Ricordare quale matrice si somma o si moltiplica', 'Calcolare l\'impedenza d\'ingresso di una cascata'],
  teoria: [
    T`<strong>Serie-serie</strong> (porte in serie): $Z=Z_a+Z_b$. <strong>Parallelo-parallelo</strong> (porte in parallelo): $Y=Y_a+Y_b$. <strong>Cascata</strong> (porta 2 di $a$ su porta 1 di $b$): $T=T_aT_b$. Le prime due valgono solo se la prova di validità (VI-08) è superata.`,
    T`Nella cascata i versi di riferimento contano: la corrente di uscita della prima rete è $-i_2^{(a)}$ ed è la corrente di ingresso $i_1^{(b)}$ della seconda; per questo la matrice di trasmissione usa $(v_2,-i_2)$ e le matrici si moltiplicano nell'ordine in cui le reti sono collegate.`,
  ],
  figure: [{ alt: 'Cascata di due doppi bipoli N_a e N_b', svg: F2.cascata }, { alt: 'Connessione serie-serie di due doppi bipoli', svg: F2.serieserie }],
  dimostrazioni: [],
  esempi: [
    { titolo: 'Cascata', testo: T`Serie $R=2$ seguita da derivazione $G=\tfrac13$.`, soluzione: [T`$T=\begin{pmatrix}1&2\\0&1\end{pmatrix}\begin{pmatrix}1&0\\1/3&1\end{pmatrix}=\begin{pmatrix}5/3&2\\1/3&1\end{pmatrix}$.`, T`Con porta 2 aperta ($i_2=0$): $Z_{in}=A/C=5\,\Omega$ (verifica: $2+3$ ✓).`] },
    { titolo: 'Parallelo-parallelo', testo: T`$Y_a=\begin{pmatrix}1&-1\\-1&2\end{pmatrix}$, $Y_b=\begin{pmatrix}2&0\\0&1\end{pmatrix}$.`, soluzione: [T`$Y=\begin{pmatrix}3&-1\\-1&3\end{pmatrix}$.`] },
    { titolo: 'Serie-serie', testo: T`$Z_a=\begin{pmatrix}2&1\\1&2\end{pmatrix}$, $Z_b=\begin{pmatrix}1&1\\1&3\end{pmatrix}$.`, soluzione: [T`$Z=\begin{pmatrix}3&2\\2&5\end{pmatrix}$.`] },
  ],
  errori: [{ sbagliato: T`Moltiplicare le matrici $Z$ in una cascata.`, corretto: T`Cascata: si moltiplicano le matrici di trasmissione.` }],
  esame: T`Connessioni serie-serie e parallelo-parallelo: 12-6-2000, 13-2-2001, 19-11-2003, 12-7-2007 [STORICO].`,
  formulario: ['conn-ss', 'conn-pp', 'conn-cascata'],
};

B6['VI-08'] = {
  obiettivi: ['Spiegare perché servono le prove di validità', 'Eseguire la prova per serie-serie', 'Indicare i rimedi'],
  teoria: [
    T`La somma delle matrici $Z$ (o $Y$) è corretta solo se, dopo il collegamento, ciascun doppio bipolo continua ad avere uguali la corrente entrante e quella uscente da ogni sua porta. Altrimenti la connessione modifica il funzionamento dei singoli doppi bipoli e le formule non valgono.`,
    T`<strong>Prova di validità</strong> (serie-serie): si alimentano le porte di ingresso a vuoto e si verifica che tra i morsetti da collegare (che andranno uniti) la tensione sia nulla; analogamente per l'uscita. Se la prova non è superata si può inserire un trasformatore di isolamento 1:1 su una delle porte.`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Perché la somma di $Z$ richiede la condizione di porta', passi: [T`Nella serie-serie le porte sono in serie: $v_1=v_{1a}+v_{1b}$, $v_2=v_{2a}+v_{2b}$ e le correnti di porta sono comuni: $i_1=i_{1a}=i_{1b}$, $i_2=i_{2a}=i_{2b}$.`, T`Sommando $\mathbf v_a=Z_a\mathbf i_a$ e $\mathbf v_b=Z_b\mathbf i_b$ con $\mathbf i_a=\mathbf i_b=\mathbf i$: $\mathbf v=(Z_a+Z_b)\mathbf i$.`, T`L'ipotesi $\mathbf i_a=\mathbf i_b=\mathbf i$ vale solo se, per ogni doppio bipolo, la corrente entrante in un morsetto di una porta è uguale a quella uscente dall'altro anche dopo il collegamento: è la condizione verificata dalla prova di validità. $\square$`] }],
  esempi: [
    { titolo: 'Prova superata', testo: T`Due doppi bipoli senza collegamento comune tra le porte, connessi in serie-serie.`, soluzione: [T`Alimentando le porte a vuoto, tra i morsetti da collegare la tensione è nulla: connessione lecita, $Z=Z_a+Z_b$.`] },
    { titolo: 'Prova fallita', testo: T`Due reti a T con morsetto comune a massa connesse in serie-serie.`, soluzione: [T`Il collegamento diretto cortocircuita parti di rete: la corrente può non passare dalle porte come previsto; la tensione di prova non è nulla.`, T`Rimedio: trasformatore ideale 1:1 su una porta di uno dei due doppi bipoli.`] },
    { titolo: 'Parallelo-parallelo con massa comune', testo: T`Due reti a π (massa comune) in parallelo.`, soluzione: [T`Hanno già un morsetto in comune: la connessione parallelo-parallelo è sempre lecita e $Y=Y_a+Y_b$.`] },
  ],
  errori: [{ sbagliato: T`Sommare le matrici senza verificare la prova di validità.`, corretto: T`Verifica sempre la condizione di porta prima di usare le formule di connessione.` }],
  esame: T`Connessioni e prove di validità: 12-6-2000, 13-2-2001, 19-11-2003, 12-7-2007 [STORICO].`,
  formulario: ['prova-validita'],
};

B6['VI-09'] = {
  obiettivi: ['Dimostrare $Z_L=Z_{th}^*$ per il massimo trasferimento', 'Calcolare $P_{max}$ con valori di picco ed efficaci', 'Adattare un carico con un trasformatore ideale'],
  teoria: [
    T`Un generatore equivalente $\dot V_{th}$, $Z_{th}=R_{th}+jX_{th}$ alimenta un carico $Z_L=R_L+jX_L$. La potenza attiva assorbita è massima per $Z_L=Z_{th}^*$ (<strong>adattamento coniugato</strong>) e vale $$P_{max}=\frac{|V_{th}|^2}{8R_{th}}\ \ (V_{th}\text{ di picco}),\qquad P_{max}=\frac{|V_{th}|^2}{4R_{th}}\ \ (V_{th}\text{ efficace}).$$`,
    T`Con carico solo resistivo il massimo è per $R_L=|Z_{th}|$. Il rendimento (potenza sul carico/potenza erogata da $V_{th}$) all'adattamento vale $50\%$. Con un trasformatore ideale di rapporto $n$ il carico riportato è $n^2R_L$ e l'adattamento richiede $n^2R_L=R_{th}$.`,
  ],
  figure: [],
  dimostrazioni: [{ titolo: 'Massimo trasferimento di potenza attiva', enunciato: T`$P_L$ è massima per $Z_L=Z_{th}^*$, con $P_{max}=|V_{th}|^2/(8R_{th})$ (picco).`, passi: [T`Corrente: $\dot I=\dfrac{\dot V_{th}}{(R_{th}+R_L)+j(X_{th}+X_L)}$. Potenza attiva sul carico (picco): $P_L=\tfrac12R_L|\dot I|^2=\dfrac{|V_{th}|^2R_L}{2\left[(R_{th}+R_L)^2+(X_{th}+X_L)^2\right]}$.`, T`Per ogni $R_L$ fissata il denominatore è minimo se $X_L=-X_{th}$ (la reattanza totale si annulla), dove $P_L=\dfrac{|V_{th}|^2R_L}{2(R_{th}+R_L)^2}$.`, T`Derivando rispetto a $R_L$: $\dfrac{d}{dR_L}\dfrac{R_L}{(R_{th}+R_L)^2}=\dfrac{R_{th}-R_L}{(R_{th}+R_L)^3}=0\Rightarrow R_L=R_{th}$ (massimo: la derivata passa da positiva a negativa).`, T`Quindi $Z_L=R_{th}-jX_{th}=Z_{th}^*$ e $P_{max}=\dfrac{|V_{th}|^2R_{th}}{2(2R_{th})^2}=\dfrac{|V_{th}|^2}{8R_{th}}$. Con valori efficaci ($|V|^2=|V_m|^2/2$) $P_{max}=|V_{th}|^2/(4R_{th})$. $\square$`] }],
  esempi: [
    { titolo: 'Adattamento coniugato', testo: T`$V_{th}=8\,\mathrm V$ (picco), $Z_{th}=4+3j\,\Omega$.`, soluzione: [T`$Z_L=4-3j\,\Omega$; $P_{max}=\dfrac{64}{8\cdot4}=2\,\mathrm W$.`] },
    { titolo: 'Con trasformatore ideale', testo: T`$V_{th}=8\,\mathrm V$ (picco), $R_{th}=8\,\Omega$, carico $R_L=2\,\Omega$.`, soluzione: [T`$n^2R_L=R_{th}\Rightarrow n^2=4$, $n=2$.`, T`$P_{max}=\dfrac{64}{8\cdot8}=1\,\mathrm W$: non dipende da $n$ (dipende dall'adattamento).`] },
    { titolo: 'Carico solo resistivo', testo: T`$Z_{th}=3+4j\,\Omega$, carico resistivo.`, soluzione: [T`$R_L=|Z_{th}|=5\,\Omega$ (non $3$): con $X_L=0$ non si può annullare $X_{th}$.`] },
  ],
  errori: [{ sbagliato: T`Usare $Z_L=Z_{th}$ invece del coniugato.`, corretto: T`Serve $Z_L=Z_{th}^*$ per annullare la reattanza totale.` }, { sbagliato: T`Confondere $/(8R_{th})$ (picco) e $/(4R_{th})$ (efficace).`, corretto: T`Dichiara se $V_{th}$ è di picco o efficace.` }],
  esame: T`Massimo trasferimento di potenza attiva (anche con trasformatore ideale e $n$): 12-6-2000, 19-6-2002, 30-10-2002, 23-9-2008, 24-4-2009 [STORICO].`,
  formulario: ['pmax-picco', 'pmax-eff', 'zl-coniugata', 'rl-modulo', 'rendimento-50', 'adatt-trasf'],
};
