const express = require('express');
const morgan=require('morgan');
const axios=require('axios');
var cors = require('cors');
const { Client,Pool } = require('pg');
const APIurl=" https://ktm.curbe.com.ec/api/"
const Reconnect = require('reconnect-core');
const fs = require('fs')
const cheerio = require('cheerio');
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

const app = express();
app.set('port', process.env.PORT || 8585);
app.set('json spaces', 2)
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

let client

/*const dbConfig = {
    user: process.env["User"],
    host: process.env["Host"],
    database: process.env["DB"],
    password: process.env["Paswd"],
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
};*/
const dbConfig = {
    user: 'postgres',
    host: 'database-1.c0oqa864nwep.us-west-2.rds.amazonaws.com',
    database: 'KTM',
    password: 'P05Tclave',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
};

async function createUserCellOnly(cell_number,comp_cell_number) {    
    try {
      const queryText = 'INSERT INTO usuario (usu_celular,usu_emp_id) VALUES ($1,$2) RETURNING usu_id';
      const values = [cell_number,comp_cell_number];
      let response=await client.query(queryText, values);      
      return response.rows[0].usu_id
    } catch (error) {
      return {status:"Error",data:error}
    }
}

async function modifyUserbyID(objClient){
    try {        
        const sets = [];
        const values= []
        for (const field in objClient) {
            if(field!="usu_celular"){
                sets.push(`${field} = $${sets.length + 1}`);
                values.push(objClient[field])
            }
        }
        const query = `
            UPDATE usuario 
            SET ${sets.join(', ')}
            WHERE usu_id ='`+objClient.usu_id.toString()+`'
            RETURNING *;
        `;        
        const result = await client.query(query,values);
        if (result.rowCount>0) {            
            return [result.rows[0]]
        } else {            
            return []
        }
    } catch (error) {        
        return {status:"Error",data:error}
    }
}

async function modifyConversationbyID(objConv){
    try {        
        const sets = [];
        const values= []
        for (const field in objConv) {
            sets.push(`${field} = $${sets.length + 1}`);
            values.push(objConv[field])
        }
        const query = `
            UPDATE conversacion 
            SET ${sets.join(', ')}
            WHERE conv_id =`+objConv.conv_id+`
            RETURNING *;
        `;        
        const result = await client.query(query,values);
        if (result.rowCount>0) {            
            return result.rows[0]
        } else {            
            return []
        }
    } catch (error) {        
        return {status:"Error",data:error}
    }
}

async function createConversation(user_id) {    
    try {
      const now= new Date()
      const queryText = 'INSERT INTO conversacion (conv_usuario,conv_fecha) VALUES ($1,$2) RETURNING *';
      const values = [user_id,now];
      let response=await client.query(queryText, values);            
      return response.rows[0]
    } catch (error) {      
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
            return result.rows[0].usu_id
        } else {            
            return []
        }
    } catch (error) {        
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
            return result.rows[0].usu_id
        } else {            
            return []
        }
    } catch (error) {        
        return {status:"Error",data:error}
    }
}

async function consultCompanybynumber(number){    
    try {  
        const queryText = 'SELECT * FROM empresa WHERE emp_celular=$1';
        const values = [number];
        let response=await client.query(queryText, values);
        if(response.rowCount==1){
            return response.rows[0]
        }else{
            if(response.rowCount==0){
                return []
            }else{
                return {status:"Multiple",data:"Mas de un registro por celular compania"}
            }            
        }        
      } catch (error) {        
        return {status:"Error",data:error}
      }

}

async function consultUserbyCellphone(number,emp_id){
    try {
        const queryText = 'SELECT * FROM usuario WHERE usu_celular=$1 and usu_emp_id=$2';
        const values = [number,emp_id];
        let response=await client.query(queryText, values);
        if(response.rowCount==1){
            return [response.rows[0]]
        }else{
            if(response.rowCount==0){
                return []
            }else{
                return {status:"Multiple",data:"Mas de un registro por celular"}
            }            
        }        
      } catch (error) {        
        return {status:"Error",data:error}
      }

}

async function consultConvesationbyUser(userID){    
    try {        
        const queryText = 'SELECT * FROM conversacion WHERE conv_usuario=$1 and conv_finalizada=false';
        const values = [userID];
        let response=await client.query(queryText, values);        
        if(response.rowCount==1){
            return response.rows[0]
        }else{
            if(response.rowCount==0){
                return []
            }else{
                return {status:"Multiple",data:"Mas de un registro por usuario"}
            }            
        }
      } catch (error) {        
        return {status:"Error",data:error}
      }
}

