import { F } from './figure1.mjs';
const T = String.raw;
export const B1 = {};

B1['I-01'] = {
  obiettivi: ['Enunciare le ipotesi del modello a costanti concentrate', 'Stimare quando il modello è valido confrontando dimensioni e lunghezza d\'onda', 'Distinguere circuito fisico e modello circuitale'],
  teoria: [
    T`Un circuito fisico è un insieme di dispositivi collegati da conduttori. Il <strong>modello a costanti concentrate</strong> sostituisce ogni dispositivo con un elemento ideale (resistore, condensatore, induttore, generatore…) e i collegamenti con conduttori ideali, in cui tensione e corrente sono grandezze ben definite ai morsetti.`,
    T`L'ipotesi fondamentale è che i fenomeni di propagazione siano trascurabili: se $L$ è la dimensione massima del circuito e $\lambda = c/f$ la lunghezza d'onda ($c\approx 3\cdot10^{8}\,\mathrm{m/s}$), il modello è ragionevole quando $L \ll \lambda$, cioè quando il tempo di propagazione $L/c$ è molto minore del periodo $T=1/f$ del segnale.`,
    T`In questo regime i campi elettrico e magnetico sono confinati nei componenti: l'energia elettrica è «concentrata» nei condensatori, quella magnetica negli induttori, la dissipazione nei resistori. Ne seguono due fatti: la corrente ha lo stesso valore all'ingresso e all'uscita di un conduttore (valgono le leggi di Kirchhoff), e la tensione tra due punti non dipende dal cammino scelto fuori dai componenti.`,
    T`<strong>Ordini di grandezza.</strong> A $50\,\mathrm{Hz}$: $\lambda = 6000\,\mathrm{km}$, quindi un circuito da banco è concentrato, una linea di trasmissione lunga centinaia di km no. A $1\,\mathrm{GHz}$: $\lambda = 30\,\mathrm{cm}$, e già un cavo di $10\,\mathrm{cm}$ non è un semplice filo.`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [{
    titolo: 'Quando un circuito è «concentrato»?',
    testo: T`Un circuito di dimensione massima $L = 20\,\mathrm{cm}$ lavora a $f = 10\,\mathrm{MHz}$. Si può usare il modello a costanti concentrate?`,
    soluzione: [T`$\lambda = c/f = 3\cdot10^{8}/10^{7} = 30\,\mathrm{m}$.`, T`$L/\lambda = 0{,}2/30 \approx 0{,}0067 \ll 1$: l'ipotesi è ben soddisfatta (di solito si richiede almeno $L/\lambda \lesssim 0{,}1$).`, T`Alla stessa dimensione, a $f=1\,\mathrm{GHz}$ sarebbe $\lambda=0{,}3\,\mathrm{m}$ e $L/\lambda \approx 0{,}67$: il modello non è più valido.`],
  }],
  errori: [{ sbagliato: T`Applicare le leggi di Kirchhoff a una linea lunga o ad alta frequenza «perché valgono sempre».`, corretto: T`Le leggi di Kirchhoff derivano dal modello a costanti concentrate: vanno applicate solo se $L \ll \lambda$.` }],
  esame: T`La domanda sulle proprietà dei circuiti (linearità, permanenza, passività, costanti concentrate) compare negli appelli del 24-4-2003, 25-9-2003, 12-7-2005, 11-2-2008, 7-7-2008, 24-4-2009 [STORICO].`,
  formulario: ['lambda', 'concentrate'],
};

B1['I-02'] = {
  obiettivi: ['Enunciare KCL e KVL per nodi, tagli e maglie', 'Dimostrare che la KCL vale per ogni taglio', 'Applicare le leggi con convenzioni di segno corrette'],
  teoria: [
    T`<strong>Legge di Kirchhoff delle correnti (KCL).</strong> In ogni istante la somma algebrica delle correnti dei rami che concorrono a un nodo è nulla: $\sum_k \pm i_k = 0$, con segno $+$ per le correnti uscenti e $-$ per le entranti (o viceversa, purché coerente).`,
    T`<strong>Legge di Kirchhoff delle tensioni (KVL).</strong> In ogni istante la somma algebrica delle tensioni dei rami lungo una maglia, percorsa in un verso, è nulla: $\sum_k \pm v_k = 0$, con $+$ se il verso di riferimento della tensione concorda col verso di percorrenza.`,
    T`Le due leggi dipendono solo dalla <em>topologia</em> (come sono collegati i rami), non dalla natura dei componenti. Sono valide in ogni istante, per qualsiasi forma d'onda, nel modello a costanti concentrate.`,
    T`<strong>Estensione ai tagli.</strong> Un <em>taglio</em> è un insieme di rami la cui rimozione divide il circuito in due parti: la KCL vale per ogni taglio (somma algebrica delle correnti che attraversano la superficie chiusa che racchiude una delle due parti).`,
  ],
  figure: [{ alt: 'Nodo con una corrente entrante i₁ e due uscenti i₂, i₃: i₁ = i₂ + i₃', svg: F.kcl }],
  dimostrazioni: [{
    titolo: 'La KCL vale per ogni taglio',
    enunciato: T`Sia $S$ una superficie chiusa che racchiude un insieme di nodi: la somma algebrica delle correnti dei rami che la attraversano è nulla.`,
    passi: [T`Scrivi la KCL per ciascun nodo racchiuso da $S$: $\sum_{k\in\text{nodo}} \pm i_k = 0$.`, T`Somma le equazioni di tutti i nodi interni.`, T`Un ramo interamente interno a $S$ collega due nodi interni: la sua corrente compare in due equazioni con segno opposto (esce da un nodo, entra nell'altro) e si cancella.`, T`Restano solo le correnti dei rami che attraversano $S$, con segno coerente (uscenti da $S$ ciò che è uscente dal nodo interno). La loro somma è zero. $\square$`],
  }],
  esempi: [{
    titolo: 'KCL e KVL numeriche',
    testo: T`A un nodo entrano $i_1 = 3\,\mathrm{A}$ e $i_2 = 2\,\mathrm{A}$ ed escono $i_3 = 4\,\mathrm{A}$ e $i_4$. Trova $i_4$. Poi, in una maglia di tre rami, $v_1 = 5\,\mathrm{V}$ e $v_2 = -2\,\mathrm{V}$ (versi concordi col giro): trova $v_3$.`,
    soluzione: [T`KCL (entranti $=$ uscenti): $3+2 = 4 + i_4 \Rightarrow i_4 = 1\,\mathrm{A}$.`, T`KVL: $v_1+v_2+v_3 = 0 \Rightarrow v_3 = -(5-2) = -3\,\mathrm{V}$.`],
  }],
  errori: [{ sbagliato: T`Scrivere KCL con segni misti senza fissare una convenzione, ottenendo $i_1+i_2+i_3=0$ con correnti tutte entranti ma di valore positivo.`, corretto: T`Fissa «uscenti $+$, entranti $-$» e ricava i segni dai versi di riferimento, non dai valori.` }],
  esame: T`Le leggi di Kirchhoff sono la base di tutti gli esercizi d'analisi; come tema autonomo non emerge dai testi storici [STORICO].`,
  formulario: ['kcl', 'kvl'],
};

B1['I-03'] = {
  obiettivi: ['Definire porta e bipolo', 'Usare le convenzioni degli utilizzatori e dei generatori', 'Calcolare la potenza assorbita'],
  teoria: [
    T`Una <strong>porta</strong> è una coppia di morsetti per cui, in ogni istante, la corrente che entra da un morsetto è uguale a quella che esce dall'altro. Un <strong>bipolo</strong> è un elemento con due morsetti che forma una porta; un <strong>doppio bipolo</strong> (due porte) ha quattro morsetti accoppiati a due a due.`,
    T`Su ogni porta si fissano un verso di riferimento per la corrente $i$ e uno per la tensione $v$. Nella <strong>convenzione degli utilizzatori</strong> la corrente entra dal morsetto a potenziale di riferimento più alto (il $+$ della tensione): allora $p = v\,i$ è la potenza <em>assorbita</em>. Nella <strong>convenzione dei generatori</strong> la corrente esce dal morsetto $+$ e $p=v\,i$ è la potenza <em>erogata</em>.`,
    T`L'energia assorbita tra $t_0$ e $t$ è $w(t_0,t)=\int_{t_0}^{t} v(\tau)\,i(\tau)\,d\tau$.`,
  ],
  figure: [{ alt: 'Bipolo con corrente i entrante nel morsetto positivo e tensione v tra i morsetti (convenzione degli utilizzatori)', svg: F.bipolo }],
  dimostrazioni: [],
  esempi: [{
    titolo: 'Potenza assorbita e erogata',
    testo: T`Un bipolo ha $v = 12\,\mathrm{V}$ e $i = -2\,\mathrm{A}$ nella convenzione degli utilizzatori. Assorbe o eroga potenza?`,
    soluzione: [T`$p = v\,i = 12\cdot(-2) = -24\,\mathrm{W}$ (assorbita).`, T`Potenza assorbita negativa significa che il bipolo <em>eroga</em> $24\,\mathrm{W}$.`],
  }],
  errori: [{ sbagliato: T`Usare $p=vi$ come potenza assorbita con $i$ riferita in verso uscente dal $+$.`, corretto: T`Con la convenzione dei generatori $p=vi$ è erogata; per l'assorbita cambia segno.` }],
  esame: T`Concetto di base; compare nelle domande sulle proprietà dei circuiti e sulle potenze [STORICO].`,
  formulario: ['potenza-istantanea', 'energia'],
};

B1['I-04'] = {
  obiettivi: ['Definire linearità, tempo-invarianza, passività e causalità', 'Verificare le proprietà su un elemento dato', 'Citare esempi di elementi che le violano'],
  teoria: [
    T`Un elemento (o circuito) è <strong>lineare</strong> se vale la sovrapposizione degli effetti: se all'ingresso $x_1$ corrisponde $y_1$ e a $x_2$ corrisponde $y_2$, allora a $a x_1 + b x_2$ corrisponde $a y_1 + b y_2$ (additività e omogeneità), con condizioni iniziali nulle.`,
    T`È <strong>tempo-invariante</strong> (permanente) se traslando l'ingresso nel tempo di $T$ la risposta trasla di $T$: $x(t-T)\mapsto y(t-T)$. I parametri non dipendono dal tempo.`,
    T`È <strong>causale</strong> se la risposta all'istante $t$ dipende solo dall'ingresso a istanti $\le t$.`,
    T`È <strong>passivo</strong> se non può erogare più energia di quella che ha ricevuto: per ogni scelta delle grandezze ai morsetti l'energia assorbita $\int_{-\infty}^{t} v i\,d\tau \ge 0$ (con energia iniziale nulla). La definizione precisa può variare tra i testi [DA VERIFICARE].`,
    T`Esempi. $R$, $L$, $C$ costanti sono lineari, tempo-invarianti e passivi. Un generatore indipendente non è passivo (può erogare energia) e, avendo un'uscita non nulla a ingresso nullo, non è lineare in senso stretto. $v = R i^3$ è non lineare; $R(t)$ è tempo-variante.`,
  ],
  figure: [],
  dimostrazioni: [{
    titolo: 'Il condensatore lineare e tempo-invariante è lineare e tempo-invariante',
    enunciato: T`La relazione $i = C\,dv/dt$ con $C$ costante definisce un elemento lineare e tempo-invariante.`,
    passi: [T`Linearità: se $v=a v_1+b v_2$ allora $i = C\,d(a v_1+b v_2)/dt = a\,C\dot v_1 + b\,C\dot v_2 = a i_1 + b i_2$, per linearità della derivata.`, T`Tempo-invarianza: se $v_T(t)=v(t-T)$ allora $i_T = C\,\dot v_T(t) = C\,\dot v(t-T) = i(t-T)$, perché $C$ non dipende da $t$. $\square$`],
  }],
  esempi: [{
    titolo: 'Riconoscere le proprietà',
    testo: T`Classifica: (a) $v = 3i$; (b) $v = 2i^2$; (c) $v = t\,i$.`,
    soluzione: [T`(a) lineare e tempo-invariante.`, T`(b) non lineare: $v(2i)=8i^2\neq 2\,v(i)$; tempo-invariante.`, T`(c) lineare ma tempo-variante: il coefficiente dipende da $t$.`],
  }],
  errori: [{ sbagliato: T`Dire che un circuito con un generatore indipendente è «lineare» e applicare la sovrapposizione alla sola uscita totale.`, corretto: T`La sovrapposizione si applica agli effetti dei singoli generatori (anche i controllati restano nel circuito).` }],
  esame: T`Proprietà dei circuiti: 24-4-2003, 25-9-2003, 12-7-2005, 11-2-2008, 7-7-2008, 24-4-2009 [STORICO].`,
  formulario: ['linearita', 'tempo-invarianza'],
};

B1['I-05'] = {
  obiettivi: ['Scrivere le relazioni costitutive di R, L, C e dei generatori ideali', 'Dimostrare la continuità di $i_L$ e $v_C$', 'Usare i modelli ad alta e bassa frequenza (corto/aperto)'],
  teoria: [
    T`<strong>Resistore.</strong> $v = R\,i$, ovvero $i = G\,v$ con $G=1/R$. Cortocircuito: $R=0$ ($v=0$ per ogni $i$). Circuito aperto: $G=0$ ($i=0$ per ogni $v$).`,
    T`<strong>Condensatore.</strong> $i = C\,\dfrac{dv}{dt}$, e $v(t) = v(t_0) + \dfrac{1}{C}\int_{t_0}^{t} i\,d\tau$. In continua ($dv/dt=0$) si comporta come un circuito aperto.`,
    T`<strong>Induttore.</strong> $v = L\,\dfrac{di}{dt}$, e $i(t) = i(t_0)+\dfrac{1}{L}\int_{t_0}^{t} v\,d\tau$. In continua è un cortocircuito.`,
    T`<strong>Generatori ideali.</strong> Il generatore di tensione impone $v=e(t)$ per ogni corrente; quello di corrente impone $i=j(t)$ per ogni tensione. Con valore nullo, il primo è un corto, il secondo un aperto.`,
    T`Questi elementi sono <em>circuiti con memoria</em> ($C$, $L$: la risposta dipende dalla storia) o <em>senza memoria</em> ($R$, generatori).`,
  ],
  figure: [],
  dimostrazioni: [{
    titolo: 'Continuità della corrente nell\'induttore e della tensione nel condensatore',
    enunciato: T`Se la tensione $v$ ai capi di un induttore è limitata in un intorno di $t_0$, la corrente $i_L$ è continua in $t_0$. Analogamente $v_C$ è continua se $i_C$ è limitata.`,
    passi: [T`Dalla costitutiva: $i_L(t_0+\varepsilon)-i_L(t_0-\varepsilon) = \dfrac{1}{L}\int_{t_0-\varepsilon}^{t_0+\varepsilon} v\,d\tau$.`, T`Se $|v|\le M$ nell'intorno, il modulo del secondo membro è $\le 2M\varepsilon/L$.`, T`Per $\varepsilon\to0$ il membro di destra tende a zero, quindi $i_L(t_0^+)=i_L(t_0^-)$. La dimostrazione per $v_C$ è identica scambiando i ruoli ($v_C=\frac1C\int i\,d\tau$). $\square$`],
    nota: T`Se $v$ contiene impulsi (casi con elementi ideali incongruenti) la continuità può cadere: vedi [DA VERIFICARE] la trattazione del docente.`,
  }],
  esempi: [{
    titolo: 'Carica di un condensatore a corrente costante',
    testo: T`Un condensatore $C = 2\,\mathrm{F}$, inizialmente scarico, è attraversato da $i = 3\,\mathrm{A}$ per $4\,\mathrm{s}$. Trova $v$ finale ed energia accumulata.`,
    soluzione: [T`$v(4)=\dfrac{1}{2}\int_0^4 3\,d\tau = \dfrac{12}{2}=6\,\mathrm{V}$.`, T`$W = \tfrac12 C v^2 = \tfrac12\cdot 2\cdot 36 = 36\,\mathrm{J}$.`],
  }],
  errori: [{ sbagliato: T`Imporre $v_C(0^+)=0$ per t>0 «perché il generatore si spegne».`, corretto: T`$v_C$ è continua: $v_C(0^+)=v_C(0^-)$ è il valore raggiunto nel regime precedente.` }],
  esame: T`Costante di tempo e scarica/carica RC compaiono in 14-7-2000, 3-7-2001, 18-9-2002, 25-9-2007, 17-4-2008 [STORICO]; la continuità di $v_C$ e $i_L$ è il passo 8 della procedura dell'esercizio d'analisi.`,
  formulario: ['resistore', 'condensatore', 'induttore', 'cont-vc-il'],
};

B1['I-06'] = {
  obiettivi: ['Calcolare potenza ed energia nei bipoli elementari', 'Riconoscere le incongruenze degli elementi ideali', 'Costruire il modello di un bipolo reale'],
  teoria: [
    T`<strong>Energie.</strong> Resistore: potenza assorbita $p=Ri^2=v^2/R\ge0$ (sempre dissipata). Condensatore: energia $W_C=\tfrac12 C v^2$. Induttore: $W_L=\tfrac12 L i^2$. Tutti e tre sono passivi per $R,C,L>0$.`,
    T`<strong>Incongruenze degli elementi ideali.</strong> Gli elementi ideali possono produrre situazioni prive di soluzione o con valori impulsivi: due generatori di tensione diversi in parallelo violano la KVL; un generatore di corrente su un circuito aperto (o in serie con un altro di valore diverso) viola la KCL; un generatore di tensione in corto ha corrente indeterminata; due condensatori a tensione diversa collegati in parallelo imporrebbero un salto istantaneo di tensione.`,
    T`<strong>Bipoli reali.</strong> Un componente reale si descrive con un circuito equivalente più ricco: una pila reale è un generatore di tensione $E$ con una resistenza interna $r$ in serie ($v=E-r\,i$), oppure un generatore di corrente $E/r$ in parallelo a $r$. L'incongruenza sparisce tenendo conto delle resistenze (piccole ma non nulle) dei collegamenti.`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [{
    titolo: 'Due condensatori collegati in parallelo',
    testo: T`$C_1=C_2=1\,\mathrm{F}$ con $v_1=2\,\mathrm{V}$ e $v_2=0$ vengono collegati in parallelo. Trova la tensione finale e la variazione di energia.`,
    soluzione: [T`Conservazione della carica: $Q=C_1 v_1 + C_2 v_2 = 2\,\mathrm{C}$. Finale: $v=Q/(C_1+C_2)=1\,\mathrm{V}$.`, T`Energia iniziale: $\tfrac12\cdot1\cdot2^2=2\,\mathrm{J}$. Finale: $\tfrac12\cdot 2\cdot1^2 = 1\,\mathrm{J}$.`, T`Un joule va perso: nel modello ideale non c'è un elemento dissipativo, ma nel circuito reale c'è sempre una resistenza (o radiazione) che lo dissipa.`],
  }],
  errori: [{ sbagliato: T`Concludere che l'energia si conserva sempre nel circuito ideale.`, corretto: T`Un collegamento ideale può avere transitorio impulsivo con perdita di energia: il risultato dipende da una resistenza trascurata.` }],
  esame: T`Aspetti energetici e passività: 12-7-2005, 25-9-2007, 11-2-2008 (domande su potenze e proprietà) [STORICO].`,
  formulario: ['energia-c', 'energia-l', 'pila-reale'],
};

B1['I-07'] = {
  obiettivi: ['Riconoscere i quattro tipi di generatori controllati', 'Includerli correttamente nell\'analisi', 'Ricordare che non vanno spenti insieme agli indipendenti'],
  teoria: [
    T`Un <strong>generatore controllato</strong> è un doppio bipolo: la grandezza di una porta (ingresso, di controllo) determina quella dell'altra (uscita). I quattro tipi lineari:`,
    T`<ul><li><strong>VCVS</strong> (tensione ↔ tensione): $v_2=\mu\,v_1$, $i_1=0$.</li><li><strong>VCCS</strong> (tensione → corrente): $i_2=g_m\,v_1$, $i_1=0$.</li><li><strong>CCVS</strong> (corrente → tensione): $v_2=r_m\,i_1$, $v_1=0$.</li><li><strong>CCCS</strong> (corrente ↔ corrente): $i_2=\beta\,i_1$, $v_1=0$.</li></ul>`,
    T`Sono elementi <em>attivi</em> (possono erogare potenza netta) e <em>non reciproci</em>. Servono a modellare amplificatori, transistor, ecc.`,
    T`<strong>Regola operativa.</strong> Nei circuiti con generatori controllati, quando si «spengono i generatori indipendenti» (per Thevenin, Norton, risposta libera) i generatori controllati restano nel circuito.`,
  ],
  figure: [],
  dimostrazioni: [],
  esempi: [{
    titolo: 'VCCS con partitore a monte',
    testo: T`Un generatore $V_g=6\,\mathrm{V}$ alimenta $R_1=2\,\Omega$ in serie con $R_2=4\,\Omega$; la tensione $v_2$ su $R_2$ controlla un VCCS con $g_m=0{,}5\,\mathrm{S}$ che alimenta $R_3=3\,\Omega$. Trova la tensione su $R_3$.`,
    soluzione: [T`Il controllo è in tensione e non assorbe corrente: $v_2 = 6\cdot\dfrac{4}{2+4}=4\,\mathrm{V}$.`, T`$i_{out}=g_m v_2=0{,}5\cdot4=2\,\mathrm{A}$.`, T`$v_3=R_3\,i_{out}=3\cdot2=6\,\mathrm{V}$.`],
  }],
  errori: [{ sbagliato: T`Per trovare $R_{th}$ spegnere anche un VCCS («è un generatore»).`, corretto: T`Si spengono solo i generatori <em>indipendenti</em>; il controllato resta e $R_{th}$ si trova col generatore di prova $V/I$.` }],
  esame: T`Elemento ricorrente dell'esercizio d'analisi (Thevenin con 2-porte e controllati) [STORICO].`,
  formulario: ['vcvs', 'vccs', 'ccvs', 'cccs'],
};

B1['I-08'] = {
  obiettivi: ['Scrivere le equazioni del trasformatore ideale', 'Dimostrare che non assorbe potenza netta', 'Riportare impedenze da una porta all\'altra'],
  teoria: [
    T`Il <strong>trasformatore ideale</strong> con rapporto $n$ è un doppio bipolo lineare e senza memoria. Con la convenzione degli utilizzatori su entrambe le porte: $$v_1 = n\,v_2,\qquad i_1 = -\frac{i_2}{n}.$$`,
    T`Non è un induttore: funziona anche in continua ed è un modello limite (accoppiamento perfetto, induttanze infinite, perdite nulle).`,
    T`<strong>Proprietà.</strong> La potenza assorbita complessiva è nulla in ogni istante; un carico $Z_L$ alla porta 2 è visto dalla porta 1 come $n^2 Z_L$ (con $n$ definito come sopra).`,
  ],
  figure: [{ alt: 'Trasformatore ideale con rapporto n:1, correnti i₁ e i₂ entranti e tensioni v₁, v₂', svg: F.trasf }],
  dimostrazioni: [{
    titolo: 'Il trasformatore ideale non assorbe potenza e riporta le impedenze',
    enunciato: T`Con $v_1=nv_2$ e $i_1=-i_2/n$: (a) $p_1+p_2=0$; (b) se $v_2=-Z_L\,i_2$ allora $v_1/i_1=n^2Z_L$.`,
    passi: [T`(a) $p=v_1 i_1+v_2 i_2 = (n v_2)(-i_2/n)+v_2 i_2 = -v_2 i_2+v_2 i_2 = 0$.`, T`(b) La porta 2 è chiusa su $Z_L$; con $i_2$ entrante nel trasformatore, la corrente nel carico è $-i_2$, quindi $v_2=Z_L(-i_2)$.`, T`$Z_{in}=\dfrac{v_1}{i_1}=\dfrac{n\,v_2}{-i_2/n}=n^2\,\dfrac{v_2}{-i_2}=n^2 Z_L$. $\square$`],
  }],
  esempi: [{
    titolo: 'Trasformatore con carico resistivo',
    testo: T`$n=2$, carico $R_L=3\,\Omega$ alla porta 2; alla porta 1 un generatore $24\,\mathrm{V}$ in serie con $12\,\Omega$. Trova $v_2$ e la potenza nel carico.`,
    soluzione: [T`$R_{in}=n^2R_L=12\,\Omega$.`, T`Maglia primaria: $24=12\,i_1+12\,i_1\Rightarrow i_1=1\,\mathrm{A}$, $v_1=12\,\mathrm{V}$.`, T`$v_2=v_1/n=6\,\mathrm{V}$, $i_2=-n\,i_1=-2\,\mathrm{A}$ (la corrente nel carico è $2\,\mathrm{A}$).`, T`$P_L=6\cdot2=12\,\mathrm{W}=v_1 i_1$: la potenza si conserva. ✓`],
  }],
  errori: [{ sbagliato: T`Usare $i_1=i_2/n$ con entrambe le correnti entranti.`, corretto: T`Con convenzione degli utilizzatori su entrambe le porte, $i_1=-i_2/n$ (il segno meno compensa i versi).` }],
  esame: T`Trasformatore ideale: 30-10-2002 e 24-4-2009 (anche con massimo trasferimento di potenza); compare tra gli elementi dell'esercizio d'analisi recente [STORICO].`,
  formulario: ['trasf-v', 'trasf-i', 'trasf-z'],
};

B1['I-09'] = {
  obiettivi: ['Definire nullatore, noratore e nullore', 'Collegare il modello lineare dell\'op-amp al nullore', 'Calcolare le configurazioni standard'],
  teoria: [
    T`Il <strong>nullatore</strong> è un bipolo con $v=0$ e $i=0$ contemporaneamente. Il <strong>noratore</strong> è un bipolo con tensione e corrente <em>qualsiasi</em>. Un <strong>nullore</strong> è il doppio bipolo formato dal nullatore (porta 1) e dal noratore (porta 2): impone $v_1=0$, $i_1=0$ e lascia libere $v_2$, $i_2$. Negli esercizi si usa di solito la versione sbilanciata (un morsetto comune).`,
    T`<strong>Dal componente reale all'ideale.</strong> L'amplificatore operazionale reale è modellabile in regione lineare con resistenza di ingresso $R_i$ ($10^5$–$10^{12}\,\Omega$), resistenza d'uscita $R_o$ ($5$–$50\,\Omega$) e generatore controllato $v_o=A\,v_d$ con $v_d=v_2-v_1$ e $A$ tra $10^5$ e $10^8$. Ha tre regioni: lineare e due di saturazione ($\pm V_{cc}$). Nel limite ideale $A\to\infty$, $R_i\to\infty$, $R_o=0$ si ha $v_d=0$ e correnti d'ingresso nulle: è un nullore.`,
    T`<strong>Due configurazioni tipiche con il nullore.</strong> (a) <em>Generatore di tensione:</em> la corrente $I_g$ che attraversa $R$ produce $V=R\,I_g$; il generatore pilota ha tensione nulla e non eroga potenza (la potenza arriva dal nullore). (b) <em>Generatore di corrente:</em> la tensione $V_g$ è riportata su $R$ e dà $I=V_g/R$; il generatore pilota ha corrente nulla.`,
    T`<div class="table-wrap"><table><thead><tr><th>Circuito</th><th>Uscita</th></tr></thead><tbody><tr><td>Invertente</td><td>$v_o=-\dfrac{R_2}{R_1}V_g$</td></tr><tr><td>Sommatore invertente</td><td>$v_o=-R_0\left(\dfrac{V_{g1}}{R_1}+\dfrac{V_{g2}}{R_2}+\dfrac{V_{g3}}{R_3}\right)$</td></tr><tr><td>Non invertente</td><td>$v_o=\left(1+\dfrac{R_2}{R_1}\right)V_g$</td></tr><tr><td>Inseguitore</td><td>$v_o=V_g$ (impedenza d'ingresso teoricamente infinita)</td></tr><tr><td>Differenziale</td><td>$v_o=\dfrac{R_2}{R_1}(V_{g2}-V_{g1})$</td></tr></tbody></table></div>`,
  ],
  figure: [{ alt: 'Nullore: nullatore (v=0, i=0) seguito da noratore (v e i libere)', svg: F.nullore }, { alt: 'Amplificatore operazionale in configurazione invertente con R₁ in ingresso e R₂ in retroazione', svg: F.invertente }],
  dimostrazioni: [{
    titolo: 'Guadagno dell\'invertente: dal modello con $A$ finito al nullore',
    enunciato: T`Con modello lineare ($R_i\to\infty$, $R_o=0$, guadagno $A$) il guadagno è $v_o/V_g=-\dfrac{R_2}{R_1}\cdot\dfrac{1}{1+(1+R_2/R_1)/A}$, che tende a $-R_2/R_1$ per $A\to\infty$.`,
    passi: [T`Ingresso non invertente a massa: $v_d=v_+-v_-=-v_-$, quindi $v_o=A\,v_d=-A\,v_-$ e $v_-=-v_o/A$.`, T`KCL al nodo invertente (corrente d'ingresso nulla): $\dfrac{V_g-v_-}{R_1}=\dfrac{v_--v_o}{R_2}$.`, T`Sostituisci $v_-$: $\dfrac{V_g+v_o/A}{R_1}=\dfrac{-v_o/A-v_o}{R_2}$, cioè $R_2V_g+\dfrac{R_2}{A}v_o=-\dfrac{R_1}{A}v_o-R_1v_o$.`, T`Raccogli $v_o$: $R_2V_g=-v_o\left(R_1+\dfrac{R_1+R_2}{A}\right)$, da cui la formula dell'enunciato.`, T`Per $A\to\infty$: $v_d=-v_-=v_o/A\to0$ (nullatore) e $v_o=-(R_2/R_1)V_g$. $\square$`],
  }],
  esempi: [{
    titolo: 'Reale contro ideale',
    testo: T`Invertente con $R_2/R_1=10$ e $A=10^5$: confronta il guadagno reale con quello ideale.`,
    soluzione: [T`Ideale: $-10$.`, T`Reale: $-10/(1+11/10^5)=-10/1{,}00011\approx-9{,}9989$.`, T`Differenza relativa $\approx0{,}011\%$: l'idealizzazione è eccellente.`],
  }, {
    titolo: 'Nullore come generatore di tensione',
    testo: T`Un nullore ha un generatore di corrente $I_g=2\,\mathrm{A}$ al nullatore in serie a $R=3\,\Omega$ verso il noratore: quanto vale la tensione impressa?`,
    soluzione: [T`$I_g$ attraversa $R$ (il nullatore non assorbe corrente): $V=R\,I_g=3\cdot2=6\,\mathrm{V}$.`, T`La tensione ai capi del nullatore è nulla: il generatore di corrente pilota non eroga potenza.`],
  }],
  errori: [{ sbagliato: T`Dire che la corrente d'ingresso è nulla «perché la tensione d'ingresso è nulla» come su un corto.`, corretto: T`Nel nullatore tensione <em>e</em> corrente sono entrambe nulle: la corrente è nulla perché $R_i\to\infty$, la tensione perché $A\to\infty$ con retroazione.` }],
  esame: T`Nullore: proprietà e configurazioni 25-10-2001 [STORICO]; presente in 4 dei 14 esercizi d'analisi 2015–2024 [STORICO].`,
  formulario: ['invertente', 'sommatore', 'non-invertente', 'inseguitore', 'differenziale', 'nullore-def', 'opamp-reale'],
};
