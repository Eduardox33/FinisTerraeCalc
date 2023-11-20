// BOTONES

const Calculo1 = document.getElementById("Calcular1");
const Calculo2 = document.getElementById("Calcular2");
const Calculo3 = document.getElementById("Calcular3");

// RESULTADOS

let Result1 = document.getElementById("Resultado1");
let Result2 = document.getElementById("Resultado2");
let Result3 = document.getElementById("Resultado3");
// AUDIO

var risa = new Audio("assets/audio.wav");

// CODIGO

Calculo1.addEventListener("click",function(){
    let Control1 = parseFloat(document.getElementById("Control1").value);
    let Lab1 = parseFloat(document.getElementById("Lab1").value);
    let Project1 = parseFloat(document.getElementById("Proyecto1").value);

    if(Control1>7 || Control1<1){
        return
    };
    if(Lab1>7 || Lab1<1){
        return
    };
    if(Project1>7 || Project1<1){
        return
    };

    let RES = (((Control1*0.36)+(Lab1*0.14)+(Project1*0.2))/0.7);
    RES = Math.round(RES*10)/10;
    if(isNaN(RES)){
        return
    }else{
        Result1.textContent= `Resultado: ${RES}`
    };
});

Calculo2.addEventListener("click",function(){
    let Presentacion1 = parseFloat(document.getElementById("Presentacion1").value);
    if(Presentacion1>7 || Presentacion1<1){
        return
    };

    let RES = ((3.96-(Presentacion1*0.7))/0.3);
    RES = Math.round(RES*10)/10;
    if(isNaN(RES)){
        return
    }else if(RES>7){
        Result2.textContent= `Resultado: ${RES} Reprobado`;
        risa.play();
    }else{
        Result2.textContent= `Resultado: ${RES}`
    };  
});

Calculo3.addEventListener("click",function(){
    let Control2 = document.getElementById("Control2").value;
    let Lab2 = document.getElementById("Lab2").value;

    if(Control2>7 || Control2<1){
        return
    };
    if(Lab2>7 || Lab2<1){
        return
    };

    let RES = (((4.96*0.7)-((Control2*0.36)+(Lab2*0.14)))/0.2);
    RES = Math.round(RES*10)/10;
    if(isNaN(RES)){
        return
    }else{
        Result3.textContent= `Resultado: ${RES}`
    };  
});