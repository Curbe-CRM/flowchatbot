//Importadion de libreriaas
const express = require('express');// Aplicaicon
const morgan=require('morgan');
const axios=require('axios');//Consultas http
var cors = require('cors');//Seguridad CORS
const { Client,Pool } = require('pg');//Cliente postgres
let APIurl//URL para consulta de datos y registro de leads
const Reconnect = require('reconnect-core');
const fs = require('fs')// Dependencia para explorar archivos
const cheerio = require('cheerio');// Dependencia para la modificacion de HTML
const winston = require("winston");// Dependencia para generacion de logs
const logger = winston.createLogger({//Configuracion de logs    
    level: "info",//nivel de loger
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`//Formato de salida de logs
      )
    ),    
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: "src/logs/app.log" }),//Direccion de arvhivo de logs
    ],
  });

const app = express(); //Inicio de aplicaicon express
app.set('port', process.env.PORT || 8585);// Puerto de salida de API
app.set('json spaces', 2)
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());// COnfiguraicon de salida de API en formato JSON

let client // Cliente de conexion DB

const dbConfig = {//Configuracion de conewxion a BD
    user: process.env["User"],//Usuario
    host: process.env["Host"],//Host
    database: process.env["DB"],//Base de datos
    password: process.env["Paswd"],//Contraseña
    port: 5432,//puerto de conexion
    ssl: {
        rejectUnauthorized: false//Configuracion de aceptacion ssl
    }
};

async function createUserCellOnly(cell_number,comp_cell_number) {// Funcion asincrona para creacion de usuario en base a numero de celular y numero del que llega el mensaje    
    try {
      const queryText = 'INSERT INTO usuario (usu_celular,usu_emp_id) VALUES ($1,$2) RETURNING usu_id';//Query
      const values = [cell_number,comp_cell_number];//Envio de parametros
      let response=await client.query(queryText, values);//Consulta de query
      return response.rows[0].usu_id//Retorno de respuesta
    } catch (error) {//En caso de error visualizar el mismo
        logger.log("error","Error al crear usuario")
        logger.log("error",error)
        console.log(error)
        return {status:"Error",data:error}
    }
}

async function modifyUserbyID(objClient){// Funcion para modificar usuario en base a ID
    try {        
        const sets = [];//Arreglo para entradas de campos(parametros sql)
        const values= []//Arreglo para entradas de valores(parametros sql)
        for (const field in objClient) {// Bucle para recorrer cada campo de la tabla y asignar valor
            if(field!="usu_celular"){//Excepcion de columna de identificador de usuario(celular)
                sets.push(`${field} = $${sets.length + 1}`);//Creacion de sql
                values.push(objClient[field])//Agregacion de valores 
            }
        }
        const query = `
            UPDATE usuario
            SET ${sets.join(', ')}
            WHERE usu_id ='`+objClient.usu_id.toString()+`'
            RETURNING *;
        `;//Declaracion de query, con retorno de usuario modificado
        const result = await client.query(query,values);// Consulta de query
        if (result.rowCount>0) {//si hay resultado de la consulta se retorna,caso de multiples o ninguna se retorna arreglo vacio
            return [result.rows[0]]
        } else {            
            return []
        }
    } catch (error) {//Visualizacion de errores
        logger.log("error","Error al modificar usuario")
        logger.log("error",error)
        console.log(error)        
        return {status:"Error",data:error}
    }
}

async function modifyConversationbyID(objConv){//Funcion para modificar la conversaion actual
    try {        
        const sets = [];//Arreglo para entradas de campos(parametros sql)
        const values= []//Arreglo para entradas de valores(parametros sql)
        for (const field in objConv) {// Bucle para recorrer cada campo de la tabla y asignar valor
            sets.push(`${field} = $${sets.length + 1}`);//Creacion de sql
            values.push(objConv[field])//Agregacion de valores
        }
        const query = `
            UPDATE conversacion 
            SET ${sets.join(', ')}
            WHERE conv_id =`+objConv.conv_id+`
            RETURNING *;
        `;//Declaracion de query, con retorno de conversacion modificada
        const result = await client.query(query,values);// Consulta de query
        if (result.rowCount>0) {//si hay resultado de la consulta se retorna,caso de multiples o ninguna se retorna arreglo vacio
            return result.rows[0]
        } else {
            return []
        }
    } catch (error) {//Visualizacion de errores
        logger.log("error","Error al modificar conversacion")
        logger.log("error",error)
        console.log(error)
        return {status:"Error",data:error}
    }
}

async function createConversation(user_id,inst_id,mutable) {//Funcion para creacion de conversacion
    try {
      const now= new Date()//Obtencion de hora actualde creacion de conversacion
      const queryText = 'INSERT INTO conversacion (conv_usuario,conv_fecha,conv_indice_flujo,conv_mutable) VALUES ($1,$2,$3,$4) RETURNING *';//Query para creacion de conversacion
      const values = [user_id,now,inst_id,mutable];//Paso de parametros
      let response=await client.query(queryText, values);//Consulta a DB
      return response.rows[0]//Retorno de respuesta
    } catch (error) {//Visualizacion de errores
        logger.log("error","Error al crear conversacion")
        logger.log("error",error)
        console.log(error)
      return {status:"Error",data:error}
    }
}

async function finishConversation(conv_id){//Funcion para finalizar la conversacion
    try {
        const uploadFields = {
            conv_finalizada:true//Cambio de valor de campo finalizado
        };
        const sets = [];//Arreglo para entradas de campos(parametros sql)
        const values= []//Arreglo para entradas de valores(parametros sql)
        for (const field in uploadFields) {// Bucle para recorrer cada campo de la tabla y asignar valor
            sets.push(`${field} = $${sets.length + 1}`);//Creacion de sql
            values.push(uploadFields[field])//Agregacion de valores
        }
        const query = `
            UPDATE conversacion 
            SET ${sets.join(', ')}
            WHERE conv_id =`+conv_id+`
            RETURNING *;
        `;//Declaracion de query, con retorno de conversacion modificada
        const result = await client.query(query,values);
        if (result.rowCount>0) {//si hay resultado de la consulta se retorna,caso de multiples o ninguna se retorna arreglo vacio
            return result.rows[0]
        } else {
            return []
        }
    } catch (error) {//Visualizacion de errores
        logger.log("error","Error al terminar conversacion")
        logger.log("error",error)
        console.log(error)
        return {status:"Error",data:error}
    }
}

async function confirmConversation(conv_id){//Funcion para confirmar la conversacion
    try {
        const uploadFields = {
            conv_confirm:true//Actualizacion de campo de confirmacion de conversacion
        };
        const sets = [];//Arreglo para entradas de campos(parametros sql)
        const values= []//Arreglo para entradas de valores(parametros sql)
        for (const field in uploadFields) {// Bucle para recorrer cada campo de la tabla y asignar valor
            sets.push(`${field} = $${sets.length + 1}`);
            values.push(uploadFields[field])
        }
        const query = `
            UPDATE conversacion
            SET ${sets.join(', ')}
            WHERE conv_id =`+conv_id+`
            RETURNING *;
        `;//Declaracion de query, con retorno de conversacion modificada
        const result = await client.query(query,values);//Retorno de conversacion
        if (result.rowCount>0) {//si hay resultado de la consulta se retorna,caso de multiples o ninguna se retorna arreglo vacio
            return result.rows[0]
        } else {
            return []
        }
    } catch (error) {//Visualizacion de errores
        logger.log("error","Error al confirmar conversacion")
        logger.log("error",error)
        console.log(error)
        return {status:"Error",data:error}
    }
}

async function consultCompanybynumber(number){//Funcion de consulta de empresa
    try {  
        const queryText = 'SELECT * FROM empresa WHERE emp_celular=$1';//Query para consulta de empresa
        const values = [number];//paso de parametro
        let response=await client.query(queryText, values);
        if(response.rowCount==1){//si hay resultado de la consulta se retorna,caso de multiples o ninguna se retorna arreglo vacio
            return response.rows[0]
        }else{
            if(response.rowCount==0){
                return []
            }else{
                return {status:"Multiple",data:"Mas de un registro por celular compania"}
            }            
        }        
      } catch (error) {//Visualizacion de errores      
        logger.log("error","Error al consultar empresa")
        logger.log("error",error)
        console.log(error)
        return {status:"Error",data:error}
      }

}

async function consultUserbyCellphone(number,emp_id){//Funcion para consultar usuario por celular
    try {
        const queryText = 'SELECT * FROM usuario WHERE usu_celular=$1 and usu_emp_id=$2';//Creacion de query para consulta de usuario por celular
        const values = [number,emp_id];//Paso de parametros a query
        let response=await client.query(queryText, values);//LLamdo a metodo de consulta query
        if(response.rowCount==1){//si hay resultado de la consulta se retorna,caso de multiples o ninguna se retorna arreglo vacio
            return [response.rows[0]]
        }else{
            if(response.rowCount==0){
                return []
            }else{
                return {status:"Multiple",data:"Mas de un registro por celular"}
            }            
        }        
      } catch (error) {//Visualizacion de errores       
        logger.log("error","Error al consultar usuario")
        logger.log("error",error)
        console.log(error)
        return {status:"Error",data:error}
      }

}

async function consultConvesationbyUser(userID){//Funcion para consultar conversacion
    try {        
        const queryText = 'SELECT * FROM conversacion WHERE conv_usuario=$1 and conv_finalizada=false';//Creacion de query para consulta de conversacion no finalizada
        const values = [userID];//Paso de parametros
        let response=await client.query(queryText, values);//llamado a funcion de consulta
        if(response.rowCount==1){//si hay resultado de la consulta se retorna,caso de multiples o ninguna se retorna arreglo vacio
            return response.rows[0]
        }else{
            if(response.rowCount==0){
                return []
            }else{
                return {status:"Multiple",data:"Mas de un registro por usuario"}
            }            
        }
      } catch (error) {//Visualizacion de errores
        logger.log("error","Error al consultar conversacion")
        logger.log("error",error)
        console.log(error)        
        return {status:"Error",data:error}
      }
}

async function consultFlowbyComp(comp){//Funcion para consultar flujo de la empresa
    try {
        const queryText = 'SELECT * FROM flujo WHERE flu_emp_id=$1';//Creacion de query para consulta de flujo de la empresa
        const values = [comp];//Paso de parametros a query
        let response=await client.query(queryText, values);//llamado a funcion de consulta
        if(response.rowCount==1){//si hay resultado de la consulta se retorna,caso de multiples o ninguna se retorna arreglo vacio
            return response.rows[0]
        }else{
            if(response.rowCount==0){
                return []
            }else{
                return {status:"Multiple",data:"Mas de un registro por usuario"}
            }            
        }
      } catch (error) {//Visualizacion de errores     
        logger.log("error","Error al consultar flujo")
        logger.log("error",error)
        console.log(error)
        return {status:"Error",data:error}
      }
}

async function consultInstancesbyIndex(flow_id,index){//Funcion para consulta de instancias
    try {
        const queryText = 'SELECT * FROM instancia LEFT JOIN verificador_instancia ON inst_verificador=ver_inst_id LEFT JOIN mensajes ON inst_mensaje=msj_id WHERE inst_indice=$1 and inst_flujo_id=$2';//Consulta query para extraer las instancias,sus mensaje y sus mensajes
        const values = [index,flow_id];//Paso de parametros a query
        let response=await client.query(queryText, values);//LLamado a funcion consulta
        if(response.rowCount==1){//si hay resultado de la consulta se retorna,caso de multiples o ninguna se retorna arreglo vacio
            return [response.rows[0]]
        }else{
            if(response.rowCount==0){
                return []
            }else{
                return response.rows
            }
        }
      } catch (error) {//Visualizacion de errores
        logger.log("error","Error al consultar instancias")
        logger.log("error",error)
        console.log(error)
        return {status:"Error",data:error}
      }
}

async function connectDB(){//Funcion para la conexion a la BD
    client= new Client(dbConfig);
    try {
        await client.connect();            
        logger.log("info", "Conexion creada DB");
        return {status:"OK",data:"Creada la conexion a BD"}
    } catch (error) {
        logger.log("info","error en conexion db")
        logger.log("error", error);
        console.log(error)
        return {status:"Error",data:error}
    }
}

function listOptions(array){//Funcion para listar opciones de entrada
    let list="\n"
    for(let i=0;i<array.length;i++){
        list+=(i+1).toString()
        list+=" "
        list+=array[i].toString()
        list+="\n"
    }    
    return list
}

async function getToken(){//Funcion para autenticacion para API
    var res= await axios.post(APIurl+"auth/login",{
        "lgn_userName": "api_fbt_ktmec",
        "lgn_password": "11botKtm2023",
        "lgn_dominio": "racingmoto"
    })
    .then(function (response) {//Retorno de respuesta de API
        return response.data.token
        
    })
    .catch(function(error){//Visualizacion de errores
        logger.log("error","Error al obtener token")
        logger.log("error",error)
        console.log(error)
        return "Error al logearse "+error
    })
    return res
}

async function consultCities(token_auth){//Funcion para la conuslta de ciudades con agencias
    var res= await axios.get(APIurl+"leads/ciudades",{headers: {
        Authorization: "Bearer ".concat(token_auth)//Adicion de token a solicitud http
    }})
    .then(function (response) {
        return response.data//Retorno de respuesta API
    })
    .catch(function(error){//Visualizacion de errores
        logger.log("error","Error al consultar ciudades")
        logger.log("error",error)
        console.log(error)
        return "Error al consultar ciudades "+error
    })
    return res
}

async function consultAgencies(city,token_auth){//Funcion para la consulta de agencias por ciudad API
    var res= await axios.get(APIurl+"leads/concesionarios?cod_ciudad="+city,{headers: {
        Authorization: "Bearer ".concat(token_auth)//Adicion de token a solicitud http
    }})
    .then(function (response) {
        return response.data//Retorno de respuesta API
    })
    .catch(function(error){//Visualizacion de errores
        logger.log("error","Error al consultar agencias")
        logger.log("error",error)
        console.log(error)
        return "Error al consultar agencias de ciudad "+error
    })
    return res
}

async function consultTypeVehicule(token_auth,emp){//Funcion de consulta de tipo de vehiculos mediante codigo de empresa
    var res= await axios.get(APIurl+"shared/getCategoriesByBrand/"+emp.emp_codigo,{headers: {
        Authorization: "Bearer ".concat(token_auth)//Adicion de token a solicitud http
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){//Visualizacion de errores
        logger.log("error","Error al consultar vehiculos")
        logger.log("error",error)
        console.log(error)
        return "Error al consultar tipo de vehiculos "+error
    })
    return res
}

async function consultModels(vehicule,token_auth){//Funcion para consulta de modelos   
    var res= await axios.get(APIurl+"shared/getModelsByCategory/"+vehicule,{headers: {
        Authorization: "Bearer ".concat(token_auth)//Adicion de token a solicitud http
    }})
    .then(function (response) {//Retorno de valores de Consulta API
        return response.data
    })
    .catch(function(error){//Visualizacion de errores
        logger.log("error","Error al consultar modelos")
        logger.log("error",error)
        console.log(error)
        return "Error al consultar modelos "+error
    })
    return res
}

async function consultBuyTimes(token_auth){//Funcion para consulta de tiempos de compra
    var res= await axios.get(APIurl+"leads/surveys",{headers: {
        Authorization: "Bearer ".concat(token_auth)//Adicion de token a solicitud http
    }})
    .then(function (response) {//Retorno de respuesta API
        return response.data
    })
    .catch(function(error){//Visualizacion de errores
        logger.log("error","Error al consultar tiempo de compra")
        logger.log("error",error)
        console.log(error)
        return "Error al consultar tiempos de compras "+error
    })
    return res
}

async function saveNewLead(user,conv,token){//Funcion para guardado de lead
    consult= await consultBuyTimes(token)            
    let optionName=consult.map((object)=>object.options)            
    let nombre =optionName[0].filter((object)=>object.id==conv.conv_tiempo_compra)
    var res= await axios.post(APIurl+"leads_web/new_lead",{
        origen:"fcb",
        plataforma: "whatsapp bot",
        cod_tipo_documento:user[0].usu_opcion_identificador==true?0:1,
        identificacion:user[0].usu_identificacion,
        nombres:user[0].usu_nombre,
        telefono:conv.conv_celular,
        email:user[0].usu_correo,        
        acepta:user[0].usu_term_acept==true?"SI":"NO",
        cod_ciudad:user[0].usu_ciudad,
        cod_tipo_vehiculo:conv.conv_tipo_moto,
        cod_modelo:conv.conv_moto,
        estado_civil:user[0].usu_estado_civil,
        anio_motocicleta:conv.conv_moto_anio,
        ciudad_cliente:conv.conv_ciudad,
        survey:{
            lsp_codigo: 7,
            lsp_pregunta: "¿Cuando planeas comprar tu vehículo?",
            options: [
                {
                  id: nombre[0].id,
                  name: nombre[0].name
                }
              ]
            }
    },
        {headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        logger.log("error","Error al guardar lead")
        logger.log("error",error)
        console.log(error)
        return "Error al guardar lead"
    })
    console.log(res)
    return res
}

async function APIsendmail(token,obj){//Funcion para enviar mail API
    var res= await axios.post(APIurl+"mail/sendmail",obj,{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        logger.log("error", "Error al enviar email");
        logger.log("error", error);
        console.log(error)
        return "Error enviar mail "+error
    })
    return res
}

async function navInstance(cell_number,comp_cell_number,lowmsg,emp,user,conv){//Funcion para navegacion de instancias
    let msgAnt=""
    let listOpc=""
    let consult,names,codes,token,years//Declaracion de variables mensaje anterior, listado de opciones, consulta, nombre, codigos, token de seguridad, año de moto
    if(user.length==0){//Si no existe el usuario se crea tanto el usuario cmo la conversacion
        user=await createUserCellOnly(cell_number,emp.emp_id)//Creacion usuario
        conv=await createConversation(user,1,false)//Creacion conversacion
    }else{//Caso contratrio solo se crea una conversacion,siempre y cuando no este definida
        if(conv==undefined){
            conv =await consultConvesationbyUser(user[0].usu_id)           
        }
    }    
    let flow= await consultFlowbyComp(emp.emp_id)//Consulta de flujo
    instances= await consultInstancesbyIndex(flow.flu_id,conv.conv_indice_flujo)//Consulta de instancias de flujo
        if(instances.length>0){//Si hay instancias
            for(let i=0;i<instances.length;i++){  //Bucle para recorrido de instancias              
                let conditions=JSON.parse(instances[i].inst_condicion)//Lectura y asignacion de condiciones desde la BD
                if(instances[i].inst_consulta!=null){//En caso que sea necesario consu7ltar informacion desde API
                    token = await getToken()//Obtencion del token
                    switch(instances[i].inst_consulta){//Casos de consulta de API
                        case "Ciudad":                            
                            consult = await consultCities(token)//Se obtienen las ciudades
                            names=consult.map((object) => object.nombre)//Se asignan los nombres a arreglo
                            codes=consult.map((object) => object.codigo)//Se asignan los codigos a arreglo
                            listOpc=listOptions(names)//Llamado a listado de nombres de ciudades
                        break;
                        case "Sucursal":
                            consult=await consultAgencies(user[0].usu_ciudad,token)//Se obtienen las agencias
                            if(consult.length==0){
                                lowmsg=conditions                                
                            }else{
                                names=consult.map((object) => object.vitrina)//Se asignan los nombres a arreglo
                                codes=consult.map((object) => object.emp_codigo)//Se asignan los codigos a arreglo
                                listOpc=listOptions(names)//Llamado a listado de nombres de ciudades
                            }
                        break;
                        case "Categoria":
                            consult=await consultTypeVehicule(token,emp)//Se obtiene las categorias de vehiculos
                            if(consult.length==0){
                                lowmsg=conditions                                
                            }else{
                                names=consult.map((object) => object.cve_nombre)//Se asignan los nombres a arreglo
                                codes=consult.map((object) => object.cat_vehiculo)//Se asignan los codigos a arreglo
                                listOpc=listOptions(names)//Llamado a listado de nombres de ciudades
                            }
                        break;
                        case "Producto":
                            consult=await consultModels(conv.conv_tipo_moto,token)//Se obtiene los modelos de productos
                            if(consult.length==0){
                                lowmsg=conditions
                            }else{
                                names=consult.map((object) => object.nombre_modelo+" "+object.anio_modelo)//Se asignan los nombres a arreglo, nombre de moto mas año
                                codes=consult.map((object) => object.cod_modelo)//Se asignan los codigos a arreglo
                                years=consult.map((object) => object.anio_modelo)//Se asignan los años a arreglo
                                listOpc=listOptions(names)//Llamado a listado de nombres de ciudades                                
                            }                            
                        break;
                        case "TiempoCom":
                            consult=await consultBuyTimes(token)//Se obtiene los tiempos de compra
                            if(consult.length==0){
                                lowmsg=conditions
                            }else{
                                consult= await consultBuyTimes(token)        
                                let options= consult.filter((object)=>object.lsp_codigo==9)//Se filtran las preguntas para unicamente mostrar el tiempo de compra
                                options=options.map((object)=> object.options)//Se filtran als opciones de la pregunta
                                names=options[0].map((objeto) => objeto.name)//Se asignan los nombres a arreglo
                                codes=options[0].map((objeto) => objeto.id)//Se asignan los codigos a arreglo
                                listOpc=listOptions(names)//Llamado a listado de nombres de ciudades
                            }                            
                        break;
                        case "Estado Civil":
                            codes=["Soltero","Casado","Divorciado","Viudo"]//Asignacion de opciones de estado civil                            
                        break;
                        case "Metodo Pago":
                            codes=["Contado","Crédito","Moto por parte de pago y crédito","Moto por parte de pago y la diferencia al contado"]//Asignacion de opciones de metodo de pago
                        break;
                        case "Comprobacion"://Construnccion de mensaje de comprobacion de datos ingresados
                            listOpc+=user[0].usu_opcion_identificador?"Tipo de Identificacion: Cedula identidad\n":"Tipo de Identificacion: Cedula de Extranjeria o Pasaporte\n"
                            listOpc+="Identificacion: "+user[0].usu_identificador+"\n"
                            listOpc+="Nombre: "+user[0].usu_nombre+"\n"
                            if(user[0].usu_apellido!=null){
                                listOpc+="Apellido: "+user[0].usu_apellido+"\n"
                            }
                            listOpc+="Email: "+user[0].usu_correo+"\n"
                            if(user[0].usu_ciudad!=null){
                                consult= await consultCities(token)
                                let nameCity=consult.filter((object)=>object.codigo==user[0].usu_ciudad)            
                                nameCity=user.usu_ciudad==0?conv.conv_ciudad:nameCity[0].nombre
                                listOpc+="Ciudad: "+nameCity+"\n"
                            }                
                            if(conv.conv_tipo_moto!=null){
                                consult= await consultTypeVehicule(token,emp)
                                let nameType=consult.filter((object)=>object.cat_vehiculo==conv.conv_tipo_moto)
                                listOpc+="Tipo de vehiculo: "+nameType[0].cve_nombre+"\n"
                            }                
                
                            if(conv.conv_moto!=null){
                                consult= await consultModels(conv.conv_tipo_moto,token)
                                let nameModel=consult.filter((object)=>object.cod_modelo==conv.conv_moto)
                                listOpc+="Modelo: "+nameModel[0].nombre_modelo+"\n"
                                listOpc+="Año: "+nameModel[0].anio_modelo+"\n"
                            }
                
                            if(conv.conv_tiempo_compra!=null){
                                consult= await consultBuyTimes(token)
                                let optionName=consult.filter((object)=>object.lsp_codigo==9)
                                optionName=optionName.map((object)=>object.options)                    
                                let nombre =optionName[0].filter((object)=>object.id==conv.conv_tiempo_compra)
                                listOpc+="Opcion de compra: "+nombre[0].name+"\n"
                            }

                            if(conv.conv_metodo_pago!=null){
                                listOpc+="Método de pago: "+conv.conv_metodo_pago+"\n"
                            }
                
                            listOpc+="Son correctos Si o No"
                        break;
                    }
                }
                if(conv.conv_mutable){//Pregunta si esta en mode mensaje o recepcion
                    try{//Asignacion de las opciones de codigos a condiciones de verificacion de instancia
                        for(let c=1;c<=codes.length;c++){
                            conditions.push(c)
                        }
                    }catch{
                        console.log("Sin opciones que agregar")
                    }
                    if(conditions.includes("OK")){//Si la condicion de aprobacion de la instancia es OK, se asginan a las condiciones de aprobacion el mensaje enviado
                        conditions.push(lowmsg)
                    }                    
                    let regex=new RegExp(instances[i].ver_inst_regex)//Lectura y creacion de expresion regular desde BD
                    let nummsg=0
                    try{
                        nummsg=Number(lowmsg)//Asignacion de numero de mensaje,si es posible
                    }catch{
                        console.log("No se puede convertir a valor")
                    }
                    /*
                        Si el mensaje aprueba la expresion regular o no tiene un verificador, y las condiciones estan inculidas en la instancia
                    */
                    if((regex.test(lowmsg) || instances[i].inst_verificador==null) && (conditions.includes(lowmsg) || conditions.includes(nummsg))){
                        conv.conv_mutable=false//Cambio de estado de conversacion a mostrar mensaje
                        conv.conv_indice_flujo=instances[i].inst_hijo//Se asgina al siguiente indice de flujo dentro de la conversacion
                        let mod_user=JSON.parse(instances[i].inst_usu_mod)//Se obtienen los campos a modificar en el usuario
                        if(mod_user.length>0){//Si hay campos a modificar
                            for(let j=0;j<mod_user.length;j++){
                                if(lowmsg=="si"){//Si el mensaje es "si" se asigna true en campo                                
                                    user[0][mod_user[j]]=true
                                }else{
                                    if(lowmsg=="no"){//Si el mensaje es no
                                        if(instances[i].inst_consulta=="Comprobacion"){//Si se esta comprobando la informacion,se eliminan los campos
                                            user[0][mod_user[j]]=null
                                        }else{
                                            user[0][mod_user[j]]=false//Se asgina falso
                                        }                                        
                                    }else{                                    
                                        if(codes!=undefined){//Si hubouna consulta desde API
                                            user[0][mod_user[j]]=codes[Number(lowmsg)-1]//Toma el valor del codigo de la opcion
                                        }else{
                                            user[0][mod_user[j]]=lowmsg//Se asgina el mensaje al campo
                                        }
                                    }
                                }
                            }                            
                            user=await modifyUserbyID(user[0])//Se modifica el usuario
                        }
                        let mod_conv=JSON.parse(instances[i].inst_conv_mod)//Se obtienen los campos a modificar en la conversacion
                        /*
                            Se realiza un proceso igual que con el usuario
                        */
                        if(mod_conv.length>0){
                            for(let k=0;k<mod_conv.length;k++){
                                if(lowmsg=="si"){
                                    conv[mod_conv[k]]=true
                                }else{
                                    if(lowmsg=="no"){
                                        if(instances[i].inst_consulta=="Comprobacion"){
                                            conv[mod_conv[k]]=null
                                        }else{
                                            conv[mod_conv[k]]=false
                                        }                                        
                                    }else{
                                        if(codes!=undefined){
                                            conv[mod_conv[k]]=codes[Number(lowmsg)-1]
                                            if(years!=undefined){
                                                conv["conv_moto_anio"]=years[Number(lowmsg)-1]
                                            }                                            
                                        }else{
                                            conv[mod_conv[k]]=lowmsg
                                        }
                                    }
                                }
                            }
                        }
                        conv=await modifyConversationbyID(conv)//Modificacion de conversacion
                        if(instances[i].inst_consulta!=null){//Acciones para finalizar la comversacion
                            switch(instances[i].inst_consulta){
                                case "FinalizarMensaje":
                                    conv=await finishConversation(conv.conv_id)
                                    await createConversation(user[0].usu_id,3,false)
                                break;
                                case "FinalizarDirecto":
                                    conv=await finishConversation(conv.conv_id)
                                    await createConversation(user[0].usu_id,3,true)
                                break;
                            }
                        }
                        let returnObj=await navInstance(cell_number,comp_cell_number,lowmsg,emp,user,conv)//Llamado recursivo a navegacion de instancias
                        return returnObj
                    }else{
                        //Si ninguna de las instancias tiene las condiciones que cuadren con el mensaje, se muestra un mensaje de invalida entrada
                        if(i==(instances.length-1)){
                            conv.conv_mutable=true
                            conv=await modifyConversationbyID(conv)
                            return ["❌ "+instances[i].inst_nombre+" no válido/a, inténtalo nuevamente 😄"]
                        }
                    }
                }else{                    
                    if(instances[i].inst_consulta!=null){//Acciones unicas de instancias sin mensajes; acciones de guardar lead o enviar correo 
                        let flow,ind_aux                                  
                        switch(instances[i].inst_consulta){//Diferentes casos de acciones
                            /*
                                Se obtiene el mensaje de la instancia, se procede a asginar a la conversacion elsiguiente indice y se muestran los mensajes de la priemra y segunda instancia
                            */
                            case "Lead"://Guardar lead
                                conv= await confirmConversation(conv.conv_id)
                                consult=await saveNewLead(user,conv,token)
                                msgAnt=clearMsg(instances[i].msj_contenido)
                                ind_aux=instances[i].inst_hijo                                
                                flow= await consultFlowbyComp(emp.emp_id)
                                instances= await consultInstancesbyIndex(flow.flu_id,ind_aux)
                                conv.conv_mutable=true
                                conv.conv_indice_flujo=ind_aux
                                conv= await modifyConversationbyID(conv)
                                return [msgAnt,clearMsg(instances[0].msj_contenido)]
                            break;
                            case "Correo"://Enviar correo
                                conv= await confirmConversation(conv.conv_id)
                                consult=await sendMail(user,conv,emp,token)
                                msgAnt=clearMsg(instances[i].msj_contenido)
                                ind_aux=instances[i].inst_hijo                                
                                flow= await consultFlowbyComp(emp.emp_id)
                                instances= await consultInstancesbyIndex(flow.flu_id,ind_aux)
                                conv.conv_mutable=true
                                conv.conv_indice_flujo=ind_aux
                                conv= await modifyConversationbyID(conv)
                                return [msgAnt,clearMsg(instances[0].msj_contenido)]
                            break;
                            case "Horario"://Visualizar horarios
                                conv= await confirmConversation(conv.conv_id)                                
                                msgAnt=clearMsg(instances[i].msj_contenido)
                                ind_aux=instances[i].inst_hijo                                
                                flow= await consultFlowbyComp(emp.emp_id)
                                instances= await consultInstancesbyIndex(flow.flu_id,ind_aux)
                                conv.conv_mutable=true
                                conv.conv_indice_flujo=ind_aux
                                conv= await modifyConversationbyID(conv)
                                return [msgAnt,clearMsg(instances[0].msj_contenido)]
                            break;
                            case "Ficha Tecnica"://ENvio de ficha tecnica
                                msgAnt=clearMsg(instances[i].msj_contenido)
                                ind_aux=instances[i].inst_hijo
                                conv.conv_indice_flujo=ind_aux
                                conv.conv_mutable=false
                                conv= await modifyConversationbyID(conv)
                                let objFt=await navInstance(cell_number,comp_cell_number,lowmsg,emp,user,conv)
                                return [msgAnt,objFt[0]]
                            break;
                            case "Catalogo"://Envio de link de catalogo
                                conv= await confirmConversation(conv.conv_id)
                                consult=await sendMail(user,conv,emp,token)
                                msgAnt=clearMsg(instances[i].msj_contenido)
                                ind_aux=instances[i].inst_hijo
                                flow= await consultFlowbyComp(emp.emp_id)
                                instances= await consultInstancesbyIndex(flow.flu_id,ind_aux)
                                conv.conv_mutable=true
                                conv.conv_indice_flujo=ind_aux
                                conv= await modifyConversationbyID(conv)
                                return [msgAnt,clearMsg(instances[0].msj_contenido)]
                            break;
                        }
                    }
                    conv.conv_mutable=true//Cambio de estadode conversacion a recepcion de opcion
                    conv=await modifyConversationbyID(conv)//Modificacion de conversacion
                    if(instances[i].msj_contenido!="Personalizable"){//Si no se trata de un mensaje personalizable(caso de categoria de motos)
                        return [msgAnt+"\n"+clearMsg(instances[i].msj_contenido)+"\n"+listOpc]
                    }else{
                        switch(emp.emp_nombre){//Mensaje por empresa
                            case 'KTM':
                                switch(Number(conv.conv_tipo_moto)){//Dependeiento de la categoria de la moto se muestran los mensajes
                                    case 14:
                                        return ["Desafía cualquier terreno con estas KTM 🔥 El X Country nunca será más apasionante como a bordo de estas increíbles KTM  💪🏻\n"+listOptions(names)]
                                    break;
                                    case 8:
                                        return ["No hay terreno complicado para las Enduro EXC 🔥​ Elige tu compañera para conquistar nuevos senderos 💪🏻\n"+listOptions(names)]
                                    break;
                                    case 9:
                                        return ["Si la adrenalina del Motocross es lo tuyo, puedes elegir entre estos modelos y estarás listo para la victoria 🏆​\n"+listOptions(names)]
                                    break;
                                    case 10:
                                        return ["Descubre emociones sin límites con nuestra gama de alta cilindrada. 🏍️\nElige el número de tu modelo y prepárate para sentir la potencia y adrenalina en cada rodada 🔥​\n"+listOptions(names)]
                                    break;
                                    case 11:
                                        return ["Si buscas una moto híbrida de calle, carretera incluso pista con la gama NAKED BIKE lo tienes todo 🔥​ Selecciona el número de tu preferencia.​\n"+listOptions(names)]
                                    break;
                                    case 12:
                                        return ["Si la velocidad está en tus venas es momento de sentirla al máximo con las RC 🏍️💨 Elige el número de tu modelo ideal, desata tu potencial y obtén la victoria🏆 \n"+listOptions(names)]
                                    break;
                                    case 13:
                                        return ["Descubre la sensación de libertad junto a las Adventure. 🏍️​ \nElige tu compañera de travesías y emocionantes ave\n"+listOptions(names)]
                                    break;
                                }
                            break;
                            case 'KAWASAKI':
                                switch(Number(conv.conv_tipo_moto)){//Dependeiento de la categoria de la moto se muestran los mensajes
                                    case 15:
                                        return ["Diseñadas para recorrer y conquistar las mejores rutas.\nEscoge tu próxima compañera de aventuras🔥 🏍️\n"+listOptions(names)]
                                    break;
                                    case 16:
                                        return ["Atrae todas las miradas, sienta la calidad y el estilo de esta gama 🔥\n"+listOptions(names)]
                                    break;
                                    case 17:
                                        return ["La adrenalina es lo tuyo, sé un ganador 🏆 elige tu próxima moto:\n"+listOptions(names)]
                                    break;
                                    case 18:
                                        return ["Velocidad al máximo, adrenalina en tus venas 🏍️​\n¡Te esperamos en la pista!\n"+listOptions(names)]
                                    break;
                                    case 19:
                                        return ["Estilo único que conquista miradas 🔥\n"+listOptions(names)]
                                    break;
                                    case 20:
                                        return ["Diseñados para resistir en los más arduos terrenos.\nSon tu mejor aliado para progresar.\n Escoge tu próximo camino al éxito:\n"+listOptions(names)]
                                    break;
                                    case 21:
                                        return ["Somos únicos en este segmento, no tenemos competencia. Sé un verdadero líder.\n"+listOptions(names)]
                                    break;
                                }
                            break;
                        }            
                    }
                    
                }
            }
        }else{
            console.log("vacio")//Caso que no hayan instancias
        }
}

/*
Funcion para iniciar navegacion desde el envio de mensaje
*/
async function navFlow(cell_number,comp_cell_number,msg){    
    let user,lowmsg,emp
    let DBresult=await connectDB()//conexion a DB
    if(DBresult.status=="Error"){
        return {status:"Error",data:DBresult.data}
    }
    emp = await consultCompanybynumber(comp_cell_number)//Consulta de empresa
    APIurl=emp.emp_url_consulta//Obtencion de URL de API por empresa
    lowmsg=msg.toString().toLowerCase().trim()//Tratado de mensaje
    user=await consultUserbyCellphone(cell_number,emp.emp_id)//Consulta de usuario por telefono
    let result= await navInstance(cell_number,comp_cell_number,lowmsg,emp,user,undefined)//Navegacion instancias
    client.end()//Cerradode conexion a DB
    return result
}

function clearMsg(content){//Limpieza de mensajes desde DB   
    return content.replaceAll("\\n","\n")
}

async function sendMail(user,conv,emp,token){//Funcion para envio de mails    
    let content = fs.readFileSync('src/templates/template.html', 'utf-8');//Lectura de formato de mail
    let $ = cheerio.load(content);//Uso de libreria para cambios en html
    let changes,asunto
    let banner
    //Asginacion de banner por empresa
    switch(emp.emp_nombre){
        case "KTM":
            banner='<img src="https://ktm.curbe.com.ec/assets/curbe-logo.png" alt="" style="width:100%;height:100%;padding-top:39px" tabindex="0"></img>'
        break;
        case "KAWASAKI":
            banner='<img src="https://public.alexastudillo.com/logoKWSK.png" alt="" style="width:100%;height:100%;padding-top:39px" tabindex="0"></img>'
        break;
    }
    switch(Number(conv.conv_princ_menu_opc)){//Caso de selecion de opcion en menu conversacion
        case 2:
            asunto='Nueva Solicitud de Repuestos '+emp.emp_nombre//Definicion de asunto
            //Asignacion de valores mediante uso de id en html
            changes = {'#empresa':emp.emp_nombre,
            '#SOLICITUD':asunto,
            '#INFO':'Repuestos',
            '#CANAL':'CANAL',
            '#MEDIO':'CHAT BOT',
            '#NOMBRES':user[0].usu_apellido==null?"<b>Nombre: </b>"+user[0].usu_nombre:"<b>Nombre y Apellido: </b>"+user[0].usu_nombre+" "+user[0].usu_apellido,
            '#CELULAR':"<b>Celular: </b>"+conv.conv_celular,
            '#CIUDAD':"<b>Ciudad: </b>"+conv.conv_ciudad,
            '#SUCURSAL':"<b>Sucursal: </b>"+conv.conv_sucursal,
            '#CEDULA':"<b>Cedula: </b>"+user[0].usu_identificador,
            '#CORREO':"<b>Correo: </b>"+user[0].usu_correo,
            '#TIPO_REPUESTO':"<b>Tipo de Repuesto requerido: </b>"+conv.conv_tipo_repuesto,
            '#PRODUCTO':"<b>Moto del repuesto: </b>"+conv.conv_moto,
            '#ANIO':"<b>Año del repuesto: </b>"+conv.conv_moto_anio,
            '#firmaempresa':emp.emp_nombre+" Ecuador",
            '#logoemp':banner
            }
        break;
        case 4:
            asunto='Nueva Solicitud de Accesorios '+emp.emp_nombre
            changes = {'#empresa':emp.emp_nombre,
            '#SOLICITUD':asunto,
            '#INFO':'Acesorios',
            '#CANAL':'CANAL',
            '#MEDIO':'CHAT BOT',
            '#NOMBRES':user[0].usu_apellido==null?"<b>Nombre: </b>"+user.usu_nombre:"<b>Nombre y Apellido: </b>"+user[0].usu_nombre+" "+user[0].usu_apellido,
            '#CELULAR':"<b>Celular: </b>"+conv.conv_celular,
            '#CIUDAD':"<b>Ciudad: </b>"+conv.conv_ciudad,
            '#SUCURSAL':"<b>Sucursal que desea ser atendido: </b>"+conv.conv_sucursal,
            '#firmaempresa':emp.emp_nombre+" Ecuador",
            '#logoemp':banner
        }
        break;
    }    
    for (let selector in changes) {//asignacion de valor por campo en html
        let newContent = changes[selector];
        $(selector).html(newContent);
    }
    let html=$.html()//Obtencion de string de html
    let obj={//COnstrucion de objeto a enviar por correo
        bodyHtml: html,
        asunto: asunto,
        to: [
          {
            email: emp.emp_correo,
            name: "Post Venta "+emp.emp_nombre
          }
        ]
      }    
    await APIsendmail(token,obj)//Consumo de API paraenviar mail
}

app.use(cors());

app.post('/getWhtspMsg', async (req, res) => {//Configuracion endpoint para mensajes 
    try{
        const jsonData = req.body;
        if (Object.keys(jsonData).length > 0) {
            let message=jsonData.message
            let number=jsonData.number
            let compNumber=jsonData.compNumber        
            let result= await navFlow(number,compNumber,message)            
            let whatspMsg={status:"200",message:"Ok",data:[]}
            for(let i=1;i<=result.length;i++){                
                whatspMsg.data.push({code:i,text:result[i-1]})
            }
            res.status(200).json(whatspMsg)
        } else {
            logger.log("error","Error JSON no válido")            
            res.status(500).json({error: 'Solicitud no contiene JSON válido'});
        }
    }catch(error){        
        logger.log("error",error.message)
        logger.log("error",error.stack)
        console.log(error)
        res.status(500).json({msg: error.message,stack:error.stack});
    }
})

app.listen(app.get('port'),()=>{
    console.log(`Server listening on port ${app.get('port')}`);
});