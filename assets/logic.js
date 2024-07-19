const ponControles=document.getElementById("ponControles");
const ponLabs=document.getElementById("ponLabs");
const ponProyecto=document.getElementById("ponProyecto");

const proControles=document.getElementById("proControles");
const proLabs=document.getElementById("proLabs");
const proProyecto=document.getElementById("proProyecto");

const notaPresentacion=document.getElementById("notaPresentacion");
const notaExamen=document.getElementById("notaExamen");

function porDefecto(){
    ponControles.value=36;
    ponLabs.value=14;
    ponProyecto.value=20;
    calculadora();
}

function calculadora(){
    let pc=ponControles.value/100; if(isNaN(pc)){pc=0;}
    let pl=ponLabs.value/100; if(isNaN(pl)){pl=0;}
    let pp=ponProyecto.value/100; if(isNaN(pp)){pp=0;}
    
    let control=proControles.value; 
    if(isNaN(control) || (control<1 || control>7)){control=1;}
    let lab=proLabs.value; 
    if(isNaN(lab) || (lab<1 || lab>7)){lab=1;}
    let proyecto=proProyecto.value; 
    if(isNaN(proyecto) || (proyecto<1 || proyecto>7)){proyecto=1;}
    notaPresentacion.value=(((control*pc)+(lab*pl)+(proyecto*pp))/(pc+pl+pp)).toFixed(3);

    return examen();
}

function examen(){
    let np=notaPresentacion.value;
    if(isNaN(np) || (np<1 || np>7)){return;}
    notaExamen.innerText=`Nota: ${((3.95-(np*0.7))/0.3).toFixed(3)}`;
}