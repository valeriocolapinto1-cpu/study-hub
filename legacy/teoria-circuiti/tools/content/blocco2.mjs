import { F } from './figure1.mjs';
const T = String.raw;
export const B2 = {};

B2['II-01'] = {
  obiettivi: ['Rappresentare un circuito con un grafo orientato', 'Distinguere maglie e tagli', 'Contare nodi, rami e connessione'],
  teoria: [
    T`Un <strong>grafo orientato</strong> è un insieme di $n$ nodi e $b$ rami, ciascuno con un verso. Il grafo di un circuito si ottiene ignorando la natura dei componenti: ogni bipolo è un ramo, i suoi morsetti sono nodi. Si considera <em>connesso</em> (da ogni nodo si raggiunge ogni altro), altrimenti si studiano le parti separate.`,
    T`Una <strong>maglia</strong> è un insieme di rami che forma un percorso chiuso passando una sola volta per ciascun nodo. Un <strong>taglio</strong> è un insieme minimale di rami la cui rimozione rende il grafo non connesso. I rami che concorrono a un nodo formano un taglio (il «taglio del nodo»).`,
    T`I versi dei rami coincidono con i versi di riferimento di corrente (e tensione, con convenzione degli utilizzatori). Per ogni maglia si fissa un verso di percorrenza; per ogni taglio si fissa un verso (dall'insieme di nodi $\mathcal N_1$ a $\mathcal N_2$).`,
  ],
  figure: [{ alt: 'Grafo completo di 4 nodi (0,1,2,3) e 6 rami', svg: F.k4 }],
  dimostrazioni: [],
  esempi: [{
    titolo: 'Conteggi sul grafo completo di 4 nodi',
    testo: T`Nel grafo della figura (4 nodi, 6 rami): quante maglie di 3 rami ci sono? Quanti tagli «di nodo»?`,
    soluzione: [T`Ogni terna di nodi forma un triangolo: $\binom{4}{3}=4$ maglie da 3 rami.`, T`Un taglio di nodo per ciascun nodo: 4 (ma sono dipendenti: ne bastano $n-1=3$).`],
  }],
  errori: [{ sbagliato: T`Considerare maglia un insieme di rami che «si chiude» passando due volte per un nodo.`, corretto: T`Nella definizione di maglia ogni nodo è toccato una sola volta (altrimenti è unione di maglie).` }],
  esame: T`Topologia: 18-9-2002, 30-10-2002, 24-4-2003, 12-7-2005 [STORICO].`,
  formulario: ['n-b'],
};

