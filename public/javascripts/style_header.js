var contador =1;
var elemento= document.getElementById("container_header_2");

function cambiar(){

    if(contador == 1){
        elemento.style.animation="animacion_header_2 1s"
        elemento.style.left="0%"

        
        contador=0;
    }
    else if(contador==0){
        elemento.style.animation="animacion_header_1 1s"
        elemento.style.left="-100%"

        contador=1;
    } 

}
