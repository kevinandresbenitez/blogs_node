var express = require("express");
var bodyparser = require("body-parser");
var flash = require("express-flash");
var session = require("express-session");
var mysql = require("mysql");






var aplicacion = express.Router();

var coneccion = mysql.createPool({
    connectionLimit: 20,
    user: "root",
    password:  "Root_contraseña(123)" ,
    database: "prueba",
    host: "localhost"
})


aplicacion.use(express.static("public"));

aplicacion.use(flash());
aplicacion.use(session({ secret: "Secreto", saveUninitialized: true, resave: true }));

aplicacion.use(bodyparser.json());
aplicacion.use(bodyparser.urlencoded({ extended: true }));




aplicacion.get("/votar_publicacion" , function(ped,res){
    
    if (!ped.session.usuario_email && !ped.session.usuario_contraseña) {
    res.redirect("/ingresar");
    }
    else {
            coneccion.getConnection(function (error, conex) {
            var query = `select * from publicaciones where id=${conex.escape(ped.query.id)} and autor_id = ${conex.escape(ped.session.usuario_id)};`
            coneccion.query(query, function (eror, listas, columnas) {

                    if (listas.length < 0) {
                        res.redirect(`/`);
                    }
                
            })
                
                
            
                var query=`update publicaciones set votos = votos+1 where id=${conex.escape(ped.query.id)}`
                coneccion.query(query,function(eror,listas,columnas){
                res.redirect(`/detalles?public_id=${ped.query.id}`);
                })   
             
                
                
                
                    

                
            
                conex.release();
            })


        }
    
    
})

aplicacion.get("/redireccionar_index", function (ped, res) {
    coneccion.getConnection(function (error, conex) {
        var email = ped.session.usuario_email;
        var contraseña = ped.session.usuario_contraseña

        var query = `select * from autores where email = ${conex.escape(email)} and contrasena = ${conex.escape(contraseña)}  `;

        coneccion.query(query, function (eror, filas, columnas) {
            ped.session.usuario_email = filas[0].email;
            ped.session.usuario_contraseña = filas[0].contrasena;
            ped.session.usuario_id = filas[0].id;
            res.redirect("/admin/index");
        })

        conex.release();
    })
})

aplicacion.post("/procesar_ingreso", function (ped, res) {

    coneccion.getConnection(function (error, conex) {
        var email = ped.body.email.toLowerCase().trim();
        var contraseña = ped.body.contraseña;

        var query = `select * from autores where email = ${conex.escape(email)} and contrasena = ${conex.escape(contraseña)}  `;


        coneccion.query(query, function (eror, filas, columnas) {

            if (filas.length > 0) {
                ped.session.usuario_email = filas[0].email;
                ped.session.usuario_contraseña = filas[0].contrasena;
                ped.session.usuario_id = filas[0].id;

                res.redirect("/admin/index");
            }
            else {
                ped.flash("error", "Contraseña u correo es incorrecto");
                res.redirect("/ingresar")
            }

        })
        conex.release();
    })
})

aplicacion.get("/admin/index", function (ped, res) {
    if (!ped.session.usuario_email && !ped.session.usuario_contraseña) {
        res.redirect("/ingresar");
    }
    else {
        coneccion.getConnection(function (eror, conex) {
            var query = `select titulo,resumen,contenido,foto,votos,fecha_hora,email,contrasena,pseudonimo,avatar,publicaciones.id from publicaciones right join autores on publicaciones.autor_id=autores.id where email = ${conex.escape(ped.session.usuario_email)} and contrasena = ${conex.escape(ped.session.usuario_contraseña)};`
            coneccion.query(query, function (error, lista, columnas) {
                res.render("admin/admin_index.ejs", { ingreso_registro: ped.flash("correcto"), datos: lista });
            })
            conex.release()
        })
    }
})
aplicacion.get("/cerrar_seccion", function (ped, res) {
    ped.session.destroy();
    res.redirect("/");

})

aplicacion.get("/agregar", function (ped, res) {
    if (!ped.session.usuario_email && !ped.session.usuario_contraseña) {
        res.redirect("/ingresar");
    }
    else {
        res.render("admin/agregar.ejs");
    }
})
aplicacion.post("/procesar_agregar", function (ped, res) {
    if (!ped.session.usuario_email && !ped.session.usuario_contraseña) {
        res.redirect("/ingresar");
    }
    else {
        var titulo = ped.body.titulo;
        var resumen = ped.body.resumen;
        var contenido = ped.body.contenido;
        var votos = 0;
        var id_usuario = ped.session.usuario_id;

        var fecha = new Date();
        var año = fecha.getFullYear();
        var mes = fecha.getMonth() + 1;
        var dia = fecha.getDate();
        var hora = fecha.getHours();
        var minutos = fecha.getMinutes();
        var segundos = fecha.getSeconds()
        var tiempo = (año + "-" + mes + "-" + dia + " " + hora + ":" + minutos + ":" + segundos);

        coneccion.getConnection(function (error, conex) {
            var query = `insert into publicaciones(titulo,resumen,contenido,votos,fecha_hora,autor_id) values(${conex.escape(titulo)},${conex.escape(resumen)},${conex.escape(contenido)},${votos},${conex.escape(tiempo)},${id_usuario});`

            coneccion.query(query, function (eror, lista, columnas) {

                res.redirect("/admin/index");

            })

            conex.release();
        })

    }

});

aplicacion.get("/eliminar_public", function (ped, res) {

    if (!ped.session.usuario_email && !ped.session.usuario_contraseña) {
        res.redirect("/ingresar");
    }
    else {

        coneccion.getConnection(function (erro, conex) {
            var query = `delete from publicaciones where id=${conex.escape(ped.query.id_publ)} and autor_id = ${conex.escape(ped.session.usuario_id)} ; `;


            coneccion.query(query, function (eror, listas, columnas) {
                res.redirect("/admin/index");
            })
            conex.release;
        })
    }
})
aplicacion.get("/editar_publ", function (ped, res) {

    if (!ped.session.usuario_email && !ped.session.usuario_contraseña) {
        res.redirect("/ingresar");
    }
    else {

        coneccion.getConnection(function (error, conex) {
            var query = `select * from publicaciones where id=${conex.escape(ped.query.id_publ)} and autor_id = ${conex.escape(ped.session.usuario_id)};`
            coneccion.query(query, function (eror, listas, columnas) {

                if (listas.length > 0) {
                    res.render("admin/editar_public.ejs", { publicacion_id: ped.query.id_publ, titulo: listas[0].titulo, resumen: listas[0].resumen, contenido: listas[0].contenido })

                }
                else {
                    res.redirect("/ingresar");

                }


            })

            conex.release();
        })

    }
})
aplicacion.post("/procesar_editar", function (ped, res) {

    if (!ped.session.usuario_email && !ped.session.usuario_contraseña) {
        res.redirect("/ingresar");
    }
    else {
        var titulo = ped.body.titulo;
        var resumen = ped.body.resumen;
        var contenido = ped.body.contenido;
        var id_publicacion = ped.body.id;


        coneccion.getConnection(function (error, conex) {
            var query = `update publicaciones set titulo=${conex.escape(titulo)},resumen=${conex.escape(resumen)},contenido=${conex.escape(contenido)} where id=${conex.escape(id_publicacion)} and autor_id = ${conex.escape(ped.session.usuario_id)};`

            coneccion.query(query, function (eror, lista, columnas) {
                res.redirect("/admin/index");

            })

            conex.release();
        })

    }

});



module.exports =aplicacion;