B2['II-02'] = {
  obiettivi: ['Definire albero e coalbero', 'Costruire maglie e tagli fondamentali', 'Dimostrare che un albero ha $n-1$ rami'],
  teoria: [
    T`Un <strong>albero</strong> è un sottografo connesso che contiene tutti i nodi e nessuna maglia. I rami non appartenenti all'albero formano il <strong>coalbero</strong> (rami di <em>corda</em>). Un albero ha $n-1$ rami, il coalbero $b-n+1$.`,
    T`Aggiungendo all'albero un ramo di coalbero si chiude una e una sola maglia: la <strong>maglia fondamentale</strong> di quel ramo (percorsa nel verso del ramo di coalbero). Ci sono $b-n+1$ maglie fondamentali, linearmente indipendenti. Togliendo dal grafo un ramo d'albero, l'albero si divide in due parti: i rami che collegano le due parti (il ramo d'albero più i rami di coalbero che le uniscono) formano il <strong>taglio fondamentale</strong> del ramo. Ce ne sono $n-1$, indipendenti.`,
    T`La scelta dell'albero non è unica: le maglie e i tagli fondamentali dipendono da essa.`,
  ],
  figure: [{ alt: 'Grafo di 4 nodi con albero evidenziato (rami 0-1, 0-2, 0-3) e coalbero tratteggiato', svg: F.k4tree }],
  dimostrazioni: [{
    titolo: 'Un albero con $n$ nodi ha $n-1$ rami',
    passi: [T`Per induzione su $n$. Con $n=1$ non ci sono rami: $0=n-1$.`, T`Un albero con $n\ge2$ nodi ha almeno due nodi di grado 1 (foglie): partendo da un nodo, si segue un percorso senza maglie; si arriva a un nodo da cui non si può proseguire senza richiudere una maglia, cioè una foglia, e lo stesso vale dall'altro estremo.`, T`Si rimuove una foglia con il suo unico ramo: resta un albero con $n-1$ nodi che per ipotesi ha $n-2$ rami.`, T`Quindi l'albero originale ha $(n-2)+1=n-1$ rami. $\square$`],
  }],
  esempi: [{
    titolo: 'Maglie e tagli fondamentali su 4 nodi',
    testo: T`Nel grafo della figura (albero: 0-1, 0-2, 0-3) elenca maglie e tagli fondamentali.`,
    soluzione: [T`$n=4$, $b=6$: albero 3 rami, coalbero 3 rami (1-2, 2-3, 1-3).`, T`Maglie fondamentali: (1-2)+(0-1)+(0-2); (2-3)+(0-2)+(0-3); (1-3)+(0-1)+(0-3): 3 maglie da 3 rami.`, T`Tagli fondamentali: 3, uno per ramo d'albero. Il taglio di 0-1 separa il nodo 1 dal resto: contiene 0-1, 1-2, 1-3.`],
  }],
  errori: [{ sbagliato: T`Scegliere come «albero» un insieme di $n-1$ rami che contiene una maglia (e lascia un nodo isolato).`, corretto: T`$n-1$ rami sono un albero solo se connettono tutti i nodi senza maglie.` }],
  esame: T`Topologia (maglie e tagli fondamentali): 18-9-2002, 24-4-2003, 12-7-2005 [STORICO].`,
  formulario: ['albero-coalbero'],
};

