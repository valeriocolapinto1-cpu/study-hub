const b=document.getElementById('copy-q');
b.addEventListener('click',async()=>{const t=[...document.querySelectorAll('#domande li')].map((l,i)=>(i+1)+'. '+l.textContent).join('\n');
try{await navigator.clipboard.writeText(t);b.textContent='Copiato ✓';}catch(e){b.textContent='Copia non riuscita: seleziona il testo a mano';}});
