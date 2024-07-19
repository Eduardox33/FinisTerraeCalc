let ramos= JSON.parse(localStorage.getItem("ramos")) || [];
const tablaRamos=document.getElementById("tablaRamos");

for(var r of ramos){
    tablaRamos.innerHTML+=`<tr><td onclick="viajar(this.innerText)">${r}</td></tr>`;
}

function agregar(){
    if(ramos.length>8){return alert("Demasiados Ramos");}
    tablaRamos.innerHTML+=`<tr><td onclick="viajar(this.innerText)">Ramo_${ramos.length}</td></tr>`;
    ramos.push(`Ramo_${ramos.length}`);
    localStorage.setItem("ramos",JSON.stringify(ramos));
}

function viajar(r){
    sessionStorage.setItem("nombre",r);
    window.location.href="#Calculadora";
    setTimeout(()=>window.location.href="Ramo.html",800);
}