B2['II-03'] = {
  obiettivi: ['Costruire le matrici di incidenza A e delle maglie B', 'Scrivere KCL e KVL in forma matriciale', 'Dimostrare la relazione tra i blocchi di A e B'],
  teoria: [
    T`<strong>Matrice di incidenza ridotta</strong> $A$, di dimensione $(n-1)\times b$ (si elimina la riga di un nodo di riferimento): $a_{jk}=+1$ se il ramo $k$ esce dal nodo $j$, $-1$ se vi entra, $0$ altrimenti.`,
    T`<strong>Matrice delle maglie fondamentali</strong> $B$, di dimensione $(b-n+1)\times b$: $b_{jk}=+1$ se il ramo $k$ appartiene alla maglia $j$ con verso concorde, $-1$ se discorde, $0$ altrimenti.`,
    T`<strong>Leggi di Kirchhoff in forma matriciale</strong> (con $\mathbf i,\mathbf v\in\mathbb R^b$): $$A\,\mathbf i=\mathbf 0\ \ (\text{KCL}),\qquad B\,\mathbf v=\mathbf 0\ \ (\text{KVL}).$$`,
    T`<strong>Forma a blocchi.</strong> Ordinando i rami prima l'albero e poi il coalbero, $A=[A_t\ A_c]$ con $A_t$ quadrata $(n-1)\times(n-1)$ invertibile, e $B=[B_t\ B_c]$. Scegliendo come maglie fondamentali quelle del coalbero, $B_c=\mathbb 1$. Definita $F=A_t^{-1}A_c$ (matrice dei tagli fondamentali $Q=A_t^{-1}A=[\mathbb 1\ F]$), si ha $$B=[-F^{\mathsf T}\ \ \mathbb 1].$$ Quindi <em>il blocco di $B$ relativo all'albero è meno la trasposta del blocco di $Q$ relativo al coalbero</em>.`,
    T`Attenzione: $A$ e $B$ hanno <strong>dimensioni diverse</strong> ($(n-1)\times b$ e $(b-n+1)\times b$) e non sono una la trasposta dell'altra; la relazione vale tra i <em>blocchi</em>, con $A_t=\mathbb 1$.`,
  ],
  figure: [],
  dimostrazioni: [{
    titolo: 'Relazione tra B e A in forma a blocchi',
    enunciato: T`Con $A=[A_t\ A_c]$ ($A_t$ invertibile) e $B=[B_t\ \mathbb 1]$, la KVL è equivalente a $B_t=-(A_t^{-1}A_c)^{\mathsf T}=-F^{\mathsf T}$.`,
    passi: [T`Le tensioni di ramo soddisfano $\mathbf v=A^{\mathsf T}\mathbf e$ per un opportuno vettore $\mathbf e$ di tensioni di nodo (potenziali), qualunque esso sia.`, T`Poiché la KVL deve valere per ogni $\mathbf e$: $B\,A^{\mathsf T}\mathbf e=\mathbf0$ per ogni $\mathbf e$, cioè $B\,A^{\mathsf T}=0$, ovvero $A\,B^{\mathsf T}=0$.`, T`In blocchi: $A\,B^{\mathsf T}=A_tB_t^{\mathsf T}+A_c\mathbb 1=0$.`, T`Moltiplica a sinistra per $A_t^{-1}$: $B_t^{\mathsf T}=-A_t^{-1}A_c=-F$, quindi $B_t=-F^{\mathsf T}$. $\square$`],
    nota: T`La formulazione esatta data a lezione può essere diversa (ad esempio normalizzata con $A_t=\mathbb1$) [DA VERIFICARE].`,
  }],
  esempi: [{
    titolo: 'Matrici del grafo a 3 nodi (triangolo)',
    testo: T`Triangolo con nodi $0,1,2$ e rami: $a$: $0\to1$, $b$: $0\to2$, $c$: $1\to2$. Albero: $a,b$. Costruisci $A$, $B$ e verifica $A\,B^{\mathsf T}=0$.`,
    soluzione: [T`Nodo di riferimento 0; righe: nodi 1, 2; colonne $a,b,c$. Il ramo $a$ entra in 1: $-1$; $b$ entra in 2: $-1$; $c$ esce da 1 ed entra in 2: $+1$ in riga 1, $-1$ in riga 2. $A=\begin{pmatrix}-1&0&1\\0&-1&-1\end{pmatrix}$.`, T`Albero $\{a,b\}$: $A_t=\begin{pmatrix}-1&0\\0&-1\end{pmatrix}=-\mathbb1$, $A_c=\begin{pmatrix}1\\-1\end{pmatrix}$, $F=A_t^{-1}A_c=\begin{pmatrix}-1\\1\end{pmatrix}$.`, T`$B_t=-F^{\mathsf T}=(1\ \ -1)$, $B=(1\ \ -1\ \ 1)$: maglia $a$, $-b$, $c$ (percorso $0\to1\to2\to0$ ✓).`, T`Verifica: $A B^{\mathsf T}=\begin{pmatrix}-1\cdot1+0+1\cdot1\\0+(-1)(-1)+(-1)(1)\end{pmatrix}=\begin{pmatrix}0\\0\end{pmatrix}$. ✓`],
  }],
  errori: [{ sbagliato: T`Scrivere $B=-A^{\mathsf T}$ come relazione tra le matrici complete.`, corretto: T`Le dimensioni non coincidono: la relazione è $B_t=-(A_t^{-1}A_c)^{\mathsf T}$ tra blocchi.` }],
  esame: T`Topologia, $B=-A^{\mathsf T}$ (in forma a blocchi) e tensioni indipendenti: 18-9-2002, 30-10-2002, 24-4-2003, 12-7-2005 [STORICO].`,
  formulario: ['kcl-mat', 'kvl-mat', 'b-da-a'],
};

