const express = require('express');
const morgan=require('morgan');
const axios=require('axios');
var cors = require('cors');
const fs = require('fs')
const { Client } = require('pg');
const cheerio = require('cheerio');
const APIurl=" https://desarrolloktm.curbe.com.ec/api/"
const winston = require("winston");
const logger = winston.createLogger({    
    level: "info",    
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),    
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: "src/logs/app.log" }),
    ],
  });
const Reconnect = require('reconnect-core');

let client;

// const dbConfig = {
//     user: process.env["User"],
//     host: process.env["Host"],
//     database: process.env["DB"],
//     password: process.env["Paswd"],
//     port: 5432,
//     ssl: {
//         rejectUnauthorized: false
//     }
// };

const dbConfig = {
    user: "postgres",
    host: "database-1.c0oqa864nwep.us-west-2.rds.amazonaws.com",
    database: "KTM",
    password: "P05Tclave",
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
};


async function connectDB(){
    if(client==undefined){
        client= new Client(dbConfig);
        try {
            await client.connect();
            logger.log("info", "Conexion creada DB");
            return {status:"OK",data:"Creada la conexion a BD"}
        } catch (error) {
            logger.log("info","error en conexion db")
            logger.log("error", error);
            return {status:"Error",data:error}
        }
    }
    client.on('end', async (err, cli) => {
            logger.log("error",'DATABASE CONNECTION ENDED. RETRYING IN 2 SECONDS...');
            setTimeout(connect_stuff, 2000);
            client= new Client(dbConfig);
            try {
                await client.connect();
                return {status:"OK",data:"Creada la conexion a BD"}
            } catch (error) {
                logger.log("info","error en reconexion db")
                logger.log("error", error);
                return {status:"Error",data:error}
            }
    })
    return {status:"OK",data:"Creada la conexion a BD"}
}

async function createUserCellOnly(cell_number,comp_cell_number) {    
    try {
      const queryText = 'INSERT INTO usuario (usu_celular,usu_emp_id) VALUES ($1,$2) RETURNING usu_id';
      const values = [cell_number,comp_cell_number];
      let response=await client.query(queryText, values);
      logger.log("info", "Nuevo usuario creado");      
      return {status:"OK",data:response.rows[0].usu_id}
    } catch (error) {        
        logger.log("info","error en confirmar usuario")
        logger.log("error", error)
        return {status:"Error",data:error}
    }
}

async function modifyUserbyCell(usu_lst_nm,usu_city,usu_mail,usu_id,usu_name,usu_opt_id,usu_term_acept,usu_state,usu_cell,usu_emp_id){    
    try {        
        const uploadFields = {
            usu_nombre: usu_name,
            usu_apellido: usu_lst_nm,
            usu_ciudad:usu_city,
            usu_correo:usu_mail,
            usu_identificador:usu_id,
            usu_opcion_identificador:usu_opt_id,
            usu_term_acept:usu_term_acept,
            usu_estado_civil:usu_state
        };
        const sets = [];
        const values= []
        for (const field in uploadFields) {
            sets.push(`${field} = $${sets.length + 1}`);
            values.push(uploadFields[field])
        }
        const query = `
            UPDATE usuario 
            SET ${sets.join(', ')}
            WHERE usu_celular='`+usu_cell+`' and usu_emp_id='`+usu_emp_id+`'
            RETURNING *;
        `;        
        const result = await client.query(query,values);
        if (result.rowCount>0) {            
            logger.log("info", "Modificacion de usuario");            
            return {status:"OK",data:result.rows[0].usu_id}
        } else {            
            logger.log("info", "Ningun usuario modificado");
            logger.log("info", query);
            return {status:"Error",data:"Ningún registro fue actualizado."}
        }
    } catch (error) {
        console.log(error)
        console.log("error en modificar usuario conversacion")
        logger.log("error", error);
        return {status:"Error",data:error}
    }
}

async function modifyConversationbyID(conv_id,conv_princ_menu,conv_branch,conv_product,conv_type_refill,conv_mot_year,conv_mot_type,conv_city,conv_mutable,conv_time,conv_buy_method,conv_cellphone){
    try {        
        const uploadFields = {            
            conv_princ_menu_opc:conv_princ_menu,
            conv_sucursal:conv_branch,
            conv_moto:conv_product,
            conv_tipo_repuesto:conv_type_refill,
            conv_moto_anio:conv_mot_year,
            conv_celular:conv_cellphone,
            conv_tipo_moto:conv_mot_type,
            conv_ciudad:conv_city,
            conv_mutable:conv_mutable,
            conv_tiempo_compra:conv_time,
            conv_metodo_pago:conv_buy_method
        };
        const sets = [];
        const values= []
        for (const field in uploadFields) {
            sets.push(`${field} = $${sets.length + 1}`);
            values.push(uploadFields[field])
        }
        const query = `
            UPDATE conversacion 
            SET ${sets.join(', ')}
            WHERE conv_id =`+conv_id+`
            RETURNING *;
        `;        
        const result = await client.query(query,values);
        if (result.rowCount>0) {            
            logger.log("info", "Conversacion modificada");            
            return {status:"OK",data:result.rows[0].usu_id}
        } else {            
            logger.log("info", "Ninguna conversacion confirmada");
            logger.log("info", query);
            return {status:"Error",data:"Ningún registro fue actualizado."}
        }
    } catch (error) {
        logger.log("error", error);
        console.log("error en modificar conversacion")
        return {status:"Error",data:error}
    }
}

async function createConversation(user_id) {    
    try {      
      const now= new Date()
      const queryText = 'INSERT INTO conversacion (conv_usuario,conv_fecha) VALUES ($1,$2) RETURNING conv_id';
      const values = [user_id,now];
      let response=await client.query(queryText, values);
      logger.log("info", "Ninguna conversacion confirmada");      
      return {status:"OK",data:response.rows[0].conv_id}
    } catch (error) {
      logger.log("error", error);
      console.log("error en crear conversacion")
      return {status:"Error",data:error}
    }
}

async function finishConversation(conv_id){    
    try {        
        const uploadFields = {            
            conv_finalizada:true
        };
        const sets = [];
        const values= []
        for (const field in uploadFields) {
            sets.push(`${field} = $${sets.length + 1}`);
            values.push(uploadFields[field])
        }
        const query = `
            UPDATE conversacion 
            SET ${sets.join(', ')}
            WHERE conv_id =`+conv_id+`
            RETURNING conv_id;
        `;        
        const result = await client.query(query,values);
        if (result.rowCount>0) {
            logger.log("info", "Conversacion finalizada");            
            return {status:"OK",data:result.rows[0].usu_id}
        } else {            
            logger.log("info", "Ningun conversacion finalizada");
            logger.log("info", query);
            return {status:"Error",data:"Ningún registro fue actualizado."}
        }
    } catch (error) {
        logger.log("error", error);
        console.log("error en finalizar conversacion")
        return {status:"Error",data:error}
    }
}

async function confirmConversation(conv_id){    
    try {        
        const uploadFields = {            
            conv_confirm:true
        };
        const sets = [];
        const values= []
        for (const field in uploadFields) {
            sets.push(`${field} = $${sets.length + 1}`);
            values.push(uploadFields[field])
        }
        const query = `
            UPDATE conversacion 
            SET ${sets.join(', ')}
            WHERE conv_id =`+conv_id+`
            RETURNING conv_id;
        `;        
        const result = await client.query(query,values);
        if (result.rowCount>0) {            
            logger.log("info", "Conversacion confirmada");            
            return {status:"OK",data:result.rows[0].usu_id}
        } else {            
            logger.log("info", "Ninguna conversacion confirmada");
            logger.log("info", "query");
            return {status:"Error",data:"Ningún registro fue actualizado."}
        }
    } catch (error) {
        console.log("error en confirmar conversacion")
        logger.log("error", error);
        return {status:"Error",data:error}
    }
}

