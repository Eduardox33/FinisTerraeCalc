// ELEMENTOS
const CalcP = document.getElementById("CalcP");
let Rpromedio = document.getElementById("Rpromedio");
CalcP.addEventListener("click",promedios);

// CALCULO

function promedios(){
    let Notas = document.getElementById("Notas").value;
    Notas = Notas.split([","]);
    let Result4 = 0;
    console.log(Notas)
    for (let nota = 0; nota < Notas.length; nota++){
        if(parseFloat(Notas[nota]) > 7 || parseFloat(Notas[nota]) <1){
            Rpromedio.textContent = "Resultado: Error de Datos";
            return;
        } else{
            Result4 = Result4 + parseFloat(Notas[nota]);
            console.log(Result4)
        }
    };
    Result4 = Result4/(Notas.length);
    Result4 = (Math.round(Result4*10))/10;
    Rpromedio.textContent = `Resultado: ${Result4}`
};