B2['II-04'] = {
  obiettivi: ['Contare le tensioni e le correnti indipendenti', 'Esprimere tutte le grandezze con tensioni di albero o correnti di coalbero', 'Collegare i risultati ai metodi dei nodi e delle maglie'],
  teoria: [
    T`Le $b$ tensioni di ramo non sono indipendenti: devono soddisfare la KVL ($b-n+1$ vincoli). Restano <strong>$n-1$ tensioni indipendenti</strong>: ad esempio le tensioni dei rami d'albero $\mathbf v_t$, oppure le tensioni di nodo $\mathbf e$ rispetto al riferimento ($\mathbf v=A^{\mathsf T}\mathbf e$).`,
    T`Analogamente le correnti: la KCL dà $n-1$ vincoli e restano <strong>$b-n+1$ correnti indipendenti</strong>: quelle dei rami di coalbero $\mathbf i_c$ (correnti di maglia $\mathbf j$, con $\mathbf i=B^{\mathsf T}\mathbf j$).`,
    T`In blocchi: $\mathbf v_c=F^{\mathsf T}\mathbf v_t$ (dalla KVL $B\mathbf v=0$) e $\mathbf i_t=-F\,\mathbf i_c$ (dalla KCL $Q\mathbf i=0$).`,
  ],
  figure: [],
  dimostrazioni: [{
    titolo: 'Tutte le tensioni si ricavano da quelle d\'albero',
    passi: [T`La KVL con $B=[-F^{\mathsf T}\ \ \mathbb1]$ dà $-F^{\mathsf T}\mathbf v_t+\mathbf v_c=0$.`, T`Quindi $\mathbf v_c=F^{\mathsf T}\mathbf v_t$: le tensioni di coalbero sono determinate da quelle d'albero.`, T`Le $n-1$ tensioni d'albero sono libere: non esistono altri vincoli (le equazioni di KVL sono tante quante le maglie fondamentali, e sono già state usate tutte). $\square$`],
  }],
  esempi: [{
    titolo: 'Dal triangolo precedente',
    testo: T`Nel triangolo dell'esempio II-03 (albero $a,b$) con $v_a=5\,\mathrm{V}$, $v_b=3\,\mathrm{V}$: trova $v_c$ e, sapendo $i_c=2\,\mathrm{A}$, le correnti $i_a,i_b$.`,
    soluzione: [T`$F^{\mathsf T}=(-1\ \ 1)$: $v_c=-5+3=-2\,\mathrm{V}$ (KVL: $v_a-v_b+v_c=0$ ✓).`, T`$\mathbf i_t=-F\,i_c=\begin{pmatrix}1\\-1\end{pmatrix}\cdot2=\begin{pmatrix}2\\-2\end{pmatrix}$: $i_a=2\,\mathrm{A}$, $i_b=-2\,\mathrm{A}$.`, T`KCL nodo 1: esce $c$ ($i_c=2$) ed entra $a$ ($i_a=2$) ✓.`],
  }],
  errori: [{ sbagliato: T`Assegnare liberamente $b$ tensioni di ramo.`, corretto: T`Solo $n-1$ tensioni (e $b-n+1$ correnti) sono indipendenti: le altre seguono dalla KVL/KCL.` }],
  esame: T`Tensioni indipendenti: 18-9-2002, 30-10-2002, 24-4-2003, 12-7-2005 [STORICO].`,
  formulario: ['tens-indip', 'corr-indip'],
};

