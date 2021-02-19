var express = require("express");
var bodyparser = require("body-parser");
var flash = require("express-flash");
var session = require("express-session");
var mysql = require("mysql");
var fileupload = require("express-fileupload");
var path = require("path");
var nodemailer=require("nodemailer");


var aplicacion = express();
var coneccion = mysql.createPool({
    connectionLimit: 20,
    user: "root",
    password:  "123123123" ,
    database: "blog_viajes",
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
aplicacion.set("view engine", "ejs");

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

        if (ped.session.usuario_email && ped.session.usuario_contraseña) {
            var usuario_registrado = ped.session.usuario_email;
        }


        coneccion.query(query, function (eror, listas, columnas) {
            res.render("index.ejs", { data: listas, usuario_registrado: usuario_registrado, pagina_siguiente: pagina_siguiente, pagina_anterior: pagina_anterior, pagina_actual: pagina_actual });
            conex.release();
        })
    })

})

aplicacion.get("/detalles", function (ped, res) {

    coneccion.getConnection(function (error, conex) {

        var verificacion_public = ` select *,publicaciones.id as id_publicacion from publicaciones join autores  on publicaciones.autor_id = autores.id  where publicaciones.id= ${ped.query.public_id};`;
        coneccion.query(verificacion_public, function (eror, filas, columnas) {

            if (filas.length > 0) {
                res.render("detalles.ejs", { datos: filas[0], usuario_registrado: ped.session.usuario_email });
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
                
            

            console.log(arreglo)

            res.render("autores.ejs",{datos:arreglo});

        })

        conex.release();
    })
    
    
    
    

})

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


aplicacion.get("/registrarse", function (ped, res) {
    res.render("formulario_registro.ejs", { error: ped.flash('error') });
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
                                ped.flash('correcto', 'Usted se a registrado correctamente');
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


aplicacion.get("/ingresar", function (ped, res) {
    res.render("ingresar.ejs", { error: ped.flash("error") });
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



                    //  Apis 

                    // para obtener publicaciones 
aplicacion.get("/api/v1/publicaciones",function(ped,res){
    if(ped.query.busqueda){
        coneccion.getConnection(function(eror,conex){
            var query=`select * from publicaciones where titulo regexp ${conex.escape(ped.query.busqueda)} or contenido regexp ${conex.escape(ped.query.busqueda)} or resumen regexp ${conex.escape(ped.query.busqueda)} `;
    
        coneccion.query(query,function(error,listas,columnas){
                res.json({data:listas})
            })
            conex.release();
        })
    }
    else if(!ped.query.busqueda){
        coneccion.getConnection(function(eror,conex){
            var query=`select * from publicaciones order by  fecha_hora DESC`;

            coneccion.query(query,function(error,listas,columnas){
                res.json({data:listas})
            })
            conex.release();
        })
    }
})
aplicacion.get("/api/v1/publicaciones/:id",function(ped,res){

    if(ped.params.id){
        coneccion.getConnection(function(eror,conex){
            var query=`select * from publicaciones where id= ${conex.escape(ped.params.id)}`;
    
            coneccion.query(query,function(error,listas,columnas){
                if(listas.length > 0){
                    res.json({data:listas})
                }
                else{
                    res.json("No se encontraron resultados de esa id")

                }

            })
            conex.release();
        })
    }

})
                    // para obtener autores 
aplicacion.get("/api/v1/autores",function(ped,res){
    if(ped.query.busqueda){
        coneccion.getConnection(function(eror,conex){
            var query=`select * from publicaciones  `;
    
        coneccion.query(query,function(error,listas,columnas){
                res.json({data:listas})
            })
            conex.release();
        })
    }
    else if(!ped.query.busqueda){
        coneccion.getConnection(function(eror,conex){
            var query=`select * from autores `;

            coneccion.query(query,function(error,listas,columnas){
                res.json({data:listas})
            })
            conex.release();
        })
    }
})
aplicacion.get("/api/v1/autores/:id",function(ped,res){
    if(ped.params.id){
        coneccion.getConnection(function(eror,conex){
            var query=`select email,contrasena,pseudonimo,avatar,titulo,resumen,contenido,foto,votos,fecha_hora,autor_id,
            publicaciones.id as Publicacion_id 
            from autores join publicaciones on autores.id=publicaciones.autor_id where autores.id= ${conex.escape(ped.params.id)}`;
    
            coneccion.query(query,function(error,listas,columnas){

                if(listas.length > 0){
                    res.json({data:listas})
                }
                else{
                    res.json("No se encontraron resultados de esa id")

                }

            })
            conex.release();
        })
    }
})




                // para crear autores 
aplicacion.post("/api/v1/autores",function(ped,res){
    
    coneccion.getConnection(function (error, conex) {

        var query_nombre = `select * from autores where pseudonimo=${conex.escape(ped.body.pseudonimo)}`;
        
        coneccion.query(query_nombre,function(eror,listas,columnas){

            if(listas.length > 0){
                res.send("Este nombre ya esta registrado")
            
            }
            else{
                var query = `select * from autores where email = ${conex.escape(ped.body.email)} and contrasena=${conex.escape(ped.body.contrasena)}`;
                coneccion.query(query,function(eror,listas,columnas){
        
                    if(listas.length > 0){
                        res.send("Este gmail ya esta registrado")
                    }
                    else{
                        var query=`insert into autores(pseudonimo,email,contrasena)values(${conex.escape(ped.body.pseudonimo)},${conex.escape(ped.body.email)},${conex.escape(ped.body.contrasena)} )`;
                        coneccion.query(query,function(eror,listas,columnas){
                            res.json({data:["Se ah registrado correctamente",{pseudonimo:ped.body.pseudonimo},{email:ped.body.email},{contrasena:ped.body.contrasena}]})
        
                        })
                    }
                })


            }

        })




    conex.release();






    })


})
                // para añadir publicaciones
aplicacion.post("/api/v1/publicaciones",function(ped,res){

    var email=ped.body.email;
    var contrasena=ped.body.contrasena;
    var titulo=ped.body.titulo;
    var contenido=ped.body.contenido;
    var resumen=ped.body.resumen;

    var fecha = new Date();
    var año = fecha.getFullYear();
    var mes = fecha.getMonth() + 1;
    var dia = fecha.getDate();
    var hora = fecha.getHours();
    var minutos = fecha.getMinutes();
    var segundos = fecha.getSeconds()
    var tiempo = (año + "-" + mes + "-" + dia + " " + hora + ":" + minutos + ":" + segundos);

    coneccion.getConnection(function(eror,conex){
        var verificacion_query=`select * from autores where email=${conex.escape(email)} and contrasena=${conex.escape(contrasena)}`;

            coneccion.query(verificacion_query,function(eror,listas,columnas){
                
                if(listas.lenght< 0){
                    res.json({error:"No se encontro ese usuario"})
                }
                else{
                    var id_usuario=listas[0].id;
                    var query=`insert into publicaciones(titulo,resumen,contenido,fecha_hora,autor_id) values(${conex.escape(titulo)},${conex.escape(contenido)},${conex.escape(resumen)},${conex.escape(tiempo)},${conex.escape(id_usuario)})`
                    console.log(query)
                    coneccion.query(query ,function(eror,listas,columnas){
                        res.json({estado:"Perfecto"})

                    })
                }

            })
        conex.escape();
    })



})

                //para borrar publicaciones
aplicacion.delete("/api/v1/publicaciones",function(ped,res){

    var email=ped.body.email;
    var contrasena=ped.body.contrasena;
    var publicacion_id=ped.body.publicacion_id;


    coneccion.getConnection(function(eror,conex){
        var verificacion_query=`select * from autores where email=${conex.escape(email)} and contrasena=${conex.escape(contrasena)}`;

            coneccion.query(verificacion_query,function(eror,listas,columnas){
                
                if(listas.lenght< 0){
                    res.json({error:"No se encontro ese usuario"})
                }
                else{
                    var id_usuario=listas[0].id;
                    var query=`delete from publicaciones where id=${conex.escape(publicacion_id)} and autor_id = ${conex.escape(id_usuario)}`;
                    coneccion.query(query,function(eror,listas,columnas){
                        res.json({estado:"Finalizado"})

                    })
                }

            })
        conex.escape();
    })



})



aplicacion.listen(8080, function () {
    console.log("Servidor Iniciado");
})
