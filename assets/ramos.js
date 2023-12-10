var iterador = 0;
const Base_Datos = JSON.parse(localStorage.getItem("Ramos")) || [];
crear();

// Functions

function promediar(){
    let notas = document.getElementById("notas").value;
    notas = notas.split([","]);
    const total = document.getElementById("resultado");
    var resultado = 0;

    console.log(notas);
    for(var nota=0;nota<notas.length;nota++){
        var not = parseFloat(notas[nota]);
        if(not<1 || not>7){
            total.textContent = "Error";
            return
        };
        resultado += not;
    }

    resultado /= notas.length;
    resultado = (Math.round(resultado*10))/10;
    total.textContent = `Resultado: ${resultado}`
};

function agregar(){
    
    const ramo = document.getElementById("ramo").value;
    if (ramo === ""){
        return
    };

    Base_Datos.push({"ramo":ramo,"n1":"","n2":"","n3":"","n4":""});
    localStorage.setItem("Ramos",JSON.stringify(Base_Datos));
    location.reload()
};

function crear(){
    
    for(var ramo=0;ramo<Base_Datos.length;ramo++){
        
        const N_Ramo = Base_Datos[ramo].ramo;
        const n1 = Base_Datos[ramo].n1;
        const n2 = Base_Datos[ramo].n2;
        const n3 = Base_Datos[ramo].n3;
        const n4 = Base_Datos[ramo].n4;
        
        var agg = `<tr id="tr_${iterador}">`;
        agg += `<td>${N_Ramo}</td>`;
        agg +=  `<td><input class="inputs" id="n1_${iterador}" value="${n1}"></td>`;
        agg +=  `<td><input class="inputs" id="n2_${iterador}" value="${n2}"></td>`;
        agg +=  `<td><input class="inputs" id="n3_${iterador}" value="${n3}"></td>`;
        agg +=  `<td><input class="inputs" id="n4_${iterador}" value="${n4}"></td>`;
        agg +=  `<td><div class="botones" onclick="guardar(${iterador})" style="margin: 10px auto; width:90px;">Guardar</div>\
        <div class="botones" onclick="eliminar(${iterador})" style="margin: 10px auto; width:90px;">Eliminar</div></td>`;
        agg += "</tr>";
        document.getElementById("Tabla_Ramos").innerHTML += agg;
        iterador++
    };
};

function Dclear(){
    localStorage.removeItem("Ramos");
    location.reload()
};

function eliminar(dato){
    const row = document.getElementById(`tr_${dato}`);
    row.remove();
    Base_Datos.splice(dato,1);
    localStorage.setItem("Ramos",JSON.stringify(Base_Datos));
    location.reload()
};

function guardar(dato){
    const n1 = document.getElementById(`n1_${dato}`).value;
    const n2 = document.getElementById(`n2_${dato}`).value;
    const n3 = document.getElementById(`n3_${dato}`).value;
    const n4 = document.getElementById(`n4_${dato}`).value;

    Base_Datos[dato].n1 = n1;
    Base_Datos[dato].n2 = n2;
    Base_Datos[dato].n3 = n3;
    Base_Datos[dato].n4 = n4;

    localStorage.setItem("Ramos",JSON.stringify(Base_Datos));
    location.reload()
}