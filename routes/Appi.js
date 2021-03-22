var express =require('express');
var mysql = require("mysql");

var aplicacion =express.Router()


var coneccion = mysql.createPool({
    connectionLimit: 20,
    user: "root",
    password:  "Root_contraseña(123)" ,
    database: "prueba",
    host: "localhost"
})


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


module.exports =aplicacion;