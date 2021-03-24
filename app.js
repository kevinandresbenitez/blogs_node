var express = require("express");


var Apis=require('./routes/Appi')
var Publicas=require('./routes/Publicas')
var Privadas=require('./routes/Privadas')



var aplicacion = express();


aplicacion.use(Apis);
aplicacion.use(Publicas);
aplicacion.use(Privadas);




aplicacion.listen(8081, function () {
    console.log("Servidor Iniciado en el servidor 8081");
})
