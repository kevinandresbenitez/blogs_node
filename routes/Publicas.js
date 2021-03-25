var express = require("express");
var bodyparser = require("body-parser");
var flash = require("express-flash");
var session = require("express-session");
var mysql = require("mysql");
var fileupload = require("express-fileupload");
var path = require("path");
var nodemailer=require("nodemailer");

var aplicacion = express.Router();



var coneccion = mysql.createPool({
    connectionLimit: 20,
    user: "root",
    password:  "Root_contraseña(123)" ,
    database: "prueba",
    host: "localhost"
})
var transport=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"Cuenta_de_prueba32@gmail.com",
        pass:"123prueba123"

    }

})
function enviar_correo(email){
    var opciones={
        from:"Cuenta_de_prueba32@gmail.com",
        to:email,
        subject:"Pero hola",
        text:"hola"
    }

    transport.sendMail(opciones,function(eror,info){})
}

aplicacion.use(express.static("public"));

aplicacion.use(flash());
aplicacion.use(session({ secret: "Secreto", saveUninitialized: true, resave: true }));

aplicacion.use(bodyparser.json());
aplicacion.use(bodyparser.urlencoded({ extended: true }));

aplicacion.use(fileupload());




aplicacion.get("/", function (ped, res) {
    var pagina = 0;
    coneccion.getConnection(function (error, conex) {

        if (!ped.query.pagina) {
            pagina = 0
            var pagina_siguiente = 1;
            var pagina_anterior = 0;
            var pagina_actual = 0;
        }
        else {
            var pagina_siguiente = parseInt(ped.query.pagina) + 1;
            var pagina_anterior = parseInt(ped.query.pagina) - 1;
            var pagina_actual = parseInt(ped.query.pagina);

            pagina = pagina_actual * 5;
        }

        if (!ped.query.buscar) {
            var query = `select pseudonimo,avatar,fecha_hora,resumen,titulo,votos,publicaciones.id from autores  join publicaciones on autores.id =publicaciones. autor_id order by fecha_hora DESC limit 5 OFFSET ${conex.escape(pagina)};`
        }
        else {
            var query = `select pseudonimo,avatar,fecha_hora,resumen,titulo,votos,contenido,publicaciones.id from autores  join publicaciones on autores.id =publicaciones. autor_id
        where titulo regexp '${ped.query.buscar}' or pseudonimo regexp '${ped.query.buscar}' or resumen regexp '${ped.query.buscar}' or contenido regexp '${ped.query.buscar}'  ;  `

        }




        coneccion.query(query, function (eror, listas, columnas) {
            res.render("index.ejs", { datos: listas, usuario: ped.session.usuario, pagina_siguiente: pagina_siguiente, pagina_anterior: pagina_anterior, pagina_actual: pagina_actual });
            conex.release();
        })
    })

})
aplicacion.get("/detalles", function (ped, res) {

    coneccion.getConnection(function (error, conex) {

        var verificacion_public = ` select *,publicaciones.id as id_publicacion from publicaciones join autores  on publicaciones.autor_id = autores.id  where publicaciones.id= ${ped.query.public_id};`;
        coneccion.query(verificacion_public, function (eror, filas, columnas) {

            if (filas && filas.length > 0) {
                res.render("detalles.ejs", { datos: filas[0], usuario: ped.session.usuario });
            }
            else {
                res.redirect("/")

            }
        })

        conex.release();
    })




})
aplicacion.get("/autores" ,function(ped,res){

    coneccion.getConnection(function (error, conex) {
        var query = `select  *,publicaciones.id as id_publicacion from publicaciones right join autores on publicaciones.autor_id=autores.id order by pseudonimo`

        coneccion.query(query, function (eror, lista, columnas) {

            var arreglo =[];
            let tarea_actual={
                pseudonimo:undefined
            }

            for(var i=0; lista.length > i ;i++){

            if(tarea_actual.pseudonimo != lista[i].pseudonimo){
            tarea_actual={

                pseudonimo:lista[i].pseudonimo,
                titulo:[lista[i].titulo],
                avatar:lista[i].avatar,
                id:[lista[i].id_publicacion]
            }

            arreglo.push(tarea_actual);
            }
                else{ tarea_actual.titulo.push(lista[i].titulo)
                    tarea_actual.id.push(lista[i].id_publicacion) }
            }




            res.render("autores.ejs",{datos:arreglo,usuario: ped.session.usuario});

        })

        conex.release();
    })





})



aplicacion.get("/ingresar", function (ped, res) {
    res.render("ingresar.ejs", { error: ped.flash("error"),usuario: ped.session.usuario  });
})


aplicacion.get("/registrarse", function (ped, res) {
    res.render("formulario_registro.ejs", { error: ped.flash('error'),usuario: ped.session.usuario });
})
aplicacion.post("/procesar_registro", function (ped, res) {

    coneccion.getConnection(function (error, conex) {
        var nombre = ped.body.nombre.trim();
        var email = ped.body.email.toLowerCase().trim();
        var contraseña = ped.body.contraseña;

        var query_nombre = `select * from autores where pseudonimo = ${conex.escape(nombre)}`;
        var query_gmail = `select * from autores where email = ${conex.escape(email)}`;

        coneccion.query(query_nombre, function (eror, filas, columnas) {

            if (filas.length > 0) {
                ped.flash('error', 'Este Nombre esta duplicado');
                res.redirect("/registrarse");
            }
            else {
                coneccion.query(query_gmail, function (eror, filas, columnas) {
                    if (filas.length > 0) {
                        ped.flash('error', 'Este Gmail esta duplicado');
                        res.redirect("/registrarse");
                    }
                    else {
                            var query = `insert into autores(pseudonimo,email,contrasena) values(${conex.escape(nombre)},${conex.escape(email)},${conex.escape(contraseña)})`
                            coneccion.query(query, function (eror, filas, columnas){


                                if(ped.files && ped.files.avatar){

                                    var archivo_avatar = ped.files.avatar ;
                                    var id= filas.insertId;
                                        if(path.extname(archivo_avatar.name) == ".exe"){
                                            var nombre_de_avatar =`${id}.png`
                                        }else{
                                            var nombre_de_avatar =`${id}${path.extname(archivo_avatar.name)}`
                                        }


                                    archivo_avatar.mv(`./public/avatars/${nombre_de_avatar}`,(error)=>{
                                        var query=`update autores set avatar=${conex.escape(nombre_de_avatar)} where id=${conex.escape(id)}`
                                        coneccion.query(query,function(eror,listas,columnas){
                                        })

                                    })
                                }
                                enviar_correo(email);
                                ped.session.usuario_email = email;
                                ped.session.usuario_contraseña = contraseña;
                                res.redirect("/redireccionar_index");


                            })

                        }
                })
            }
        })
        conex.release();
    })
})

aplicacion.get("/redireccionar_index", function (ped, res) {
    coneccion.getConnection(function (error, conex) {
        var email = ped.session.usuario_email;
        var contraseña = ped.session.usuario_contraseña;

        var query = `select * from autores where email = ${conex.escape(email)} and contrasena = ${conex.escape(contraseña)}  `;

        coneccion.query(query, function (eror, filas, columnas) {
            ped.session.usuario=filas[0];
            ped.flash('correcto', 'Usted se a registrado correctamente');
            res.redirect('/admin/index');
        })


        conex.release();
    })
})



module.exports =aplicacion;
