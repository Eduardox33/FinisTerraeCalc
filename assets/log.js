const inputElements = document.querySelectorAll('input');
inputElements.forEach((input)=>{input.tabIndex = -1;});

function blurAll(){
    var inputs = document.querySelectorAll('input');
    inputs.forEach(function(input){input.blur();});
}

const update=localStorage.getItem("3") || -1;
if(update===-1){
    localStorage.clear();
    alert("Bienvenido a la nueva versión de la calculadora:\nActualizaciones a tiempo real y manejo dinámico de Ramos agregadas.\nFASE BETA");
    localStorage.setItem("3","updated");
}

function goTo(place){
    setTimeout(()=>{
        window.location.href=place;
    },200);
}