async function consultCompanybynumber(number){    
    try {        
        const queryText = 'SELECT * FROM empresa WHERE emp_celular=$1';
        const values = [number];
        var response=await client.query(queryText, values);
        if(response.rowCount==1){
            logger.log("info", "Empresa consultada");            
            return {status:"Unique",data:response.rows[0]}
        }else{
            if(response.rowCount==0){
                logger.log("info", "Ninguna empesa consultada");                
                return {status:"None",data:"Ningun registro"}
            }else{
                logger.log("info", "Multiples Empresas consultadas");
                return {status:"Multiple",data:"Mas de un registro por celular"}
            }            
        }        
      } catch (error) {
        console.log("error en consulta compañia")
        logger.log("error",error);
        console.log(error)
        return {status:"Error",data:error}
      } 

}

async function consultUserbyCellphone(number,compNumber){        
    try {        
        const queryText = 'SELECT * FROM usuario WHERE usu_celular=$1 and usu_emp_id=$2';
        const values = [number,compNumber];
        let response=await client.query(queryText, values);
        if(response.rowCount==1){
            logger.log("info", "Consultado un usuario");            
            return {status:"Unique",data:response.rows[0]}
        }else{
            if(response.rowCount==0){
                logger.log("info", "Ningun usuario consultado");
                return {status:"None",data:"Ningun registro"}
            }else{
                logger.log("info", "Multiples usuario consultado");
                return {status:"Multiple",data:"Mas de un registro por celular"}
            }            
        }        
      } catch (error) {
        console.log("error en consulta usuario")
        console.log(error)
        logger.log("error", error);
        return {status:"Error",data:error}
      }

}

async function consultConvesationbyUser(user){    
    try {          
        const queryText = 'SELECT * FROM conversacion WHERE conv_usuario=$1 and conv_finalizada=false';
        const values = [user];
        let response=await client.query(queryText, values);
        if(response.rowCount==1){
            logger.log("info", "Conversacion consultada");
            console.log(response.rows[0])
            return {status:"Unique",data:response.rows[0]}
        }else{
            if(response.rowCount==0){
                logger.log("info", "Ninguna conversacion consultada");
                return {status:"None",data:"Ningun registro"}
            }else{
                logger.log("info", "Multiples conversaciones");
                return {status:"Multiple",data:"Mas de un registro por usuario"}
            }            
        }
      } catch (error) {
        console.log("error en consulta conversacion")
        console.log(error)
        logger.log("error", error);
        return {status:"Error",data:error}
      }

}

const regexName= /^[A-Za-z]{3,}(\s[A-Za-z]{3,})?$/
const regexNumber= /^[0-9]{1}/
const regexNumbers= /^[0-9]{1,2}/
const regexAnio= /[0-9]{4}/
const regexOnlyName= /^[A-Za-z]+/
const regexMail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const regexCedCol= /^[Ee]\d{6,10}$/
const regexCedEc= /^[0-9]{10}$/
const regexPasCol= /^[A-Z]{3}\d{6}$/
const regexPasEc= /^[A-Z]{3}\d{6}$/
const regexCellphone = /[0-9]{10}/;

const app = express();
app.set('port', process.env.PORT || 8585);
app.set('json spaces', 2)
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

function listOptions(array){    
    let list="\n"
    for(let i=0;i<array.length;i++){
        list+=(i+1).toString()
        list+=" "
        list+=array[i].toString()
        list+="\n"
    }    
    return list
}

async function getToken(){
    var res= await axios.post(APIurl+"auth/login",{
        "lgn_userName": "api_fbt_ktmec",
        "lgn_password": "11botKtm2023",
        "lgn_dominio": "desarrolloktm"
    })
    .then(function (response) {
        return response.data.token
    })
    .catch(function(error){
        logger.log("error", "Error al logearse");
        logger.log("error", error);
        return "Error al logearse "+error
    })
    return res
}

async function consultCities(token){
    var res= await axios.get(APIurl+"leads/ciudades",{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        logger.log("error", "Error al consultar ciudad");
        logger.log("error", error);
        return "Error al consultar ciudades "+error
    })
    return res
}

async function consultAgencies(city,token){    
    var res= await axios.get(APIurl+"leads/concesionarios?cod_ciudad="+city,{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        logger.log("error", "Error al consultar agencias");
        logger.log("error", error);
        return "Error al consultar agencias de ciudad"+error
    })
    return res
}

async function consultTypeVehicule(token){
    var res= await axios.get(APIurl+"shared/getCategoriesByBrand/700",{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        logger.log("error", "Error al consultar tipo de vehiculos");
        logger.log("error", error);
        return "Error al consultar tipo de vehiculos "+error
    })
    return res
}

async function consultModels(vehicule,token){    
    var res= await axios.get(APIurl+"shared/getModelsByCategory/"+vehicule,{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        logger.log("error", "Error al consultar modelos");
        logger.log("error", error);
        return "Error al consultar modelos "+error
    })
    return res
}

async function consultBuyTimes(token){
    var res= await axios.get(APIurl+"leads/surveys",{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        logger.log("error", "Error al consultar tiempos de compra");
        logger.log("error", error);
        return "Error al consultar tiempos de compras "+error
    })
    return res
}

async function APIsendmail(token,obj){
    var res= await axios.post(APIurl+"mail/sendmail",obj,{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        logger.log("error", "Error al enviar email");
        logger.log("error", error);
        return "Error enviar mail "+error
    })
    return res
}

async function saveNewLead(user,conv,token){    
    consult= await consultBuyTimes(token)            
    let optionName=consult.filter((object)=>object.lsp_codigo==9)
    optionName=optionName.map((object)=>object.options)    
    let nombre =optionName[0].filter((object)=>object.id==conv.data.conv_tiempo_compra)
    let send={
        origen:"fcb",
        plataforma: "whatsapp bot",        
        cod_tipo_documento:user.data.usu_opcion_identificador==true?1:2,
        identificacion:user.data.usu_identificador,
        nombres:user.data.usu_apellido==null?user.data.usu_nombre:user.data.usu_nombre+" "+user.data.usu_apellido,
        telefono:user.data.usu_celular,
        email:user.data.usu_correo,
        acepta:user.data.usu_term_acept==true?"SI":"NO",
        cod_ciudad:user.data.usu_ciudad,        
        cod_categoria_lead:conv.data.conv_tipo_moto,
        cod_modelo:conv.data.conv_moto,
        estado_civil:user.data.usu_estado_civil,
        anio_motocicleta:conv.data.conv_moto_anio,
        ciudad_cliente:conv.data.conv_ciudad,
        survey:{
            lsp_codigo: 9,
            lsp_pregunta: "¿Cuando planeas comprar tu motocicleta?",
            options: [
                { 
                  id: nombre[0].id,
                  name: nombre[0].name
                }
              ]
            }
        }        
        logger.log("info", send);
    var res= await axios.post(APIurl+"leads/crear_prospecto_subasta",send,
        {headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        logger.log("error", "Error al guardar lead");
        logger.log("error", error);
        return "Error al guardar lead "+error
    })
    return res
}

