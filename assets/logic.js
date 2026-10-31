// Compatibilidad con versiones previas de la calculadora
function porDefecto(){
  const pc = document.getElementById("ponControles");
  const pl = document.getElementById("ponLabs");
  const pp = document.getElementById("ponProyecto");
  if(pc) pc.value = 36;
  if(pl) pl.value = 14;
  if(pp) pp.value = 20;
  calculadora();
}

function calculadora(){
  const pcEl = document.getElementById("ponControles");
  const plEl = document.getElementById("ponLabs");
  const ppEl = document.getElementById("ponProyecto");
  const proCEl = document.getElementById("proControles");
  const proLEl = document.getElementById("proLabs");
  const proPEl = document.getElementById("proProyecto");
  const npEl = document.getElementById("notaPresentacion");

  let pc = (pcEl ? parseFloat(pcEl.value) : 40) / 100; if(isNaN(pc)){pc=0;}
  let pl = (plEl ? parseFloat(plEl.value) : 30) / 100; if(isNaN(pl)){pl=0;}
  let pp = (ppEl ? parseFloat(ppEl.value) : 30) / 100; if(isNaN(pp)){pp=0;}
  
  let control = proCEl ? parseFloat(proCEl.value) : 1; 
  if(isNaN(control) || (control<1 || control>7)){control=1;}
  let lab = proLEl ? parseFloat(proLEl.value) : 1; 
  if(isNaN(lab) || (lab<1 || lab>7)){lab=1;}
  let proyecto = proPEl ? parseFloat(proPEl.value) : 1; 
  if(isNaN(proyecto) || (proyecto<1 || proyecto>7)){proyecto=1;}

  if (npEl && (pc+pl+pp) > 0) {
    npEl.value = (((control*pc)+(lab*pl)+(proyecto*pp))/(pc+pl+pp)).toFixed(3);
  }

  return examen();
}

function examen(){
  const npEl = document.getElementById("notaPresentacion");
  const neEl = document.getElementById("notaExamen");
  if (!npEl || !neEl) return;
  let np = parseFloat(npEl.value);
  if(isNaN(np) || (np<1 || np>7)){return;}
  neEl.innerText = `Nota: ${((3.95-(np*0.7))/0.3).toFixed(3)}`;
}