async function consultFlowbyComp(comp){
    try {
        const queryText = 'SELECT * FROM flujo WHERE flu_emp_id=$1';
        const values = [comp];
        let response=await client.query(queryText, values);
        if(response.rowCount==1){
            return response.rows[0]
        }else{
            if(response.rowCount==0){
                return []
            }else{
                return {status:"Multiple",data:"Mas de un registro por usuario"}
            }            
        }
      } catch (error) {        
        return {status:"Error",data:error}
      }
}

async function consultInstancesbyIndex(flow_id,index){
    try {
        const queryText = 'SELECT * FROM instancia INNER JOIN verificador_instancia ON inst_verificador=ver_inst_id INNER JOIN mensajes ON inst_mensaje=msj_id WHERE inst_indice=$1 and inst_flujo_id=$2';
        const values = [index,flow_id];
        let response=await client.query(queryText, values);
        if(response.rowCount==1){
            return [response.rows[0]]
        }else{
            if(response.rowCount==0){
                return []
            }else{
                return response.rows
            }
        }
      } catch (error) {
        return {status:"Error",data:error}
      }
}

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
        return "Error al logearse "+error
    })
    return res
}

async function consultCities(token_auth){
    var res= await axios.get(APIurl+"leads/ciudades",{headers: {
        Authorization: "Bearer ".concat(token_auth)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar ciudades "+error
    })
    return res
}

async function consultAgencies(city,token_auth){    
    var res= await axios.get(APIurl+"leads/concesionarios?cod_ciudad="+city,{headers: {
        Authorization: "Bearer ".concat(token_auth)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar agencias de ciudad "+error
    })
    return res
}

async function consultTypeVehicule(token_auth){
    var res= await axios.get(APIurl+"shared/getCategoriesByBrand/700",{headers: {
        Authorization: "Bearer ".concat(token_auth)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar tipo de vehiculos "+error
    })
    return res
}

async function consultModels(vehicule,token_auth){    
    var res= await axios.get(APIurl+"shared/getModelsByCategory/"+vehicule,{headers: {
        Authorization: "Bearer ".concat(token_auth)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar modelos "+error
    })
    return res
}

async function consultBuyTimes(token_auth){
    var res= await axios.get(APIurl+"leads/surveys",{headers: {
        Authorization: "Bearer ".concat(token_auth)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar tiempos de compras "+error
    })
    return res
}

async function saveNewLead(){    
    consult= await consultBuyTimes()            
    let optionName=consult.map((object)=>object.options)            
    let nombre =optionName[0].filter((object)=>object.id==conv.data.conv_tiempo_compra)
    var res= await axios.post(APIurl+"leads_web/new_lead",{
        origen:"fcb",
        plataforma: "whatsapp bot",        
        cod_tipo_documento:user.data.usu_opcion_identificador==true?0:1,
        identificacion:user.data.usu_identificacion,
        nombres:user.data.usu_nombre+" "+user.data.usu_apellido,
        telefono:conv.data.conv_celular,
        email:user.data.usu_correo,        
        acepta:user.data.usu_term_acept==true?"SI":"NO",
        cod_ciudad:user.data.usu_ciudad,
        cod_tipo_vehiculo:conv.data.conv_tipo_moto,
        cod_modelo:conv.data.conv_moto,
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
        return "Error al guardar lead"
    })
    return res
}

async function navInstance(cell_number,comp_cell_number,lowmsg,emp,user,conv){
    let msgAnt=""    
    let consult,names,codes,listOpc,token,years
    if(user.length==0){       
        user=await createUserCellOnly(cell_number,emp.emp_id)        
        conv=await createConversation(user)
    }else{
        if(conv==undefined){
            conv =await consultConvesationbyUser(user[0].usu_id)           
        }
    }    
    let flow= await consultFlowbyComp(emp.emp_id)
    instances= await consultInstancesbyIndex(flow.flu_id,conv.conv_indice_flujo)    
        if(instances.length>0){        
            for(let i=0;i<instances.length;i++){                
                let conditions=JSON.parse(instances[i].inst_condicion)                
                if(instances[i].inst_consulta!=null){
                    token = await getToken()                    
                    switch(instances[i].inst_consulta){
                        case "Ciudad":                            
                            consult = await consultCities(token)
                            names=consult.map((objeto) => objeto.nombre)
                            codes=consult.map((city) => city.codigo)
                            listOpc=listOptions(names)                            
                        break;
                        case "Sucursal":
                            consult=await consultAgencies(user[0].usu_ciudad,token)                            
                            if(consult.length==0){
                                lowmsg=conditions                                
                            }else{
                                names=consult.map((objeto) => objeto.vitrina)
                                codes=consult.map((city) => city.emp_codigo)
                                listOpc=listOptions(names)
                            }
                        break;
                        case "Categoria":
                            consult=await consultTypeVehicule(token)                            
                            if(consult.length==0){
                                lowmsg=conditions                                
                            }else{
                                names=consult.map((objeto) => objeto.cve_nombre)
                                codes=consult.map((city) => city.cat_vehiculo)
                                listOpc=listOptions(names)
                            }
                        break;
                        case "Producto":
                            consult=await consultModels(conv.conv_tipo_moto,token)                            
                            if(consult.length==0){
                                lowmsg=conditions
                            }else{
                                names=consult.map((objeto) => objeto.nombre_modelo+" "+objeto.anio_modelo)
                                codes=consult.map((city) => city.cod_modelo)
                                years=consult.map((city) => city.anio_modelo)
                                listOpc=listOptions(names)                                
                            }                            
                        break;
                    }
                    try{
                        for(let c=1;c<=codes.length;c++){
                            conditions.push(c)
                        }
                    }catch{
                        console.log("Sin opciones que agregar")
                    }                    
                }
                if(conv.conv_mutable){
                    if(conditions.includes("OK")){
                        conditions.push(lowmsg)
                    }                    
                    let regex=new RegExp(instances[i].ver_inst_regex)
                    let nummsg=0
                    try{
                        nummsg=Number(lowmsg)
                    }catch{
                        console.log("No se puede convertir a valor")
                    }                    
                    if(regex.test(lowmsg) && (conditions.includes(lowmsg) || conditions.includes(nummsg))){
                        conv.conv_mutable=false                        
                        conv.conv_indice_flujo=instances[i].inst_hijo
                        let mod_user=JSON.parse(instances[i].inst_usu_mod)
                        if(mod_user.length>0){
                            for(let j=0;j<mod_user.length;j++){
                                if(lowmsg=="si"){                                
                                    user[0][mod_user[j]]=true
                                }else{
                                    if(lowmsg=="no"){                                    
                                        user[0][mod_user[j]]=false                                    
                                    }else{                                    
                                        if(codes!=undefined){
                                            user[0][mod_user[j]]=codes[Number(lowmsg)-1]
                                        }else{
                                            user[0][mod_user[j]]=lowmsg
                                        }
                                    }
                                }
                            }                            
                            user=await modifyUserbyID(user[0])
                        }
                        let mod_conv=JSON.parse(instances[i].inst_conv_mod)
                        if(mod_conv.length>0){
                            for(let k=0;k<mod_conv.length;k++){
                                if(lowmsg=="si"){
                                    conv[mod_conv[k]]=true
                                }else{
                                    if(lowmsg=="no"){
                                        conv[mod_conv[k]]=false
                                    }else{
                                        if(codes!=undefined){
                                            conv[mod_conv[k]]=codes[Number(lowmsg)-1]
                                        }else{
                                            conv[mod_conv[k]]=lowmsg
                                        }
                                    }
                                }
                            }
                        }
                        conv=await modifyConversationbyID(conv)
                        
                        if(instances[i].inst_consulta!=null){
                            switch(instances[i].inst_consulta){                               
                                case "Sucursal":
                                    msgAnt=instances[i].msj_contenido                                    
                                break;
                                case "Categoria":                                    
                                    lowmsg=conv.conv_tipo_moto
                                break;
                            }
                        }

                        let returnObj=await navInstance(cell_number,comp_cell_number,lowmsg,emp,user,conv)                        
                        return returnObj
                    }else{                        
                        if(i==(instances.length-1)){
                            conv.conv_mutable=true
                            conv=await modifyConversationbyID(conv)
                            return {status:"Msg",data:"ingreso Invalido"}
                        }
                    }
                }else{                    
                    conv.conv_mutable=true
                    conv=await modifyConversationbyID(conv)
                    return {status:"Msg",data:msgAnt+"\n"+instances[i].msj_contenido+"\n"+listOpc}                                        
                }
            }
        }else{
            console.log("vacio")
        }
}

async function navFlow(cell_number,comp_cell_number,msg){    
    let user,lowmsg,emp
    let DBresult=await connectDB()
    if(DBresult.status=="Error"){
        return {status:"Error",data:DBresult.data}
    }
    emp = await consultCompanybynumber(comp_cell_number)
    lowmsg=msg.toString().toLowerCase().trim()
    user=await consultUserbyCellphone(cell_number,emp.emp_id)    
    let result= await navInstance(cell_number,comp_cell_number,lowmsg,emp,user,undefined)
    return result
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

app.use(cors());

app.post('/getWhtspMsg', async (req, res) => {
    try{
        const jsonData = req.body;
        if (Object.keys(jsonData).length > 0) {
            let message=jsonData.message
            let number=jsonData.number
            let compNumber=jsonData.compNumber        
            let result= await navFlow(number,compNumber,message)        
            res.status(200).json(result)
        } else {
            res.status(500).json({error: 'Solicitud no contiene JSON válido'});
        }
    }catch(error){
        res.status(500).json({error: error});
    }
})

app.listen(app.get('port'),()=>{
    console.log(`Server listening on port ${app.get('port')}`);
});