async function validOptID(user,conv,msg){    
    let confirm
    if(user.data.usu_opcion_identificador==null){
        if(conv.data.conv_mutable){
            if(regexNumber.test(msg) && msg>0 && msg<3){
                if(msg==1){
                    confirm=await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,true,user.data.usu_term_acept,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)
                    user.data.usu_opcion_identificador=true
                }else{
                    confirm=await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,false,user.data.usu_term_acept,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)
                    user.data.usu_opcion_identificador=false                
                }            
                if(confirm.status=="OK"){
                    confirm=await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                    conv.data.conv_mutable=false
                }else{
                    user.data.usu_opcion_identificador=null
                }
                return confirm
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true
                return {status:"Msg",data:"❌ Opcion Incorrecta, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Por favor ingresa el tipo de identificacion\n1. Cedula de ciudadania\n2. Cedula de extranjeria o Pasaporte"}
        }        
    }
}

async function validID(user,conv,msg){    
    let confirm,flag    
    if(user.data.usu_identificador==null){        
        flag=user.data.usu_opcion_identificador?(regexCedEc.test(msg) && conv.data.conv_mutable):(regexPasCol.test(msg) || regexPasEc.test(msg) || regexCedCol.test(msg)) && conv.data.conv_mutable
        confirm=flag
        ?
        await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,msg,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)
        :
        {status:"Msg",data:"Por favor ingrese su Documento de identificacion, con el formato adecuado"}
        if(confirm.status=="OK"){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)                
            conv.data.conv_mutable=false
            user.data.usu_identificador=msg
        }
        if(confirm.status=="Msg"){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
        }
        return confirm        
    }
}

async function validCellphone(conv,msg){    
    if(conv.data.conv_celular==null){
        if(conv.data.conv_mutable){
            if(regexCellphone.test(msg)){
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,msg)
                conv.data.conv_celular=msg
                conv.data.conv_mutable=false
                return {status:"OK",data:""}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true
                return {status:"Msg",data:"❌ Número de celular inválido, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Por favor ingresa el numero de celular para ser contactado formato:0990000000"}
        }        
    }
}

