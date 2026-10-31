// Compatibilidad con versión previa de gestión de ramos
function viajar(r){
  sessionStorage.setItem("nombre", r);
  window.location.href = "CalculadoraFinis.html#detalle";
}
