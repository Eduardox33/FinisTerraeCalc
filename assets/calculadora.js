// RISA

const risa = new Audio("assets/audio.wav");

// PROGRAMA

load();

// FUNCTIONS

function load(){
    Data_Ponderaciones = JSON.parse(localStorage.getItem("Data_Ponderaciones"));
    if(Data_Ponderaciones){
        document.getElementById("p_controles").value = Data_Ponderaciones.p_controles;
        document.getElementById("p_labs").value = Data_Ponderaciones.p_labs;
        document.getElementById("p_proyecto").value = Data_Ponderaciones.p_proyecto
    }
};

function defecto(){
    localStorage.removeItem("Data_Ponderaciones");
    location.reload()
};

function guardar(){
    const p_controles = parseFloat(document.getElementById("p_controles").value);
    if(p_controles<0 || isNaN(p_controles)){
        document.getElementById("error").textContent = "Valor incorrecto";
        return 
    }; 
    const p_labs = parseFloat(document.getElementById("p_labs").value);
    if(p_labs<0 || isNaN(p_labs)){
        document.getElementById("error").textContent = "Valor incorrecto";
        return 
    }; 
    const p_proyecto = parseFloat(document.getElementById("p_proyecto").value);
    if(p_proyecto<0 || isNaN(p_proyecto)){
        document.getElementById("error").textContent = "Valor incorrecto";
        return 
    }; 
    
    if((p_controles+p_labs+p_proyecto)>100){
        document.getElementById("error").textContent = "% mayores a 100";
        return 
    };

    Data_Ponderaciones = {"p_controles":p_controles,"p_labs":p_labs,"p_proyecto":p_proyecto};
    localStorage.setItem("Data_Ponderaciones",JSON.stringify(Data_Ponderaciones));
    location.reload()
};

function calcular1(){
    const controles = parseFloat(document.getElementById("controles").value);
    if (controles<1 || controles>7){
        return
    };
    const talleres = parseFloat(document.getElementById("talleres").value);
    if (talleres<1 || talleres>7){
        return
    };
    const proyecto = parseFloat(document.getElementById("proyecto").value);
    if (proyecto<1 || proyecto>7){
        return
    };
    const p_controles = (parseFloat(document.getElementById("p_controles").value))/100; 
    const p_labs = (parseFloat(document.getElementById("p_labs").value))/100;
    const p_proyecto = (parseFloat(document.getElementById("p_proyecto").value))/100;
    const pres = (p_controles+p_labs+p_proyecto).toFixed(2);
    var total = controles*p_controles;
    total += talleres*p_labs;
    total += proyecto*p_proyecto;
    total /= pres;     
    total = (Math.round(total*10))/10;
    if(isNaN(total)){
        return
    }
    document.getElementById("total1").textContent = `Total: ${total}`
};

function calcular2(){
    const presentacion = document.getElementById("presentacion").value;
    if (presentacion<1 || presentacion>7){
        return
    }
    var total = (3.96-(presentacion*0.7))/0.3
    total = (Math.round(total*10))/10;
    if(total>7){
        risa.play();
    }
    document.getElementById("total2").textContent = `Total: ${total}`
};