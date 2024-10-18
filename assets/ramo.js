let nombre=sessionStorage.getItem("nombre") || -1;
if(nombre===-1){window.location.href="CalculadoraFinis.html";}

const NOMBRE=document.getElementById("NOMBRE");
NOMBRE.value=nombre; 

let ramos= JSON.parse(localStorage.getItem("ramos"));

var D_B=JSON.parse(localStorage.getItem(nombre)) || -1;

if(D_B===-1){
    D_B={
        "ponderaciones":["36","14","20"],
        "controles":["",""],
        "labs":["","","","","","",""],
        "proyecto":["","",""]
    }
}

const ponControles=document.getElementById("ponControles");
const ponLabs=document.getElementById("ponLabs");
const ponProyecto=document.getElementById("ponProyecto");
ponControles.value=D_B["ponderaciones"][0];
ponLabs.value=D_B["ponderaciones"][1];
ponProyecto.value=D_B["ponderaciones"][2];

const Sol1=document.getElementById("Sol1");
const Sol2=document.getElementById("Sol2");
Sol1.value=D_B["controles"][0];
Sol2.value=D_B["controles"][1];

const Lab1=document.getElementById("Lab1");
const Lab2=document.getElementById("Lab2");
const Lab3=document.getElementById("Lab3");
Lab1.value=D_B["labs"][0];
Lab2.value=D_B["labs"][1];
Lab3.value=D_B["labs"][2];

const Tall1=document.getElementById("Tall1");
const Tall2=document.getElementById("Tall2");
const Tall3=document.getElementById("Tall3");
const Tall4=document.getElementById("Tall4");
Tall1.value=D_B["labs"][3];
Tall2.value=D_B["labs"][4];
Tall3.value=D_B["labs"][5];
Tall4.value=D_B["labs"][6];

const E1=document.getElementById("E1");
const E2=document.getElementById("E2");
const E3=document.getElementById("E3");
E1.value=D_B["proyecto"][0];
E2.value=D_B["proyecto"][1];
E3.value=D_B["proyecto"][2];

const notControles=document.getElementById("notControles");
const notLabs=document.getElementById("notLabs");
const notProyecto=document.getElementById("notProyecto");

const notaPre=document.getElementById("notaPre");
save();

function promediar(arr,q){
    let s=0;
    if(q===0){return 1;}
    for(let num of arr){
        if(num===""){continue;}
        else{s+=parseFloat(num);}
    }
    return (s/q);
}

function save(){
    let solemnes=2,labs=3,talls=4,Es=3;
    let l_solemnes=[Sol1.value,Sol2.value];
    let l_labs=[Lab1.value,Lab2.value,Lab3.value];
    let l_talls=[Tall1.value,Tall2.value,Tall3.value,Tall4.value];
    let l_Es=[E1.value,E2.value,E3.value];
    
    for(let el in l_solemnes){
        if(l_solemnes[el]===""){solemnes--;}
        else if(l_solemnes[el]<1 || l_solemnes[el]>7){l_solemnes[el]=1;}
    }
    for(let el in l_labs){
        if(l_labs[el]===""){labs--;}
        else if(l_labs[el]<1 || l_labs[el]>7){l_labs[el]=1;}
    }
    for(let el in l_talls){
        if(l_talls[el]===""){talls--;}
        else if(l_talls[el]<1 || l_talls[el]>7){l_talls[el]=1;}
    }
    for(let el in l_Es){
        if(l_Es[el]===""){Es--;}
        else if(l_Es[el]<1 || l_Es[el]>7){l_Es[el]=1;}
    }

    let CONTROL=promediar(l_solemnes,solemnes);
    
    let LABS=0;
    if(labs>0){LABS=((promediar(l_labs,labs)+promediar(l_talls,talls))/2);}
    else{LABS=promediar(l_talls,talls);}
    
    let PROYECTO=promediar(l_Es,Es);

    notControles.innerText=CONTROL.toFixed(3);
    notLabs.innerText=LABS.toFixed(3);
    notProyecto.innerText=PROYECTO.toFixed(3);

    const pC=ponControles.value/100;
    const pL=ponLabs.value/100;
    const pP=ponProyecto.value/100;

    let FINAL=(((CONTROL*pC)+(LABS*pL)+(PROYECTO*pP))/(pC+pP+pL)).toFixed(3);
    notaPre.innerText=`Nota Pre: ${FINAL}`;

    for(let i of l_talls){l_labs.push(i);}

    D_B["ponderaciones"]=[ponControles.value,ponLabs.value,ponProyecto.value];
    D_B["controles"]=l_solemnes;
    D_B["labs"]=l_labs;
    D_B["proyecto"]=l_Es;
    
    localStorage.setItem(nombre,JSON.stringify(D_B));
}

function changeName(n){
    n=n.replaceAll(" ","_");
    if(n.length<3 || n.length>14){return alert("Nombre inválido")}
    if(ramos.indexOf(n)!=-1){return alert("Ramo ya existe");}
    localStorage.removeItem(nombre);
    ramos[ramos.indexOf(nombre)]=n;
    nombre=n;
    localStorage.setItem(nombre,JSON.stringify(D_B));
    localStorage.setItem("ramos",JSON.stringify(ramos));
}

function eliminar(){
    ramos.splice(ramos.indexOf(nombre),1);
    localStorage.removeItem(nombre);
    localStorage.setItem("ramos",JSON.stringify(ramos));
    blurAll();
    goTo("CalculadoraFinis.html#Ramos");
}
