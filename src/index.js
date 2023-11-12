// var Application= require ('./class/Application')
// var user = require('./class/Client')
// var Motorcycle = require('./class/Motorcycle')

const express = require('express');
const morgan=require('morgan');
const axios=require('axios');
const { Pool,Client } = require('pg');
const APIurl=" https://desarrolloktm.curbe.com.ec/api/"

const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'KTM',
    password: 'P05Tclave',
    port: 5432 
};

async function createUserCellOnly(cell_number) {
    const client = new Client(dbConfig);
    try {      
      await client.connect();        
      const queryText = 'INSERT INTO usuario (usu_celular) VALUES ($1) RETURNING usu_id';
      const values = [cell_number];
      let response=await client.query(queryText, values);
      return {status:"OK",data:response.rows[0].usu_id}
    } catch (error) {      
      return {status:"Error",data:error}
    } finally {      
        client.end();
    }
}

async function modifyUserbyCell(usu_lst_nm,usu_city,usu_mail,usu_id,usu_name,usu_opt_id,usu_term_acept,usu_cell){
    const client = new Client(dbConfig);
    try {
        await client.connect();
        const uploadFields = {
            usu_nombre: usu_name,
            usu_apellido: usu_lst_nm,
            usu_ciudad:usu_city,
            usu_correo:usu_mail,
            usu_identificador:usu_id,
            usu_opcion_identificador:usu_opt_id,
            usu_term_acept:usu_term_acept
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
            WHERE usu_celular ='`+usu_cell+`'
            RETURNING usu_id;
        `;        
        const result = await client.query(query,values);
        if (result.rowCount>0) {            
            return {status:"OK",data:result.rows[0].usu_id}
        } else {            
            return {status:"Error",data:"Ningún registro fue actualizado."}
        }
    } catch (error) {        
        return {status:"Error",data:error}
    }
}

async function modifyConversationbyID(conv_id,conv_princ_menu,conv_branch,conv_product,conv_type_refill,conv_mot_year,conv_mot_type,conv_city,conv_mutable,conv_cellphone){
    const client = new Client(dbConfig);
    try {
        await client.connect();
        const uploadFields = {            
            conv_princ_menu_opc:conv_princ_menu,
            conv_sucursal:conv_branch,
            conv_moto:conv_product,
            conv_tipo_repuesto:conv_type_refill,
            conv_moto_anio:conv_mot_year,
            conv_celular:conv_cellphone,
            conv_tipo_moto:conv_mot_type,
            conv_ciudad:conv_city,
            conv_mutable:conv_mutable

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
            return {status:"OK",data:result.rows[0].usu_id}
        } else {            
            return {status:"Error",data:"Ningún registro fue actualizado."}
        }
    } catch (error) {        
        return {status:"Error",data:error}
    }
}

async function createConversation(user_id) {
    const client = new Client(dbConfig);  
    try {
      await client.connect();
      const now= new Date()
      const queryText = 'INSERT INTO conversacion (conv_usuario,conv_fecha) VALUES ($1,$2) RETURNING conv_id';
      const values = [user_id,now];
      let response=await client.query(queryText, values);            
      return {status:"OK",data:response.rows[0].conv_id}
    } catch (error) {      
      return {status:"Error",data:error}
    } finally {
      client.end();
    }
}

async function finishConversation(conv_id){
    const client = new Client(dbConfig);
    try {
        await client.connect();
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
            return {status:"OK",data:result.rows[0].usu_id}
        } else {            
            return {status:"Error",data:"Ningún registro fue actualizado."}
        }
    } catch (error) {        
        return {status:"Error",data:error}
    }
}

async function createMessage(conv_id,msg,flow_node,father_node) {
    const client = new Client(dbConfig);
    try {
      await client.connect();      
      const queryText = 'INSERT INTO mensaje (msj_contenido,msj_conv_id,msj_nodo_flujo,msj_flujo_padre) VALUES ($1,$2,$3,$4) RETURNING msj_id';
      const values = [msg,conv_id,flow_node,father_node];
      let response=await client.query(queryText, values);
      return {status:"OK",data:response.rows[0].msj_id}
    } catch (error) {      
      return {status:"Error",data:error}
    } finally {
        client.end();
    }
}

async function consultUserbyCellphone(number){    
    const client = new Client(dbConfig);
    try {
        await client.connect();      
        const queryText = 'SELECT * FROM usuario WHERE usu_celular=$1';
        const values = [number];
        let response=await client.query(queryText, values);
        if(response.rowCount==1){
            return {status:"Unique",data:response.rows[0]}
        }else{
            if(response.rowCount==0){
                return {status:"None",data:"Ningun registro"}
            }else{
                return {status:"Multiple",data:"Mas de un registro por celular"}
            }            
        }        
      } catch (error) {        
        return {status:"Error",data:error}
      } finally {
          client.end();
      }

}
async function consultConvesationbyUser(user){
    const client = new Client(dbConfig);
    try {
        await client.connect();      
        const queryText = 'SELECT * FROM conversacion WHERE conv_usuario=$1 and conv_finalizada=false';
        const values = [user];
        let response=await client.query(queryText, values);
        if(response.rowCount==1){
            return {status:"Unique",data:response.rows[0]}
        }else{
            if(response.rowCount==0){
                return {status:"None",data:"Ningun registro"}
            }else{
                return {status:"Multiple",data:"Mas de un registro por usuario"}
            }            
        }
      } catch (error) {        
        return {status:"Error",data:error}
      } finally {
          client.end();
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
const regexCellphone = /^\+(?:[0-9] ?){6,14}[0-9]$/;

let menu,sel_menu,token,consult,names,codes,result,user,conv,msg,lowmsg
let update=false

const app = express();
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2)
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

function listOptions(array){    
    let list=""
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
        return "Error al logearse"
    })
    return res
}

async function consultCities(){
    var res= await axios.get(APIurl+"leads/ciudades",{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar ciudades"
    })
    return res
}

async function consultAgencies(city){
    var res= await axios.get(APIurl+"leads/concesionarios?cod_ciudad="+city,{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar agencias de ciudad"
    })
    return res
}

async function consultTypeVehicule(city){
    var res= await axios.get(APIurl+"leads/tipos_veh",{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar tipo de vehiculos"
    })
    return res
}

async function consultModels(vehicule){    
    var res= await axios.get(APIurl+"leads/modelo_tipo_vehiculo?tipoVehiculo="+vehicule,{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar modelos"
    })
    return res
}

async function consultBuyTimes(version){
    var res= await axios.get(APIurl+"leads/surveys",{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar tiempos de compras"
    })
    return res
}

async function saveNewLead(lead){
    var res= await axios.post(APIurl+"leads_web/new_lead",{
        origen:"fcb",
        plataforma: "whatsapp bot",
        cod_tipo_documento:1,
        identificacion:"",
        nombres:"",
        telefono:"",
        email:"",
        calidad:"",
        //aceptar terminos y condiciones
        acepta:"",
        cod_ciudad:"",
        cod_tipo_vehiculo:"",
        cod_modelo:""        
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

async function validOptID(){
    let confirm
    if(user.data.usu_opcion_identificador==null){
        if(regexNumber.test(msg) && msg>0 && msg<3 && conv.data.conv_mutable){
            if(msg==1){
                confirm=await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_term_acept,true,user.data.usu_celular)
                user.data.usu_opcion_identificador=true
            }else{
                confirm=await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_term_acept,true,user.data.usu_celular)
                user.data.usu_opcion_identificador=false
            }            
            if(confirm.status=="OK"){                             
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,msg)
            }else{
                user.data.usu_opcion_identificador=null
            }
            return confirm
        }else{            
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,msg)
            return {status:"Msg",data:"Por favor ingresa el tipo de identificacion\n1. Cedula de ciudadania\n2. Cedula de extranjeria o Pasaporte"}
        }
    }
}

async function validID(){
    let confirm,flag    
    if(user.data.usu_identificador==null){
        flag=user.data.usu_opcion_identificador?(regexCedEc.test(msg) && conv.data.conv_mutable):(regexPasCol.test(msg) || regexPasEc.test(msg) || regexCedCol.test(msg)) && conv.data.conv_mutable
        confirm=flag
        ?
        await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,msg,user.data.usu_nombre,user.data.usu_term_acept,user.data.usu_opcion_identificador,user.data.usu_celular)
        :
        {status:"Msg",data:"Por favor ingrese su Documento de identificacion"}
        if(confirm.status=="OK"){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,msg)                
        }
        if(confirm.status=="Msg"){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,msg)
        }
        return confirm        
    }
}

async function validCellphone(){    
    if(conv.data.conv_celular==null){
        if(regexCellphone.test(msg) && conv.data.conv_mutable){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,msg)            
            return {status:"OK",data:""}            
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_celular)
            return {status:"Msg",data:"Por favor ingresa el numero de celular para ser contactado +593990000000"}
        }
    }
}

async function validMail(){    
    if(user.data.usu_correo==null){
        if(regexMail.test(msg) && conv.data.conv_mutable){
            await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,msg,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_celular)            
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,false,conv.data.conv_celular)
            return {status:"OK",data:""}
        }else{
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_celular)
            return {status:"Msg",data:"Por favor ingrese su correo"}
        }
    }
}

async function validCity(){
    if(user.data.usu_ciudad==null){
        consult= await consultCities()                    
        names=consult.map((objeto) => objeto.nombre)
        codes=consult.map((city) => city.codigo)
        if(regexNumbers.test(msg) && msg>0 && msg<=consult.length && !update){
            await modifyUserbyCell(user.data.usu_nombre,codes[msg-1],user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_celular)
            user.data.usu_ciudad=codes[msg-1]            
        }else{
            if(msg==consult.length && !update){
                await modifyUserbyCell(user.data.usu_nombre,0,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_celular)
                user.data.usu_ciudad=0
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_celular)
                return {status:"Msg",data:"En que ciudad te encuentras"}
            }else{
                await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,true,conv.data.conv_celular)
                return {status:"Msg",data:"Por favor selecciona la ciudad en la que se espera se le atienda:"+listOptions(names)}
            }
            
        }
    }

    if(user.data.usu_ciudad==0 && conv.data.conv_ciudad==null){
        if(regexOnlyName.test(msg) && !update){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,msg,conv.data.conv_celular)
            conv.data.conv_ciudad=msg
            update=true
        }else{
            update=false;
            return {msg:"Por favor ingrese el nombre de la ciudad en la que se encuentra"}
        }                
    }
}

async function validBranch(){
    if(conv.data.conv_sucursal==null){                
        consult=await consultAgencies(user.data.usu_ciudad)
        names=consult.map((objeto) => objeto.vitrina)
        codes=consult.map((city) => city.emp_codigo)
        if(regexNumbers.test(msg) && msg>0 && msg<=consult.length && !update){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,codes[msg-1],conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,conv.data.conv_celular)
            conv.data.conv_sucursal=codes[msg-1]
            update=true
        }else{
            update=false;
            return {msg:"Por favor selecciona la sucursal que se espera se le atienda:"+listOptions(names)}
        }
    }
}
async function validType(){
    if(conv.data.conv_tipo_moto==null){
        consult= await consultTypeVehicule()
        names=consult.map((objeto) => objeto.veh_nombre)
        codes=consult.map((city) => city.veh_codigo)
        if(regexNumber.test(msg) && msg>0 && msg<=consult.length && !update){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,codes[msg-1],conv.data.conv_ciudad,conv.data.conv_celular)
            conv.data.conv_tipo_moto=codes[msg-1]
            update=true
        }else{
            update=false;
            return {msg:"Por favor seleccione el tipo de moto de su interes:"+listOptions(names)}
        }
    }
}

async function validProduct(){
    if(conv.data.conv_moto==null){
        consult= await consultModels(conv.data.conv_tipo_moto)                    
        names=consult.map((objeto) => objeto.nombre)
        codes=consult.map((city) => city.cod_modelo)
        if(regexNumber.test(msg) && msg>0 && msg<=consult.length && !update ){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,codes[msg-1],conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,conv.data.conv_celular)
            conv.data.conv_moto=codes[msg-1]
            update=true
        }else{
            update=false;
            return {msg:"Por favor seleccione la moto de su interes:"+listOptions(names)}
        }
    }
}

async function navFlow(cell_number){
    token= await getToken()    
    lowmsg=msg.toLowerCase().trim()
    user=await consultUserbyCellphone(cell_number)    
    if(user.status=="None"){
        user=await createUserCellOnly(cell_number)        
        result=await createConversation(user.data)
        if(result.status=="OK"){            
            return {status:"Msg",data:"BIENVENIDO A KTM ECUADOR 🔥 ES UN GUSTO ASESORARTE EL DÍA DE HOY.👋​ Para continuar con la conversación, es necesario que aceptes nuestra política de Privacidad y protección de datos que puedes consultar en https://drive.google.com/file/d/10o4q28oMu6x-lAiSqCEYuLUpalK4ENXc/view Si deseas aceptarla escribe Sí"}
        }
    }
    conv =await consultConvesationbyUser(user.data.usu_id)    
    if(user.data.usu_term_acept==null){        
        if(lowmsg=="si"){
            await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,true,user.data.usu_celular)            
        }else{
            return {status:"Msg",data:"Permitenos la autorizacion, sino no podremos comunicarnos.Escribe si para aceptar "}
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
            await modifyUserbyCell(last_name,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,name,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_celular)
            update=true
        }else{
            update=false
            return {status:"Msg",data:"Por favor ingrese sus nombres [nombre apellido]"}
        }
    }    
    if(conv.data.conv_princ_menu_opc==null){
        if(regexNumber.test(msg) && msg>0 && msg<6){
            sel_menu=await modifyConversationbyID(conv.data.conv_id,msg,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,conv.data.conv_celular)
            menu=sel_menu.status=="OK"?msg:null            
        }else{            
            return {status:"Msg",data:"En que te podemos ayudar?\n1. Me interesa una moto\n2.Necesito Repuestos\n3.Tiendas y horarios\n4.Accesorios/Power Wear\n5.Asesor en linea"}    
        }
    }
    if(menu==undefined){
        menu=conv.data.conv_princ_menu_opc
    }
    let confirm
    switch(menu){
        case "1":
            confirm= await validOptID()
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:confirm.status,data:confirm.data}
            confirm =await validID()
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:confirm.status,data:confirm.data}            
            confirm =await validCellphone()
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:confirm.status,data:confirm.data}
            confirm =await validMail()
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:confirm.status,data:confirm.data}                
            confirm = await validCity()
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:confirm.status,data:confirm.data}                
            confirm = await validBranch()
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:confirm.status,data:confirm.data}                
            confirm = await validType()
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:confirm.status,data:confirm.data}
            confirm = await validProduct()
            if(confirm!=undefined && (confirm.status=="Erorr" || confirm.status=="Msg"))
                return {status:confirm.status,data:confirm.data}            
        break;
        case "2":
            if(user.data.usu_opcion_identificador==null){                   
                if(regexNumber.test(msg) && msg>0 && msg<3 && !update){
                    if(msg==1){
                        await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_term_acept,true,user.data.usu_celular)
                        user.data.usu_opcion_identificador=true
                        update=true
                    }else{                        
                        await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_term_acept,false,user.data.usu_celular)
                        user.data.usu_opcion_identificador=false
                        update=true
                    }
                }else{
                    update=false
                    return {msg:"Por favor ingresa el tipo de identificacion\n1. Cedula de ciudadania\n2. Cedula de extranjeria o Pasaporte"}
                }
            }
            if(user.data.usu_identificador==null){                    
                if(user.data.usu_opcion_identificador){
                    if(regexCedEc.test(msg) && !update){
                        await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,msg,user.data.usu_nombre,user.data.usu_term_acept,user.data.usu_opcion_identificador,user.data.usu_celular)
                        user.data.usu_identificador=msg
                        update=true
                    }else{
                        update=false
                        return {msg:"Por favor ingrese su cedula de ciudadania"}
                    }
                }else{
                    if((regexPasCol.test(msg) || regexPasEc.test(msg) || regexCedCol.test(msg)) && !update ){
                        await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,msg,user.data.usu_nombre,user.data.usu_term_acept,user.data.usu_opcion_identificador,user.data.usu_celular)
                        user.data.usu_identificador=msg
                        update=true
                    }else{
                        update=false
                        return {msg:"Por favor ingrese su cedula de extranjeria o pasaporte"}
                    }
                }
            }
            if(conv.data.conv_celular==null){
                if(regexCellphone.test(msg) && !update){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,msg)
                    conv.data.conv_celular=msg
                    update=true
                }else{
                    update=false
                    return {msg:"Por favor ingresa el numero de celular para ser contactado +593990000000"}
                }
            }
            if(user.data.usu_correo==null){
                if(regexMail.test(msg) && !update){
                    await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,msg,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_celular)
                    user.data.usu_correo=msg
                    update=true;
                }else{
                    update=false;
                    return {msg:"Por favor ingrese su correo"}
                }
            }                            
            if(user.data.usu_ciudad==null){
                consult= await consultCities()                    
                names=consult.map((objeto) => objeto.nombre)
                codes=consult.map((city) => city.codigo)
                if(regexNumbers.test(msg) && msg>0 && msg<=consult.length && !update){
                    await modifyUserbyCell(user.data.usu_nombre,codes[msg-1],user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_celular)
                    user.data.usu_ciudad=codes[msg-1]
                    update=true
                }else{                        
                    update=false;
                    return {msg:"Por favor selecciona la ciudad en la que se espera se le atienda:"+listOptions(names)}
                }
            }            
            if(conv.data.conv_sucursal==null){                
                consult=await consultAgencies(user.data.usu_ciudad)
                names=consult.map((objeto) => objeto.vitrina)
                codes=consult.map((city) => city.emp_codigo)
                if(regexNumbers.test(msg) && msg>0 && msg<=consult.length && !update){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,codes[msg-1],conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,conv.data.conv_celular)
                    conv.data.conv_sucursal=codes[msg-1]
                    update=true
                }else{
                    update=false;
                    return {msg:"Por favor selecciona la sucursal que se espera se le atienda:"+listOptions(names)}
                }
            }            
            if(conv.data.conv_tipo_moto==null){
                consult= await consultTypeVehicule()
                names=consult.map((objeto) => objeto.veh_nombre)
                codes=consult.map((city) => city.veh_codigo)
                if(regexNumber.test(msg) && msg>0 && msg<=consult.length && !update){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,codes[msg-1],conv.data.conv_celular)
                    conv.data.conv_tipo_moto=codes[msg-1]
                    update=true
                }else{
                    update=false;
                    return {msg:"Por favor seleccione el tipo de moto para el repuesto:"+listOptions(names)}
                }
            }            
            if(conv.data.conv_moto==null){
                consult= await consultModels(conv.data.conv_tipo_moto)                    
                names=consult.map((objeto) => objeto.nombre)
                codes=consult.map((city) => city.cod_modelo)
                if(regexNumber.test(msg) && msg>0 && msg<=consult.length && !update ){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,codes[msg-1],conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,conv.data.conv_celular)
                    conv.data.conv_moto=codes[msg-1]
                    update=true
                }else{
                    update=false;
                    return {msg:"Por favor seleccione la moto de la que se forma parte el repuesto:"+listOptions(names)}
                }
            }
            if(conv.data.conv_moto_anio==null){                
                if(regexAnio.test(msg) && !update ){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,msg,conv.data.conv_tipo_moto,conv.data.conv_ciudad,conv.data.conv_celular)
                    conv.data.conv_moto_anio=msg
                    update=true
                }else{
                    update=false;
                    return {msg:"Por favor seleccione la moto de la que se forma parte el repuesto:"+listOptions(names)}
                }
            }
            if(conv.data.conv_tipo_repuesto==null){                
                if(regexOnlyName.test(msg) && !update ){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,msg,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,conv.data.conv_celular)
                    conv.data.conv_tipo_repuesto=msg
                    update=true
                }else{
                    update=false;
                    return {msg:"Por favor seleccione la moto de la que se forma parte el repuesto:"+listOptions(names)}
                }
            }
        break;
        case "3":
            let agencies="Estamos ubicados en:\n "
            consult= await consultCities()
            names=consult.map((objeto) => objeto.nombre)
            codes=consult.map((city) => city.codigo)
            for(let i=0;i<names.length;i++){
                agencies+="\t"+names[i]+"\n "
                let agency=await consultAgencies(codes[i])
                let directions=agency.map((city) => city.direccion)
                for(let j=0;j<directions.length;j++){
                    agencies+="\t\t"+directions[j]+"\n "
                }
            }
            return {msg:agencies}
        break;
        case "4":            
            if(conv.data.conv_celular==null){
                if(regexCellphone.test(msg) && !update){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,msg)
                    conv.data.conv_celular=msg
                    update=true
                }else{
                    update=false
                    return {msg:"Por favor ingresa el numero de celular para ser contactado +593990000000"}
                }
            }            
            if(user.data.usu_ciudad==null){
                consult= await consultCities()                    
                names=consult.map((objeto) => objeto.nombre)
                codes=consult.map((city) => city.codigo)
                if(regexNumbers.test(msg) && msg>0 && msg<=consult.length && !update){
                    await modifyUserbyCell(user.data.usu_nombre,codes[msg-1],user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_celular)
                    user.data.usu_ciudad=codes[msg-1]
                    update=true
                }else{                        
                    update=false;
                    return {msg:"Por favor selecciona la ciudad en la que se espera se le atienda:"+listOptions(names)}
                }
            }            
            if(conv.data.conv_sucursal==null){                
                consult=await consultAgencies(user.data.usu_ciudad)
                names=consult.map((objeto) => objeto.vitrina)
                codes=consult.map((city) => city.emp_codigo)
                if(regexNumbers.test(msg) && msg>0 && msg<=consult.length && !update){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,codes[msg-1],conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,conv.data.conv_celular)
                    conv.data.conv_sucursal=codes[msg-1]
                    update=true
                }else{
                    update=false;
                    return {msg:"Por favor selecciona la sucursal que se espera se le atienda:"+listOptions(names)}
                }
            }
            return {msg:"El catalago esta disponible en: https://drive.google.com/file/d/12dYoeExF5s2NraHYZ2iplbI9ddgqYT28/view?usp=sharing"}
        break;
        case "5":
            if(conv.data.conv_celular==null){
                if(regexCellphone.test(msg) && !update){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,msg)
                    conv.data.conv_celular=msg
                    update=true
                }else{
                    update=false
                    return {msg:"Por favor ingresa el numero de celular para ser contactado +593990000000"}
                }
            }
            if(user.data.usu_opcion_identificador==null){                   
                if(regexNumber.test(msg) && msg>0 && msg<3 && !update){
                    if(msg==1){
                        await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_term_acept,true,user.data.usu_celular)
                        user.data.usu_opcion_identificador=true
                        update=true
                    }else{                        
                        await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_term_acept,false,user.data.usu_celular)
                        user.data.usu_opcion_identificador=false
                        update=true
                    }
                }else{
                    update=false
                    return {msg:"Por favor ingresa el tipo de identificacion\n1. Cedula de ciudadania\n2. Cedula de extranjeria o Pasaporte"}
                }
            }
            if(user.data.usu_identificador==null){                    
                if(user.data.usu_opcion_identificador){
                    if(regexCedEc.test(msg) && !update){
                        await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,msg,user.data.usu_nombre,user.data.usu_term_acept,user.data.usu_opcion_identificador,user.data.usu_celular)
                        user.data.usu_identificador=msg
                        update=true
                    }else{
                        update=false
                        return {msg:"Por favor ingrese su cedula de ciudadania"}
                    }
                }else{
                    if((regexPasCol.test(msg) || regexPasEc.test(msg) || regexCedCol.test(msg)) && !update ){
                        await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,user.data.usu_correo,msg,user.data.usu_nombre,user.data.usu_term_acept,user.data.usu_opcion_identificador,user.data.usu_celular)
                        user.data.usu_identificador=msg
                        update=true
                    }else{
                        update=false
                        return {msg:"Por favor ingrese su cedula de extranjeria o pasaporte"}
                    }
                }
            }           
            if(user.data.usu_correo==null){
                if(regexMail.test(msg) && !update){
                    await modifyUserbyCell(user.data.usu_apellido,user.data.usu_ciudad,msg,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_celular)
                    user.data.usu_correo=msg
                    update=true;
                }else{
                    update=false;
                    return {msg:"Por favor ingrese su correo"}
                }
            }                            
            if(user.data.usu_ciudad==null){
                consult= await consultCities()                    
                names=consult.map((objeto) => objeto.nombre)
                codes=consult.map((city) => city.codigo)
                if(regexNumbers.test(msg) && msg>0 && msg<=consult.length && !update){
                    await modifyUserbyCell(user.data.usu_nombre,codes[msg-1],user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_celular)
                    user.data.usu_ciudad=codes[msg-1]
                    update=true
                }else{
                    if(msg==consult.length && !update){
                        await modifyUserbyCell(user.data.usu_nombre,0,user.data.usu_correo,user.data.usu_identificador,user.data.usu_nombre,user.data.usu_opcion_identificador,user.data.usu_term_acept,user.data.usu_celular)
                        user.data.usu_ciudad=0
                        update=false
                        return {msg:"En que ciudad te encuentras"}
                    }else{
                        update=false;
                        return {msg:"Por favor selecciona la ciudad en la que se espera se le atienda:"+listOptions(names)}
                    }
                    
                }
            }

            if(user.data.usu_ciudad==0 && conv.data.conv_ciudad==null){
                if(regexOnlyName.test(msg) && !update){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,msg,conv.data.conv_celular)
                    conv.data.conv_ciudad=msg
                    update=true
                }else{
                    update=false;
                    return {msg:"Por favor ingrese el nombre de la ciudad en la que se encuentra"}
                }                
            }

            if(conv.data.conv_sucursal==null){                
                consult=await consultAgencies(user.data.usu_ciudad)
                names=consult.map((objeto) => objeto.vitrina)
                codes=consult.map((city) => city.emp_codigo)
                if(regexNumbers.test(msg) && msg>0 && msg<=consult.length && !update){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,codes[msg-1],conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,conv.data.conv_celular)
                    conv.data.conv_sucursal=codes[msg-1]
                    update=true
                }else{
                    update=false;
                    return {msg:"Por favor selecciona la sucursal que se espera se le atienda:"+listOptions(names)}
                }
            }            
            if(conv.data.conv_tipo_moto==null){
                consult= await consultTypeVehicule()
                names=consult.map((objeto) => objeto.veh_nombre)
                codes=consult.map((city) => city.veh_codigo)
                if(regexNumber.test(msg) && msg>0 && msg<=consult.length && !update){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,conv.data.conv_moto,conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,codes[msg-1],conv.data.conv_ciudad,conv.data.conv_celular)
                    conv.data.conv_tipo_moto=codes[msg-1]
                    update=true
                }else{
                    update=false;
                    return {msg:"Por favor seleccione el tipo de moto de su interes:"+listOptions(names)}
                }
            }            
            if(conv.data.conv_moto==null){
                consult= await consultModels(conv.data.conv_tipo_moto)                    
                names=consult.map((objeto) => objeto.nombre)
                codes=consult.map((city) => city.cod_modelo)
                if(regexNumber.test(msg) && msg>0 && msg<=consult.length && !update ){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,codes[msg-1],conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,conv.data.conv_celular)
                    conv.data.conv_moto=codes[msg-1]
                    update=true
                }else{
                    update=false;
                    return {msg:"Por favor seleccione la moto de su interes:"+listOptions(names)}
                }
            }
            if(conv.data.tiempo_compra==null){
                consult= await consultBuyTimes(conv.data.conv_tipo_moto)
                let options=consult.map((objeto) => objeto.options)
                names=options.map((objeto) => objeto.nombre)
                codes=options.map((city) => city.cod_modelo)
                if(regexNumber.test(msg) && msg>0 && msg<=consult.length && !update ){
                    await modifyConversationbyID(conv.data.conv_id,conv.data.conv_princ_menu_opc,conv.data.conv_sucursal,codes[msg-1],conv.data.conv_tipo_repuesto,conv.data.conv_moto_anio,conv.data.conv_tipo_moto,conv.data.conv_ciudad,conv.data.conv_celular)
                    conv.data.conv_moto=codes[msg-1]
                    update=true
                }else{
                    update=false;
                    return {msg:"Por favor seleccione la moto de su interes:"+listOptions(names)}
                }
            }
            
        break;
    }    
    if(conv.data.conv_finalizada==false){
        if(lowmsg=="si" || lowmsg=="no"){
            if(lowmsg=="no"){
                await modifyUserbyCell(null,null,null,null,null,null,user.data.usu_term_acept,user.data.usu_celular)
            }else{
                await finishConversation(conv.data.conv_id)
                return {msg:"Hemos registrado tu información. En unos minutos un asesor te estará contactando.\n Si quieres regresar al menú principal escribe 1, Si quieres que un asesor se comunique contigo escribe 2"}
            }
        }else{
            let confirm="Por favor confirma tus datos:\n"
            if(user.data.usu_opcion_identificador){
                confirm+="Tipo de Documento:Cedula ciudadania\n"
            }else{
                confirm+="Tipo de Documento:Cedula de extranjeria o Pasaporte\n"
            }
            confirm+="Identificacion:"+user.data.usu_identificador+"\n"
            confirm+="Nombre:"+user.data.usu_nombre+"\n"
            confirm+="Apellido:"+user.data.usu_apellido+"\n"
            confirm+="Email:"+user.data.usu_correo+"\n"
            confirm+="Nombre:"+user.data.usu_nombre+"\n"
            
            confirm+="Ciudad:"+user.data.usu_nombre+"\n"
            confirm+="Tipo de vehiculo:"+user.data.usu_nombre+"\n"
            confirm+="Modelo:"+user.data.usu_nombre+"\n"
            confirm+="Opcion de compra:"+user.data.usu_nombre+"\n"

            confirm+="Son correctos Si o No"
            return {msg:confirm}
        }
    }else{
        if(regexNumber.test(msg) && msg>0 && msg<3){            
            if(msg==2){
                return {msg:"Perfecto, pronto un asesor se comunicará contigo."}
            }
            await createConversation(user.data)                        
            return {msg:"BIENVENIDO A KTM ECUADOR 🔥 ES UN GUSTO ASESORARTE EL DÍA DE HOY.👋​ Para continuar con la conversación, es necesario que aceptes nuestra política de Privacidad y protección de datos que puedes consultar en https://drive.google.com/file/d/10o4q28oMu6x-lAiSqCEYuLUpalK4ENXc/view Si deseas aceptarla escribe Sí"}
        }else{
            return {msg:"Si quieres regresar al menú principal escribe 1, Si quieres que un asesor se comunique contigo escribe 2"}
        }
    }
    
}

app.post('/getWhtspMsg', async (req, res) => {
    const jsonData = req.body;
    if (Object.keys(jsonData).length > 0) {
        let message=jsonData.message
        let number=jsonData.number
        msg=message
        let result= await navFlow(number)        
        res.status(200).json(result)
    } else {
    res.status(400).json({error: 'Solicitud no contiene JSON válido'});
    }
})

app.listen(app.get('port'),()=>{
    console.log(`Server listening on port ${app.get('port')}`);
});