async function validMail(user,conv,msg){    
    if(user.data.usu_correo==null){
        if(conv.data.conv_mutable){
            if(regexMail.test(msg)){
                await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,msg,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                user.data.usu_correo=msg
                conv.data.conv_mutable=false
                return {status:"OK",data:""}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true
                return {status:"Msg",data:"❌ Correo Invalido, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Por favor ingrese su correo formato: xyz@gml.com"}
        }
    }
}

async function validCity(user,conv,msg,token){    
    if(user.data.usu_ciudad==null){        
        let consult= await consultCities(token)
        let names=consult.map((objeto) => objeto.nombre)
        let codes=consult.map((city) => city.codigo)
        if(conv.data.conv_mutable){
            if(regexNumbers.test(msg) && msg>0 && msg<=consult.length){
                await modifyUserbyCell(user.data.usu_apellido,codes[msg-1],user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                user.data.usu_ciudad=codes[msg-1]            
                conv.data.conv_mutable=false
                return {status:"OK",data:""}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true                
                return {status:"Msg",data:"❌ Opcion Incorrecta, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)                
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Por favor selecciona la ciudad en la que se espera se le atienda:"+listOptions(names)}
        }
    }
}

async function validUsercity(conv,msg){
    if(conv.data.conv_ciudad==null){
        if(conv.data.conv_mutable){
            if(regexOnlyName.test(msg)){
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,msg,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_ciudad=msg
                conv.data.conv_mutable=false
                return {status:"OK",data:""}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true                
                return {status:"Msg",data:"❌ Opcion Incorrecta, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Por favor ingrese el nombre de la ciudad en la que se encuentra"}
        }
    }
}

async function validBranch(user,conv,msg,token){    
    if(conv.data.conv_sucursal==null){        
        let consult=await consultAgencies(user.data.usu_ciudad,token)
        let names=consult.map((objeto) => objeto.vitrina)
        let codes=consult.map((city) => city.emp_codigo)
        if(codes.length==0){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            return {status:"OK",data:[]}
        }
        if(conv.data.conv_mutable){
            if(regexNumbers.test(msg) && msg>0 && msg<=consult.length){
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,codes[msg-1],conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_sucursal=codes[msg-1]
                conv.data.conv_mutable=false
                return {status:"OK",data:"Sucursal modificada"}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true                
                return {status:"Msg",data:"❌ Opcion Incorrecta, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Por favor selecciona la sucursal que se espera se le atienda:"+listOptions(names)}
        }        
    }else{
        return {status:"OK",data:"Sucursal guardada"}
    }
}
async function validType(conv,msg,token){
    if(conv.data.conv_tipo_moto==null){
        let consult= await consultTypeVehicule(token)        
        let names=consult.map((objeto) => objeto.cve_nombre)
        let codes=consult.map((city) => city.cat_vehiculo)
        if(conv.data.conv_mutable){
            if(regexNumber.test(msg) && msg>0 && msg<=consult.length ){
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,codes[msg-1],conv.data.conv_ciudad,false,conv.data.conv_celular)
                conv.data.conv_tipo_moto=codes[msg-1]
                conv.data.conv_mutable=false
                return {status:"OK",data:"Modificado el tipo de moto"}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true                
                return {status:"Msg",data:"❌ Opcion Incorrecta, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Tenemos una amplia gama de modelos según tu afición y necesidad 🏍️ \n Selecciona el número según tu estilo😎👇🏻 \n"+listOptions(names)}
        }        
    }
}

async function validProduct(conv,msg,token,emp){    
    if(conv.data.conv_moto==null){
        let consult= await consultModels(conv.data.conv_tipo_moto,token)
        let names=consult.map((objeto) => objeto.nombre_modelo+" "+objeto.anio_modelo)
        let codes=consult.map((city) => city.cod_modelo)
        let years=consult.map((city) => city.anio_modelo)
        if(codes.length==0){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            return {status:"OK",data:[]}
        }
        if(conv.data.conv_mutable){
            if(regexNumber.test(msg) && msg>0 && msg<=consult.length){
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,codes[msg-1],conv.data.conv_tipo_repuesto,years[msg-1],conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_moto=codes[msg-1]
                conv.data.conv_moto_anio=years[msg-1]
                conv.data.conv_mutable=false
                return {status:"OK",data:"Moto modificada"}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true
                return {status:"Msg",data:"❌ Opcion Incorrecta, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            switch(emp.data.emp_nombre){
                case 'KTM':
                    switch(conv.data.conv_tipo_moto){
                        case 14:
                            return {status:"Msg",data:"Desafía cualquier terreno con estas KTM 🔥 El X Country nunca será más apasionante como a bordo de estas increíbles KTM  💪🏻\n"+listOptions(names)}
                        break;
                        case 8:
                            return {status:"Msg",data:"No hay terreno complicado para las Enduro EXC 🔥​ Elige tu compañera para conquistar nuevos senderos 💪🏻\n"+listOptions(names)}
                        break;
                        case 9:
                            return {status:"Msg",data:"Si la adrenalina del Motocross es lo tuyo, puedes elegir entre estos modelos y estarás listo para la victoria 🏆​\n"+listOptions(names)}
                        break;
                        case 10:
                            return {status:"Msg",data:"Descubre emociones sin límites con nuestra gama de alta cilindrada. 🏍️\nElige el número de tu modelo y prepárate para sentir la potencia y adrenalina en cada rodada 🔥​\n"+listOptions(names)}
                        break;
                        case 11:
                            return {status:"Msg",data:"Si buscas una moto híbrida de calle, carretera incluso pista con la gama NAKED BIKE lo tienes todo 🔥​ Selecciona el número de tu preferencia.​\n"+listOptions(names)}
                        break;
                        case 12:
                            return {status:"Msg",data:"Si la velocidad está en tus venas es momento de sentirla al máximo con las RC 🏍️💨 Elige el número de tu modelo ideal, desata tu potencial y obtén la victoria🏆 \n"+listOptions(names)}
                        break;
                        case 13:
                            return {status:"Msg",data:"Descubre la sensación de libertad junto a las Adventure. 🏍️​ \nElige tu compañera de travesías y emocionantes ave\n"+listOptions(names)}
                        break;
                    }
                break;
                case 'KAWASAKI':
                    switch(conv.data.conv_tipo_moto){
                        case 14:
                            return {status:"Msg",data:"Diseñadas para recorrer y conquistar las mejores rutas.\nEscoge tu próxima compañera de aventuras🔥 🏍️\n"+listOptions(names)}
                        break;
                        case 8:
                            return {status:"Msg",data:"Atrae todas las miradas, sienta la calidad y el estilo de esta gama 🔥\n"+listOptions(names)}
                        break;
                        case 9:
                            return {status:"Msg",data:"La adrenalina es lo tuyo, sé un ganador 🏆 elige tu próxima moto:\n"+listOptions(names)}
                        break;
                        case 10:
                            return {status:"Msg",data:"Velocidad al máximo, adrenalina en tus venas 🏍️​\n¡Te esperamos en la pista!\n"+listOptions(names)}
                        break;
                        case 11:
                            return {status:"Msg",data:"Estilo único que conquista miradas 🔥\n"+listOptions(names)}
                        break;
                        case 12:
                            return {status:"Msg",data:"Diseñados para resistir en los más arduos terrenos.\nSon tu mejor aliado para progresar.\n Escoge tu próximo camino al éxito:\n"+listOptions(names)}
                        break;
                        case 13:
                            return {status:"Msg",data:"Somos únicos en este segmento, no tenemos competencia. Sé un verdadero líder.\n"+listOptions(names)}
                        break;
                    }
                break;
            }            
        }        
    }else{
        return {status:"OK",data:"Moto guardada"}
    }
}

async function validTimeBuy(conv,msg,token){    
    if(conv.data.conv_tiempo_compra==null){
        let consult= await consultBuyTimes(token)        
        let options= consult.filter((object)=>object.lsp_codigo==9)        
        options=options.map((object)=> object.options)        
        let names=options[0].map((objeto) => objeto.name)
        let codes=options[0].map((objeto) => objeto.id)        
        if(conv.data.conv_mutable){
            if(regexNumber.test(msg) && msg>0 && msg<=codes.length){
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,codes[msg-1],conv.data.conv_celular)
                conv.data.conv_tiempo_compra=codes[msg-1]
                conv.data.conv_mutable=false
                return {status:"OK",data:""}
            }else{
                if(msg==options.length+1){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,0,conv.data.conv_celular)
                    conv.data.conv_tiempo_compra=0
                    conv.data.conv_mutable=false
                    return {status:"OK",data:""}
                }else{
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                    conv.data.conv_mutable=true                
                    return {status:"Msg",data:"❌ Opcion Incorrecta, intentalo nuevamente 😄"}
                }
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true                
            return {status:"Msg",data:"Por favor seleccione el tiempo de compra:"+listOptions(names)}
        }        
    }
}

async function validTypeRefill(conv,msg){    
    if(conv.data.conv_tipo_repuesto==null){
        if(conv.data.conv_mutable){
            if(regexOnlyName.test(msg)){
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,msg,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_tipo_repuesto=msg
                conv.data.conv_mutable=false
                return {status:"OK",data:""}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true
                return {status:"Msg",data:"❌ Ingreso Invalido, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Ingrese un tipo de repuesto válido"}
        }       
    }
}

async function validYearProduct(conv,msg){    
    if(conv.data.conv_moto_anio==null){
        if(conv.data.conv_mutable){
            if(regexAnio.test(msg)){
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,msg,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_moto_anio=msg
                conv.data.conv_mutable=false
                return {status:"OK",data:""}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true
                return {status:"Msg",data:"❌ Año Invalido, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Ingrese un año de moto adecuado"}
        }        
    }
}

async function validStatus(user,conv,msg){    
    if(user.data.usu_estado_civil==null){
        if(conv.data.conv_mutable){
            if(regexNumber.test(msg) && msg>0 && msg<5){
                switch(msg){
                    case 1:
                        msg="Soltero"
                    break;
                    case 2:
                        msg="Casado"
                    break;
                    case 3:
                        msg="Divorciado"
                    break;
                    case 4:
                        msg="Viudo"
                    break;
                }
                await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,msg,user.data.usu_celular,user.data.usu_emp_id)
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)                                
                conv.data.conv_mutable=false
                return {status:"OK",data:""}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true
                return {status:"Msg",data:"❌ Opcion Incorrecta, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Selecciona tu estado civil\n1.SOLTERO\n2.CASADO\n3.DIVORCIADO\n4.VIUDO"}
        }
    }
}

async function validBranchConv(conv,msg){
    if(conv.data.conv_sucursal==null){                
        if(conv.data.conv_mutable){
            if(regexOnlyName.test(msg)){            
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,msg,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_sucursal=msg
                conv.data.conv_mutable=false
                return {status:"OK",data:"Sucursal modificada"}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true                
                return {status:"Msg",data:"❌ Opcion Incorrecta, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Por favor ingrese el nombre de la sucursal"}
        }        
    }else{
        return {status:"OK",data:"Sucursal guardada"}
    }
}

async function validProductConv(conv,msg){    
    if(conv.data.conv_moto==null){                        
        if(conv.data.conv_mutable){                      
            if(regexOnlyName.test(msg)){            
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,msg,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_moto=msg
                conv.data.conv_mutable=false
                return {status:"OK",data:"Moto modificada"}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true                
                return {status:"Msg",data:"❌ Opcion Incorrecta, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Por favor ingrese el nombre de la moto"}
        }        
    }else{
        return {status:"OK",data:"Moto guardada"}
    }
}

async function validBuymethod(conv,msg){
    if(conv.data.conv_metodo_pago==null){                        
        if(conv.data.conv_mutable){
            if(regexNumber.test(msg) && msg>0 && msg<5){            
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,msg,conv.data.conv_celular)
                conv.data.conv_metodo_pago=msg
                conv.data.conv_mutable=false
                return {status:"OK",data:"Metodo pago modificada"}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                conv.data.conv_mutable=true                
                return {status:"Msg",data:"❌ Opcion Incorrecta, intentalo nuevamente 😄"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            return {status:"Msg",data:"Cómo sería su método de pago:\n1. Contado\n2. Crédito\n3. Moto por parte de pago y crédito\n4. Moto por parte de pago y la diferencia al contado"}
        }        
    }else{
        return {status:"OK",data:"Metodo pago guardada"}
    }
}

async function sendMail(user,conv,emp,token){    
    let content = fs.readFileSync('src/templates/template.html', 'utf-8');
    let $ = cheerio.load(content);
    let changes,asunto
    switch(Number(conv.data.conv_princ_menu_opc)){
        case 2:
            asunto='Nueva Solicitud de Repuestos '+emp.data.emp_nombre
            changes = {'#empresa':emp.data.emp_nombre,
            '#SOLICITUD':asunto,
            '#INFO':'Repuestos',
            '#CANAL':'CANAL',
            '#MEDIO':'CHAT BOT',
            '#NOMBRES':user.data.usu_apellido==null?"<b>Nombre: </b>"+user.data.usu_nombre:"<b>Nombre y Apellido: </b>"+user.data.usu_nombre+" "+user.data.usu_apellido,
            '#CELULAR':"<b>Celular: </b>"+conv.data.conv_celular,
            '#CIUDAD':"<b>Ciudad: </b>"+conv.data.conv_ciudad,
            '#SUCURSAL':"<b>Sucursal: </b>"+conv.data.conv_sucursal,
            '#CEDULA':"<b>Cedula: </b>"+user.data.usu_identificador,
            '#CORREO':"<b>Correo: </b>"+user.data.usu_correo,
            '#TIPO_REPUESTO':"<b>Tipo de Repuesto requerido: </b>"+conv.data.conv_tipo_repuesto,
            '#PRODUCTO':"<b>Moto del repuesto: </b>"+conv.data.conv_moto,
            '#ANIO':"<b>Año del repuesto: </b>"+conv.data.conv_moto_anio
            }
        break;
        case 4:
            asunto='Nueva Solicitud de Accesorios '+emp.data.emp_nombre
            changes = {'#empresa':emp.data.emp_nombre,
            '#SOLICITUD':asunto,
            '#INFO':'Acesorios',
            '#CANAL':'CANAL',
            '#MEDIO':'CHAT BOT',
            '#NOMBRES':user.data.usu_apellido==null?"<b>Nombre: </b>"+user.data.usu_nombre:"<b>Nombre y Apellido: </b>"+user.data.usu_nombre+" "+user.data.usu_apellido,
            '#CELULAR':"<b>Celular: </b>"+conv.data.conv_celular,
            '#CIUDAD':"<b>Ciudad: </b>"+conv.data.conv_ciudad,
            '#SUCURSAL':"<b>Sucursal que desea ser atendido: </b>"+conv.data.conv_sucursal
        }
        break;
    }    
    for (let selector in changes) {        
        let newContent = changes[selector];
        $(selector).html(newContent);
    }
    let html=$.html()
    console.log(emp)
    let obj={
        bodyHtml: html,
        asunto: asunto,
        to: [
          {
            email: emp.data.emp_correo,
            name: "Post Venta "+emp.data.emp_nombre
          }
        ]
      }
    console.log(obj)
    await APIsendmail(token,obj)
}

async function navFlow(cell_number,comp_cell_number,msg){ 
    let DBresult=await connectDB()    
    if(DBresult.status=="Error"){
        return {status:"Error",data:DBresult.data}
    }
    let menu,sel_menu,token,result,user,conv,lowmsg
    let listH=""
    let emp = await consultCompanybynumber(comp_cell_number)
    token= await getToken()
    lowmsg=msg.toString().toLowerCase().trim()
    user=await consultUserbyCellphone(cell_number,emp.data.emp_id)
    if(user.status=="None"){
        user=await createUserCellOnly(cell_number,emp.data.emp_id)
        result=await createConversation(user.data)
        if(result.status=="OK"){
            return {status:"200",message:"Ok",data:[{code:1,text:emp.data.emp_mensaje_bienvenida}]}
            // return {status:"Msg",data:emp.data.emp_mensaje_bienvenida}
        }
    }
    conv =await consultConvesationbyUser(user.data.usu_id)
    if(user.data.usu_term_acept==null){        
        if(lowmsg=="si"){
            await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,true,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)
        }else{
            return {status:"200",message:"Ok",data:[{code:1,text:"Permitenos la autorizacion, sino no podremos comunicarnos.Escribe si para aceptar"}]}
            //return {status:"Msg",data:"Permitenos la autorizacion, sino no podremos comunicarnos.Escribe si para aceptar "}
        }
    }    
    if(user.data.usu_apellido==null && user.data.usu_nombre==null){
        if(regexName.test(msg)){
            let name=null
            let last_name=null
            if(/\s/.test(lowmsg)){
                let names=lowmsg.split(" ")  
                name=names[0]
                last_name=names[1]                
            }else{
                name=lowmsg                
            }
            await modifyUserbyCell(last_name,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,name,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)            
        }else{            
            return {status:"200",message:"Ok",data:[{code:1,text:"Por favor ingrese sus nombres [nombre apellido]"}]}
            //return {status:"Msg",data:"Por favor ingrese sus nombres [nombre apellido]"}
        }
    }    
    if(conv.data.conv_princ_menu_opc==null){
        if(regexNumber.test(msg) && msg>0 && msg<6){
            sel_menu=await modifyConversationbyID(conv.data.conv_id,msg,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)            
            menu=sel_menu.status=="OK"?Number(msg):null
            conv.data.conv_princ_menu_opc=sel_menu.status=="OK"?msg:null
        }else{            
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
            return {status:"200",message:"Ok",data:[{code:1,text:"En que te podemos ayudar?\n1. Me interesa una moto\n2. Necesito Repuestos\n3. Tiendas y Horarios\n4. Accesorios/Power Wear\n 5. Asesor en linea\n Ingrese una opcion de las anteriores"}]}
            // return {status:"Msg",data:"En que te podemos ayudar?\n1. Me interesa una moto\n2. Necesito Repuestos\n3. Tiendas y Horarios\n4. Accesorios/Power Wear\n 5. Asesor en linea\n Ingrese una opcion de las anteriores"}    
        }
    }
    if(menu==undefined){
        menu=Number(conv.data.conv_princ_menu_opc)
    }    
    let confirm
    switch(menu){
        case 1:
            confirm = await validUsercity(conv,msg)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                // return {status:confirm.status,data:confirm.data}
            confirm= await validOptID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                // return {status:confirm.status,data:confirm.data}            
            confirm =await validID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validStatus(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                // return {status:confirm.status,data:confirm.data}            
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validCellphone(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                // return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validMail(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                // return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validCity(user,conv,msg,token)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                // return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validBranch(user,conv,msg,token)            
            if(confirm.data.length>0){
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    //return {status:confirm.status,data:confirm.data}
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            }else{                
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                await modifyUserbyCell(user.data.usu_apellido,null,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)
                conv.data.conv_mutable=false
                user.data.usu_ciudad=null
                msg=""
                confirm = await validCity(user,conv,msg,token)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:"Lo sentimos no hay agencias en la ciudad seleccionada"},{code:2,data:confirm.data}]}
                    // return {status:confirm.status,data:"Lo sentimos no hay agencias en la ciudad seleccionada "+confirm.data}                
            }                            
            confirm = await validType(conv,msg,token)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                // return {status:confirm.status,data:confirm.data
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validProduct(conv,msg,token,emp)            
            if(confirm.data.length>0){
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    // return {status:confirm.status,data:confirm.data}
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,null,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_mutable=false
                conv.data.conv_tipo_moto=null
                msg=""
                confirm = await validType(conv,msg,token)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    return {status:"200",message:"Ok",data:[{code:1,text:"Lo sentimos no tenemos en existencia motos en esta categoria"},{code:2,text:confirm.data}]}
                    // return {status:confirm.status,data:"Lo sentimos no tenemos en existencia motos en esta categoria "+confirm.data}                
            }
            confirm = await validTimeBuy(conv,msg,token)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                // return {status:confirm.status,data:confirm.data}
        break;
        case 2:
            confirm = await validUsercity(conv,msg)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                // return {status:confirm.status,data:confirm.data}
                confirm = await validBranchConv(conv,msg)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                    // return {status:confirm.status,data:confirm.data}
            confirm= await validOptID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                //return {status:confirm.status,data:confirm.data}
            confirm =await validID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}            
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validCellphone(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validMail(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                //return {status:confirm.status,data:confirm.data}                                     
            confirm = await validProductConv(conv,msg)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                    //return {status:confirm.status,data:confirm.data} 
            confirm = await validTypeRefill(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                //return {status:confirm.status,data:confirm.data}            
            confirm = await validYearProduct(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
        break;
        case 3:
            listH="Estamos ubicados en: \n📍Cuenca:\n Gran Colombia y Manzaneros \n📍Guayaquil: Av. De las Américas 703 y Calle Octava \n📍Quito \nlocal Granados - Gonzalo Baca y de Los Naranjos local 2 (redondel del ciclista)\n 🕒 Nuestro horario de atención es: \n Lunes a Viernes de 9:00 am hasta las 7:00 pm \nSábados de 9:30 am a 1:00 pm\n¡Te esperamos! 🔥"
        break;
        case 4:
            confirm = await validUsercity(conv,msg)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                // return {status:confirm.status,data:confirm.data}
            confirm =await validCellphone(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validBranchConv(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}            
            //await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            //conv.data.conv_mutable=true
            listH+="El catalogo esta disponible en: https://drive.google.com/file/d/12dYoeExF5s2NraHYZ2iplbI9ddgqYT28/view?usp=sharing \n"
        break;
        case 5:
            confirm = await validUsercity(conv,msg)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                // return {status:confirm.status,data:confirm.data}
            confirm= await validOptID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validStatus(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validCellphone(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validMail(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validCity(user,conv,msg,token)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validBranch(user,conv,msg,token)            
            if(confirm.data.length>0){
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    //return {status:confirm.status,data:confirm.data}
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                await modifyUserbyCell(user.data.usu_apellido,null,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)
                conv.data.conv_mutable=false
                user.data.usu_ciudad=null
                msg=""
                confirm = await validCity(user,conv,msg,token)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    return {status:"200",message:"Ok",data:[{code:1,text:"Lo sentimos no hay agencias en la ciudad seleccionada"},{code:2,text:confirm.data}]}
                    // return {status:confirm.status,data:"Lo sentimos no hay agencias en la ciudad seleccionada "+confirm.data}
            }               
            confirm = await validType(conv,msg,token)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validProduct(conv,msg,token,emp)
            if(confirm.data.length>0){
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    //return {status:confirm.status,data:confirm.data}
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,null,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_mutable=false
                conv.data.conv_tipo_moto=null
                msg=""
                confirm = await validType(conv,msg,token)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    //return {status:confirm.status,data:"Lo sentimos no tenemos en existencia motos en este tipo "+confirm.data}                
                    return {status:"200",message:"Ok",data:[{code:1,text:"Lo sentimos no tenemos en existencia motos en este tipo"},{code:2,text:confirm.data}]}
            }
            confirm = await validTimeBuy(conv,msg,token)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}            
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
        break;
        default:
            await modifyConversationbyID(conv.data.conv_id,msg,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_celular)
            return {status:"200",message:"Ok",data:[{code:1,text:"opcion no valida"}]}
            //return {status:"Msg",data:"Opcion no valida"}
    }    
    if(conv.data.conv_confirm==false){
        if(conv.data.conv_princ_menu_opc==1 || conv.data.conv_princ_menu_opc==5){
            if(lowmsg=="si" || lowmsg=="no"){
                if(lowmsg=="no"){
                    await modifyUserbyCell(null,null,null,null,null,null,user.data.usu_term_acept,null,user.data.usu_celular,user.data.usu_emp_id)
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,null,null,null,null,null,null,true,null,null)
                    return {status:"200",message:"Ok",data:[{code:1,text:"Por favor ingrese el nombre de la ciudad en la que se encuentra"}]}
                }else{                    
                    await confirmConversation(conv.data.conv_id)
                    //return {status:"Msg",data:"Hemos registrado tu información.\nSi quieres regresar al menú principal escribe 1, Si quieres salir escribe 2"}
                    listH+="Hemos registrado tu información."
                    confirm=await saveNewLead(user,conv,token)
                    // return {status:"200",message:"Ok",data:[{code:1,text:"Hemos registrado tu información."+"Si quieres regresar al menú principal escribe 1, Si quieres salir escribe 2"}]}
                }
            }else{
                let confirm="Por favor confirma tus datos:\n"
                confirm+=user.data.usu_opcion_identificador?"Tipo de Identificacion: Cedula identidad\n":"Tipo de Identificacion: Cedula de Extranjeria o Pasaporte\n"
                confirm+="Identificacion: "+user.data.usu_identificador+"\n"
                confirm+="Nombre: "+user.data.usu_nombre+"\n"

                if(user.data.usu_apellido!=null){
                    confirm+="Apellido: "+user.data.usu_apellido+"\n"
                }
                confirm+="Email: "+user.data.usu_correo+"\n"            
                
                if(user.data.usu_ciudad!=null){
                    consult= await consultCities(token)
                    let nameCity=consult.filter((object)=>object.codigo==user.data.usu_ciudad)            
                    nameCity=user.data.usu_ciudad==0?conv.data.conv_ciudad:nameCity[0].nombre
                    confirm+="Ciudad: "+nameCity+"\n"
                }
                
                if(conv.data.conv_tipo_moto!=null){
                    consult= await consultTypeVehicule(token)
                    let nameType=consult.filter((object)=>object.cat_vehiculo==conv.data.conv_tipo_moto)
                    confirm+="Tipo de vehiculo: "+nameType[0].cve_nombre+"\n"
                }                
                
                if(conv.data.conv_moto!=null){
                    consult= await consultModels(conv.data.conv_tipo_moto,token)
                    let nameModel=consult.filter((object)=>object.cod_modelo==conv.data.conv_moto)
                    confirm+="Modelo: "+nameModel[0].nombre_modelo+"\n"
                    confirm+="Año: "+nameModel[0].anio_modelo+"\n"
                }
    
                if(conv.data.conv_tiempo_compra!=null){
                    consult= await consultBuyTimes(token)
                    let optionName=consult.filter((object)=>object.lsp_codigo==9)
                    optionName=optionName.map((object)=>object.options)                    
                    let nombre =optionName[0].filter((object)=>object.id==conv.data.conv_tiempo_compra)
                    confirm+="Opcion de compra: "+nombre[0].name+"\n"
                }
    
                confirm+="Son correctos Si o No"
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_mutable=false
                //return {status:"Msg",data:confirm}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm}]}                           
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
            conv.data.conv_mutable=false
            await confirmConversation(conv.data.conv_id)
            if(conv.data.conv_princ_menu_opc==2 || conv.data.conv_princ_menu_opc==4){
                await sendMail(user,conv,emp,token)
            }
        }
    }
    if(conv.data.conv_finalizada==false){        
        if(regexNumber.test(msg) && msg>0 && msg<3){
            await finishConversation(conv.data.conv_id)            
            await createConversation(user.data.usu_id)
            if(msg==1){
                return {status:"200",message:"Ok",data:[{code:1,text:"En que te podemos ayudar?\n1. Me interesa una moto\n2. Necesito Repuestos\n3. Tiendas y Horarios\n4. Accesorios/Power Wear\n 5. Asesor en linea\n Ingrese una opcion de las anteriores"}]}
                //return {status:"Msg",data:"En que te podemos ayudar?\n1. Me interesa una moto\n2. Necesito Repuestos\n3. Tiendas y Horarios\n4. Accesorios/Power Wear\n 5. Asesor en linea\n Ingrese una opcion de las anteriores"}
            }else{
                return {status:"200",message:"Ok",data:[{code:1,text:"Muchas Gracias por preferirnos"}]}
                //return {status:"Msg",data:"Muchas Gracias por preferirnos"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            if(listH!=""){
                return {status:"200",message:"Ok",data:[{code:1,text:listH},{code:2,text:"Si quieres regresar al menú principal escribe 1, Si quieres salir escribe 2"}]}
            }else{
                return {status:"200",message:"Ok",data:[{code:1,text:"Si quieres regresar al menú principal escribe 1, Si quieres salir escribe 2"}]}
            }
            
            //return {status:"Msg",data:listH+"Si quieres regresar al menú principal escribe 1, Si quieres salir escribe 2"}
        }
    } 
}

async function navFlowKws(cell_number,comp_cell_number,msg){ 
    let DBresult=await connectDB()    
    if(DBresult.status=="Error"){
        return {status:"Error",data:result.data}
    }
    let menu,sel_menu,token,result,user,conv,lowmsg
    let listH=""
    let emp = await consultCompanybynumber(comp_cell_number)
    token= await getToken()
    lowmsg=msg.toString().toLowerCase().trim()
    user=await consultUserbyCellphone(cell_number,emp.data.emp_id)
    if(user.status=="None"){
        user=await createUserCellOnly(cell_number,emp.data.emp_id)
        result=await createConversation(user.data)
        if(result.status=="OK"){
            return {status:"200",message:"Ok",data:[{code:1,text:emp.data.emp_mensaje_bienvenida}]}
            // return {status:"Msg",data:emp.data.emp_mensaje_bienvenida}
        }
    }
    conv =await consultConvesationbyUser(user.data.usu_id)
    if(user.data.usu_term_acept==null){        
        if(lowmsg=="si"){
            await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,true,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)
        }else{
            return {status:"200",message:"Ok",data:[{code:1,text:"Permitenos la autorizacion, sino no podremos comunicarnos.Escribe si para aceptar"}]}
            //return {status:"Msg",data:"Permitenos la autorizacion, sino no podremos comunicarnos.Escribe si para aceptar "}
        }
    }    
    if(user.data.usu_apellido==null && user.data.usu_nombre==null){
        if(regexName.test(msg)){
            let name=null
            let last_name=null
            if(/\s/.test(lowmsg)){
                let names=lowmsg.split(" ")  
                name=names[0]
                last_name=names[1]                
            }else{
                name=lowmsg                
            }
            await modifyUserbyCell(last_name,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,name,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)            
        }else{            
            return {status:"200",message:"Ok",data:[{code:1,text:"Por favor ingrese sus nombres [nombre apellido]"}]}
            //return {status:"Msg",data:"Por favor ingrese sus nombres [nombre apellido]"}
        }
    }    
    if(conv.data.conv_princ_menu_opc==null){
        if(regexNumber.test(msg) && msg>0 && msg<6){
            sel_menu=await modifyConversationbyID(conv.data.conv_id,msg,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)            
            menu=sel_menu.status=="OK"?Number(msg):null
            conv.data.conv_princ_menu_opc=sel_menu.status=="OK"?msg:null
        }else{            
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
            return {status:"200",message:"Ok",data:[{code:1,text:"En que te podemos ayudar?\n1. Deseo adquirir una moto\n2. Necesito Repuestos\n3. Tiendas y Horarios\n4. Asesor en linea\n Ingrese una opcion de las anteriores"}]}
            // return {status:"Msg",data:"En que te podemos ayudar?\n1. Me interesa una moto\n2. Necesito Repuestos\n3. Tiendas y Horarios\n4. Accesorios/Power Wear\n 5. Asesor en linea\n Ingrese una opcion de las anteriores"}    
        }
    }
    if(menu==undefined){
        menu=Number(conv.data.conv_princ_menu_opc)
    }    
    let confirm
    switch(menu){
        case 1:
            confirm = await validUsercity(conv,msg)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                // return {status:confirm.status,data:confirm.data}
            confirm= await validOptID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                // return {status:confirm.status,data:confirm.data}            
            confirm =await validID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validStatus(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                // return {status:confirm.status,data:confirm.data}            
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validCellphone(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                // return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validMail(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                // return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validCity(user,conv,msg,token)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                // return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validBranch(user,conv,msg,token)            
            if(confirm.data.length>0){
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    //return {status:confirm.status,data:confirm.data}
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            }else{                
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                await modifyUserbyCell(user.data.usu_apellido,null,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)
                conv.data.conv_mutable=false
                user.data.usu_ciudad=null
                msg=""
                confirm = await validCity(user,conv,msg,token)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:"Lo sentimos no hay agencias en la ciudad seleccionada"},{code:2,data:confirm.data}]}
                    // return {status:confirm.status,data:"Lo sentimos no hay agencias en la ciudad seleccionada "+confirm.data}                
            }                            
            confirm = await validType(conv,msg,token)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                // return {status:confirm.status,data:confirm.data
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validProduct(conv,msg,token,emp)            
            if(confirm.data.length>0){
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    // return {status:confirm.status,data:confirm.data}
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,null,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_mutable=false
                conv.data.conv_tipo_moto=null
                msg=""
                confirm = await validType(conv,msg,token)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    return {status:"200",message:"Ok",data:[{code:1,text:"Lo sentimos no tenemos en existencia motos en esta categoria"},{code:2,text:confirm.data}]}
                    // return {status:confirm.status,data:"Lo sentimos no tenemos en existencia motos en esta categoria "+confirm.data}                
            }
            confirm = await validTimeBuy(conv,msg,token)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                // return {status:confirm.status,data:confirm.data}
            confirm = await validBuymethod(conv,msg,token)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
        break;
        case 2:
            confirm = await validUsercity(conv,msg)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                // return {status:confirm.status,data:confirm.data}
                confirm = await validBranchConv(conv,msg)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                    // return {status:confirm.status,data:confirm.data}
            confirm= await validOptID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                //return {status:confirm.status,data:confirm.data}
            confirm =await validID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}            
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validCellphone(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validMail(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                //return {status:confirm.status,data:confirm.data}                                     
            confirm = await validProductConv(conv,msg)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                    //return {status:confirm.status,data:confirm.data} 
            confirm = await validTypeRefill(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                //return {status:confirm.status,data:confirm.data}            
            confirm = await validYearProduct(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
        break;
        case 3:
            listH="Estamos ubicados en:📍Cuenca:\nGran Colombia y Manzaneros\n📍Guayaquil:Av. De las Américas 703 y Calle Octava\n📍Quito\nLocal Granados - Gonzalo Baca y de Los Naranjos local 2 (redondel del ciclista)\n📍Manta:\nAv. 4 de noviembre y Calle 305\n🕒 Nuestro horario de atención es:\nLunes a viernes de 9:00 am hasta las 7:00 pm\nSábados de 9:30 am a 1:00 pm\n¡Te esperamos!🔥"
        break;        
        case 4:
            confirm = await validUsercity(conv,msg)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
                // return {status:confirm.status,data:confirm.data}
            confirm= await validOptID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validID(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validStatus(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validCellphone(conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm =await validMail(user,conv,msg)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validCity(user,conv,msg,token)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}                
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validBranch(user,conv,msg,token)            
            if(confirm.data.length>0){
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    //return {status:confirm.status,data:confirm.data}
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
                await modifyUserbyCell(user.data.usu_apellido,null,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_estado_civil,user.data.usu_celular,user.data.usu_emp_id)
                conv.data.conv_mutable=false
                user.data.usu_ciudad=null
                msg=""
                confirm = await validCity(user,conv,msg,token)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    return {status:"200",message:"Ok",data:[{code:1,text:"Lo sentimos no hay agencias en la ciudad seleccionada"},{code:2,text:confirm.data}]}
                    // return {status:confirm.status,data:"Lo sentimos no hay agencias en la ciudad seleccionada "+confirm.data}
            }               
            confirm = await validType(conv,msg,token)
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validProduct(conv,msg,token,emp)
            if(confirm.data.length>0){
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    //return {status:confirm.status,data:confirm.data}
                    return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,null,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_mutable=false
                conv.data.conv_tipo_moto=null
                msg=""
                confirm = await validType(conv,msg,token)
                if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                    //return {status:confirm.status,data:"Lo sentimos no tenemos en existencia motos en este tipo "+confirm.data}                
                    return {status:"200",message:"Ok",data:[{code:1,text:"Lo sentimos no tenemos en existencia motos en este tipo"},{code:2,text:confirm.data}]}
            }
            confirm = await validTimeBuy(conv,msg,token)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                //return {status:confirm.status,data:confirm.data}            
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
            confirm = await validBuymethod(conv,msg,token)            
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:"200",message:"Ok",data:[{code:1,text:confirm.data}]}
        break;
        default:
            await modifyConversationbyID(conv.data.conv_id,msg,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_tiempo_compra,conv.data.conv_celular)
            return {status:"200",message:"Ok",data:[{code:1,text:"opcion no valida"}]}
            //return {status:"Msg",data:"Opcion no valida"}
    }    
    if(conv.data.conv_confirm==false){
        if(conv.data.conv_princ_menu_opc==1 || conv.data.conv_princ_menu_opc==5){
            if(lowmsg=="si" || lowmsg=="no"){
                if(lowmsg=="no"){
                    await modifyUserbyCell(null,null,null,null,null,null,user.data.usu_term_acept,null,user.data.usu_celular,user.data.usu_emp_id)
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,null,null,null,null,null,null,true,null,null)
                    return {status:"200",message:"Ok",data:[{code:1,text:"Por favor ingrese el nombre de la ciudad en la que se encuentra"}]}
                }else{                    
                    await confirmConversation(conv.data.conv_id)
                    //return {status:"Msg",data:"Hemos registrado tu información.\nSi quieres regresar al menú principal escribe 1, Si quieres salir escribe 2"}
                    listH+="Hemos registrado tu información."
                    confirm=await saveNewLead(user,conv,token)
                    // return {status:"200",message:"Ok",data:[{code:1,text:"Hemos registrado tu información."+"Si quieres regresar al menú principal escribe 1, Si quieres salir escribe 2"}]}
                }
            }else{
                let confirm="Por favor confirma tus datos:\n"
                confirm+=user.data.usu_opcion_identificador?"Tipo de Identificacion: Cedula identidad\n":"Tipo de Identificacion: Cedula de Extranjeria o Pasaporte\n"
                confirm+="Identificacion: "+user.data.usu_identificador+"\n"
                confirm+="Nombre: "+user.data.usu_nombre+"\n"

                if(user.data.usu_apellido!=null){
                    confirm+="Apellido: "+user.data.usu_apellido+"\n"
                }
                confirm+="Email: "+user.data.usu_correo+"\n"            
                
                if(user.data.usu_ciudad!=null){
                    consult= await consultCities(token)
                    let nameCity=consult.filter((object)=>object.codigo==user.data.usu_ciudad)            
                    nameCity=user.data.usu_ciudad==0?conv.data.conv_ciudad:nameCity[0].nombre
                    confirm+="Ciudad: "+nameCity+"\n"
                }
                
                if(conv.data.conv_tipo_moto!=null){
                    consult= await consultTypeVehicule(token)
                    let nameType=consult.filter((object)=>object.cat_vehiculo==conv.data.conv_tipo_moto)
                    confirm+="Tipo de vehiculo: "+nameType[0].cve_nombre+"\n"
                }                
                
                if(conv.data.conv_moto!=null){
                    consult= await consultModels(conv.data.conv_tipo_moto,token)
                    let nameModel=consult.filter((object)=>object.cod_modelo==conv.data.conv_moto)
                    confirm+="Modelo: "+nameModel[0].nombre_modelo+"\n"
                    confirm+="Año: "+nameModel[0].anio_modelo+"\n"
                }
    
                if(conv.data.conv_tiempo_compra!=null){
                    consult= await consultBuyTimes(token)
                    let optionName=consult.filter((object)=>object.lsp_codigo==9)
                    optionName=optionName.map((object)=>object.options)                    
                    let nombre =optionName[0].filter((object)=>object.id==conv.data.conv_tiempo_compra)
                    confirm+="Opcion de compra: "+nombre[0].name+"\n"
                }
    
                confirm+="Son correctos Si o No"
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
                conv.data.conv_mutable=false
                //return {status:"Msg",data:confirm}
                return {status:"200",message:"Ok",data:[{code:1,text:confirm}]}                           
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_celular)
            conv.data.conv_mutable=false
            await confirmConversation(conv.data.conv_id)
            if(conv.data.conv_princ_menu_opc==2 || conv.data.conv_princ_menu_opc==4){
                await sendMail(user,conv,emp,token)
            }
        }
    }
    if(conv.data.conv_finalizada==false){        
        if(regexNumber.test(msg) && msg>0 && msg<3){
            await finishConversation(conv.data.conv_id)            
            await createConversation(user.data.usu_id)
            if(msg==1){
                return {status:"200",message:"Ok",data:[{code:1,text:"En que te podemos ayudar?\n1. Me interesa una moto\n2. Necesito Repuestos\n3. Tiendas y Horarios\n4. Accesorios/Power Wear\n 5. Asesor en linea\n Ingrese una opcion de las anteriores"}]}
                //return {status:"Msg",data:"En que te podemos ayudar?\n1. Me interesa una moto\n2. Necesito Repuestos\n3. Tiendas y Horarios\n4. Accesorios/Power Wear\n 5. Asesor en linea\n Ingrese una opcion de las anteriores"}
            }else{
                return {status:"200",message:"Ok",data:[{code:1,text:"Muchas Gracias por preferirnos"}]}
                //return {status:"Msg",data:"Muchas Gracias por preferirnos"}
            }
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_tiempo_compra,conv.data.conv_metodo_pago,conv.data.conv_celular)
            conv.data.conv_mutable=true
            if(listH!=""){
                return {status:"200",message:"Ok",data:[{code:1,text:listH},{code:2,text:"Si quieres regresar al menú principal escribe 1, Si quieres salir escribe 2"}]}
            }else{
                return {status:"200",message:"Ok",data:[{code:1,text:"Si quieres regresar al menú principal escribe 1, Si quieres salir escribe 2"}]}
            }
            
            //return {status:"Msg",data:listH+"Si quieres regresar al menú principal escribe 1, Si quieres salir escribe 2"}
        }
    } 
}

app.use(cors());

app.post('/getWhtspMsg', async (req, res) => {
    try{
        const jsonData = req.body;
        if (Object.keys(jsonData).length > 0) {
            let message=jsonData.message
            let number=jsonData.number
            let compNumber=jsonData.compNumber     
            let result       
            if(compNumber=="0968027506"){
                result= await navFlow(number,compNumber,message)
            }else{
                result= await navFlowKws(number,compNumber,message)
            }
            res.status(200).json(result)
        } else {
            res.status(400).json({error: 'Solicitud no contiene JSON válido'});
        }
    }catch(error){
        console.log(error)
        res.status(500).json({error: error});
    }             
})

app.listen(app.get('port'),()=>{      
    console.log(`Server listening on port ${app.get('port')}`);
});