B2['II-05'] = {
  obiettivi: ['Enunciare e dimostrare il teorema di Tellegen', 'Dedurre conservazione della potenza e ortogonalità v–i', 'Applicare il teorema a due circuiti con lo stesso grafo'],
  teoria: [
    T`<strong>Teorema di Tellegen.</strong> Dato un grafo orientato, siano $\mathbf v$ un vettore di tensioni che soddisfa la KVL e $\mathbf i$ un vettore di correnti che soddisfa la KCL (con versi coerenti, es. convenzione degli utilizzatori). Allora $$\mathbf v^{\mathsf T}\mathbf i=\sum_{k=1}^{b}v_k\,i_k=0.$$`,
    T`Il teorema dipende <em>solo dalla topologia</em>: $\mathbf v$ e $\mathbf i$ possono appartenere a circuiti diversi con lo stesso grafo, a istanti diversi, ecc. Se sono dello stesso circuito, esprime la <strong>conservazione della potenza</strong>: la somma delle potenze assorbite da tutti i rami è nulla.`,
    T`Geometricamente: il vettore delle tensioni appartiene al sottospazio generato dalle colonne di $A^{\mathsf T}$, quello delle correnti al nucleo di $A$: i due sottospazi sono <em>ortogonali</em>.`,
  ],
  figure: [],
  dimostrazioni: [{
    titolo: 'Teorema di Tellegen',
    passi: [T`La KVL implica $\mathbf v=A^{\mathsf T}\mathbf e$ per un opportuno vettore di tensioni di nodo $\mathbf e$ (potenziali rispetto al nodo di riferimento).`, T`Allora $\mathbf v^{\mathsf T}\mathbf i=(A^{\mathsf T}\mathbf e)^{\mathsf T}\mathbf i=\mathbf e^{\mathsf T}A\,\mathbf i$.`, T`Per la KCL $A\,\mathbf i=\mathbf0$, quindi $\mathbf v^{\mathsf T}\mathbf i=0$. $\square$`],
  }, {
    titolo: 'Ortogonalità tra spazio delle tensioni e delle correnti',
    passi: [T`Lo spazio delle tensioni ammissibili è $\mathcal V=\{A^{\mathsf T}\mathbf e\}=\operatorname{Im}A^{\mathsf T}$; quello delle correnti è $\mathcal I=\ker A$.`, T`Per l'algebra lineare $\ker A=(\operatorname{Im}A^{\mathsf T})^{\perp}$: ogni corrente ammissibile è ortogonale a ogni tensione ammissibile, e le dimensioni sommano a $b$: $(n-1)+(b-n+1)=b$. $\square$`],
  }],
  esempi: [{
    titolo: 'Bilancio di potenza',
    testo: T`Un generatore di tensione $V_g=10\,\mathrm{V}$ alimenta in serie $R_1=2\,\Omega$ e $R_2=3\,\Omega$. Verifica Tellegen.`,
    soluzione: [T`$i=10/5=2\,\mathrm{A}$. $v_1=4\,\mathrm{V}$, $v_2=6\,\mathrm{V}$.`, T`Potenze assorbite (utilizzatori): $R_1$: $8\,\mathrm{W}$, $R_2$: $12\,\mathrm{W}$; il generatore, in convenzione degli utilizzatori, ha $v=10$, $i=-2$: $-20\,\mathrm{W}$.`, T`Somma: $8+12-20=0$. ✓`],
  }],
  errori: [{ sbagliato: T`Sommare potenze «erogate» e «assorbite» con lo stesso segno.`, corretto: T`Usa una convenzione unica (utilizzatori su tutti i rami): la somma algebrica è zero.` }],
  esame: T`Tellegen e ortogonalità v–i: 1-6-2000, 19-6-2002, 12-7-2007, 23-9-2008 [STORICO]. Dimostrazione richiesta.`,
  formulario: ['tellegen', 'ortogonalita'],
};

B2['II-06'] = {
  obiettivi: ['Calcolare resistenze equivalenti serie e parallelo', 'Applicare i partitori di tensione e di corrente', 'Conoscere le condizioni di applicabilità'],
  teoria: [
    T`<strong>Serie.</strong> Bipoli attraversati dalla stessa corrente: $R_{eq}=\sum R_k$. <strong>Parallelo.</strong> Bipoli con la stessa tensione: $G_{eq}=\sum G_k$, cioè $\dfrac1{R_{eq}}=\sum\dfrac1{R_k}$; per due resistori $R_{eq}=\dfrac{R_1R_2}{R_1+R_2}$.`,
    T`<strong>Partitore di tensione</strong> (serie, tensione totale $v$): $v_k=v\,\dfrac{R_k}{\sum_j R_j}$. <strong>Partitore di corrente</strong> (parallelo, corrente totale $i$): $i_k=i\,\dfrac{G_k}{\sum_j G_j}$.`,
    T`Condizione di applicabilità del partitore di tensione: la corrente è la stessa in tutti i resistori, cioè niente carico a valle che sottragga corrente.`,
  ],
  figure: [{ alt: 'Partitore di tensione: generatore V, resistori R₁ e R₂ in serie, uscita v₂ sul nodo intermedio', svg: F.partitore }],
  dimostrazioni: [{
    titolo: 'Partitore di tensione',
    passi: [T`Corrente comune (KCL): $i=v/(R_1+R_2)$.`, T`Costitutiva di $R_2$: $v_2=R_2\,i=v\,\dfrac{R_2}{R_1+R_2}$. $\square$`],
  }],
  esempi: [{
    titolo: 'Rete serie-parallelo',
    testo: T`$R_1=6\,\Omega$ e $R_2=3\,\Omega$ in parallelo, in serie con $R_3=4\,\Omega$, alimentati da $18\,\mathrm{V}$. Trova $i$ in $R_1$.`,
    soluzione: [T`$R_{12}=6\cdot3/9=2\,\Omega$, $R_{eq}=2+4=6\,\Omega$, $i_{tot}=18/6=3\,\mathrm{A}$.`, T`Partitore di corrente: $i_1=3\cdot\dfrac{1/6}{1/6+1/3}=3\cdot\dfrac13=1\,\mathrm{A}$.`],
  }],
  errori: [{ sbagliato: T`Usare il partitore di tensione con un carico collegato sul nodo intermedio senza includerlo.`, corretto: T`Il carico entra in parallelo a $R_2$: usa $R_2\parallel R_L$.` }],
  esame: T`Partitori e serie/parallelo sono la base dei calcoli nell'esercizio d'analisi [STORICO].`,
  formulario: ['serie', 'parallelo', 'part-v', 'part-i'],
};

