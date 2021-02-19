var gmail=/[a-z]+[@gmail.com]/;

function verificar(formulario){

    if(formulario.nombre.value.trim().length < 7 ){
        alert("El Nombre de Usuario tiene que ser mayor a 7 digitos");
        return false
    }

    if(!gmail.test(formulario.email.value) ){
        alert("El gmail tiene un formato invalido");
        return false
    }
    if(formulario.contraseña.value.trim().length < 7 ){
        alert("La contraseña tiene que tener mas de 7 digitos");
        return false
    }
    if(formulario.contraseña.value != formulario.contraseña_verifi.value ){
        alert("La Verificacion es incorrecta");
        return false
    }


return true
}