B2['II-07'] = {
  obiettivi: ['Scrivere le equazioni ai nodi', 'Trattare generatori di tensione e controllati', 'Scegliere tra nodi e maglie'],
  teoria: [
    T`Il <strong>metodo dei nodi</strong> usa come incognite le $n-1$ tensioni di nodo $\mathbf e$ rispetto a un nodo di riferimento. Per circuiti con soli resistori e generatori di corrente: $$G\,\mathbf e=\mathbf i_s,$$ con $G_{jj}=$ somma delle conduttanze collegate al nodo $j$, $G_{jk}=-$ conduttanza tra $j$ e $k$, $i_{s,j}=$ somma delle correnti dei generatori che <em>entrano</em> nel nodo $j$.`,
    T`<strong>Generatori di tensione.</strong> Se ideale e collegato al riferimento fissa il potenziale del nodo; altrimenti si usa un <em>supernodo</em> (KCL sul taglio che li contiene più il vincolo $e_j-e_k=E$) oppure si aggiunge la sua corrente come incognita (analisi nodale modificata). I generatori controllati si trattano esprimendo la grandezza di controllo con le $\mathbf e$.`,
    T`<strong>Criterio.</strong> Conviene l'analisi nodale se $n-1<b-n+1$, cioè pochi nodi; quella alle maglie se le maglie indipendenti sono meno dei nodi.`,
  ],
  figure: [],
  dimostrazioni: [{
    titolo: 'Equazioni ai nodi per rete resistiva',
    passi: [T`KCL al nodo $j$ in forma matriciale: $A\,\mathbf i=\mathbf i_s$ (correnti dei generatori portate a secondo membro).`, T`Costitutive: $\mathbf i=\mathcal G\,\mathbf v$ con $\mathcal G=\operatorname{diag}(G_k)$. KVL: $\mathbf v=A^{\mathsf T}\mathbf e$.`, T`Sostituisci: $A\,\mathcal G\,A^{\mathsf T}\mathbf e=\mathbf i_s$, quindi $G=A\mathcal GA^{\mathsf T}$, matrice simmetrica (se non ci sono controllati) e definita positiva per $G_k>0$ con grafo connesso. $\square$`],
  }],
  esempi: [{
    titolo: 'Due nodi indipendenti',
    testo: T`Generatore di corrente $3\,\mathrm{A}$ nel nodo 1; resistenze: nodo 1–riferimento $2\,\Omega$, nodo 1–nodo 2 $1\,\Omega$, nodo 2–riferimento $4\,\Omega$. Trova $e_1,e_2$.`,
    soluzione: [T`$G_{11}=\tfrac12+1=\tfrac32$, $G_{12}=-1$, $G_{22}=1+\tfrac14=\tfrac54$.`, T`Sistema: $\tfrac32e_1-e_2=3$; $-e_1+\tfrac54e_2=0$.`, T`Dalla seconda $e_1=\tfrac54e_2$; nella prima $\tfrac{15}{8}e_2-e_2=3\Rightarrow\tfrac78e_2=3$, $e_2=\tfrac{24}7\,\mathrm{V}\approx3{,}43\,\mathrm{V}$, $e_1=\tfrac{30}7\,\mathrm{V}\approx4{,}29\,\mathrm{V}$.`, T`Verifica KCL nodo 1: $\tfrac{30/7}{2}+\tfrac{30/7-24/7}{1}=\tfrac{15}7+\tfrac67=3$ ✓.`],
  }],
  errori: [{ sbagliato: T`Inserire nell'equazione di nodo la corrente di un generatore di tensione ignota senza scriverne il vincolo.`, corretto: T`Usa il supernodo oppure aggiungi la corrente del generatore come incognita con l'equazione $e_j-e_k=E$.` }],
  esame: T`Metodo dei nodi e criteri di scelta nodi/maglie: 3-7-2001, 3-7-2003, 25-9-2007, 17-4-2008, 7-7-2008 [STORICO].`,
  formulario: ['nodi', 'nodi-mat'],
};

B2['II-08'] = {
  obiettivi: ['Scrivere le equazioni alle maglie', 'Gestire generatori di corrente con supermaglia', 'Confrontare il metodo con quello dei nodi'],
  teoria: [
    T`Il <strong>metodo delle maglie</strong> usa come incognite le correnti di maglia $\mathbf j$ ($b-n+1$ maglie fondamentali), con $\mathbf i=B^{\mathsf T}\mathbf j$. Per soli resistori e generatori di tensione: $$R_m\,\mathbf j=\mathbf v_s,$$ con $R_{m,jj}=$ somma delle resistenze della maglia, $R_{m,jk}=\pm$ resistenza condivisa (negativa se le correnti hanno verso concorde nel ramo), $v_{s,j}=$ somma algebrica delle tensioni dei generatori nel verso della maglia.`,
    T`Un generatore di corrente su un solo ramo di una maglia fissa la corrente di quella maglia; se è tra due maglie si usa la <em>supermaglia</em> (KVL sul percorso che le contiene, con il vincolo sulle correnti). È il duale del metodo dei nodi.`,
  ],
  figure: [],
  dimostrazioni: [{
    titolo: 'Equazioni alle maglie',
    passi: [T`KVL: $B\,\mathbf v=\mathbf v_s'$ (generatori a secondo membro); costitutive: $\mathbf v=\mathcal R\,\mathbf i$.`, T`Con $\mathbf i=B^{\mathsf T}\mathbf j$ (la KCL è automaticamente soddisfatta perché $A B^{\mathsf T}=0$): $B\,\mathcal R\,B^{\mathsf T}\mathbf j=\mathbf v_s'$.`, T`Quindi $R_m=B\mathcal RB^{\mathsf T}$. $\square$`],
  }],
  esempi: [{
    titolo: 'Due maglie',
    testo: T`Maglia 1: generatore $12\,\mathrm{V}$ e $R_1=2\,\Omega$; ramo comune $R_2=4\,\Omega$; maglia 2: $R_3=2\,\Omega$. Trova $j_1,j_2$.`,
    soluzione: [T`$(R_1+R_2)j_1-R_2j_2=12\Rightarrow 6j_1-4j_2=12$; $-R_2j_1+(R_2+R_3)j_2=0\Rightarrow-4j_1+6j_2=0$.`, T`$j_2=\tfrac23j_1$: $6j_1-\tfrac83j_1=12\Rightarrow\tfrac{10}3j_1=12$, $j_1=\tfrac{18}5=3{,}6\,\mathrm{A}$, $j_2=\tfrac{12}5=2{,}4\,\mathrm{A}$.`, T`Corrente in $R_2$: $j_1-j_2=1{,}2\,\mathrm{A}$.`],
  }],
  errori: [{ sbagliato: T`Dimenticare il segno meno dei termini mutui quando i versi delle correnti di maglia sono tutti orari.`, corretto: T`Con tutte le maglie orarie il ramo comune ha correnti opposte: il termine mutuo è $-R$.` }],
  esame: T`Metodo delle maglie e criteri di scelta nodi/maglie: 3-7-2001, 3-7-2003, 25-9-2007, 17-4-2008, 7-7-2008 [STORICO].`,
  formulario: ['maglie', 'maglie-mat'],
};
