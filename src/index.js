var Application= require ('./class/Application')
var user = require('./class/Client')
var Motorcycle = require('./class/Motorcycle')

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
      console.log('Datos usuario insertados correctamente en la tabla.');
      return {status:"OK",data:response.rows[0].usu_id}
    } catch (error) {
      console.error('Error al insertar datos en la tabla:', error);
      return {status:"Error",data:error}
    } finally {      
        client.end();
    }
}

async function modifyUserbyCell(usu_lst_nm,usu_city,usu_mail,usu_id,usu_name,usu_cell){
    const client = new Client(dbConfig);
    try {
        await client.connect();
        const uploadFields = {
            usu_nombre: usu_name,
            usu_apellido: usu_lst_nm,
            usu_ciudad:usu_city,
            usu_correo:usu_mail,
            usu_identificador:usu_id
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
            console.log(`Registro actualizado:`, result);
            return {status:"OK",data:result.rows[0].usu_id}
        } else {
            console.log(`Ningún registro fue actualizado.`);
            return {status:"Error",data:"Ningún registro fue actualizado."}
        }
    } catch (error) {
        console.error('Error al actualizar el registro:', error);
        return {status:"Error",data:error}
    }
}

async function modifyConversationbyID(conv_id,conv_term,conv_princ_menu){
    const client = new Client(dbConfig);
    try {
        await client.connect();
        const uploadFields = {
            conv_term_acept: conv_term,
            conv_princ_menu_opc:conv_princ_menu
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
            console.log(`Registro actualizado:`, result);
            return {status:"OK",data:result.rows[0].usu_id}
        } else {
            console.log(`Ningún registro fue actualizado.`);
            return {status:"Error",data:"Ningún registro fue actualizado."}
        }
    } catch (error) {
        console.error('Error al actualizar el registro:', error);
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
      console.log('Datos conversacion insertados correctamente en la tabla.');
      return {status:"OK",data:response.rows[0].conv_id}
    } catch (error) {
      console.error('Error al insertar datos en la tabla:', error);
      return {status:"Error",data:error}
    } finally {
      client.end();
    }
}

async function createMessage(conv_id,msg,flow_node,father_node) {
    const client = new Client(dbConfig);
    try {
      await client.connect();      
      const queryText = 'INSERT INTO mensaje (msj_contenido,msj_conv_id,msj_nodo_flujo,msj_flujo_padre) VALUES ($1,$2,$3,$4) RETURNING msj_id';
      const values = [msg,conv_id,flow_node,father_node];
      let response=await client.query(queryText, values);      
      console.log('Datos mensaje insertados correctamente en la tabla.');
      return {status:"OK",data:response.rows[0].msj_id}
    } catch (error) {
      console.error('Error al insertar datos en la tabla:', error);
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
        console.error('Error al consultar usuario por numero de celular:', error);
        return {status:"Error",data:error}
      } finally {
          client.end();
      }

}
async function consultConvesationbyUser(user){
    const client = new Client(dbConfig);
    try {
        await client.connect();      
        const queryText = 'SELECT conv_id,conv_term_acept FROM conversacion WHERE conv_usuario=$1';
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
        console.error('Error al consultar conversacion por usuario:', error);
        return {status:"Error",data:error}
      } finally {
          client.end();
      }

}
async function consultUser(user){
    const client = new Client(dbConfig);
    try {
        await client.connect();      
        const queryText = 'SELECT conv_id,conv_term_acept FROM usuario WHERE usu_celular=$1';
        const values = [number];
        let response=await client.query(queryText, values);
        if(response.rowCount==1){
            return {status:"OK",data:[response.rows[0].conv_id,response.rows[0].conv_term_acept]}
        }else{
            return {status:"Error",data:"Mas de un registro por celular"}
        }
      } catch (error) {
        console.error('Error al consultar usuario por numero de celular:', error);
        return {status:"Error",data:error}
      } finally {
          client.end();
      }

}

const msgReturn="Si quieres regresar al menú principal escribe 1, Si quieres que un asesor se comunique contigo escribe 2"
const msgconsultant="Perfecto, pronto un asesor se comunicará contigo."
const msgBienvenida="BIENVENIDO A KTM ECUADOR 🔥 ES UN GUSTO ASESORARTE EL DÍA DE HOY.👋"
const msgAuth="AUTORIZACION TRATAMIENTO DE DATOS: \n Para continuar con la conversación, es necesario que aceptes nuestra política de Privacidad y protección de datos que puedes consultar en \n https://drive.google.com/file/d/10o4q28oMu6x-lAiSqCEYuLUpalK4ENXc/view"
const msgAuthAccept="Si deseas aceptarla escribe Sí. Si no deseas aceptarla escribe Salir"

const regexName= /^[A-Za-z]{3,}(\s[A-Za-z]{3,})?$/
const regexNumber= /[0-9]+/
const regexAnio= /[0-9]{4}/
const regexOnlyName= /^[A-Za-z]+/
const regexMail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const regexCedCol= /^[Ee]\d{6,10}$/
const regexCedEc= /^[0-9]{10}$/
const regexPasCol= /^[A-Z]{3}\d{6}$/
const regexPasEc= /^[A-Z]{3}\d{6}$/

const app = express();
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2)
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

let indexFlow=0;

//tipo de repuesto pendiente

async function consultSpareType(){
    var res= await axios.get(APIurl+"users")
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar tipo de repuesto"
    })
    return res
}

async function getToken(){

}


async function consultCities(){
    var res= await axios.get(APIurl+"leads/ciudades",{headers: {
        Authorization: "Bearer ".concat(sessionStorage.getItem('token'))
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
        Authorization: "Bearer ".concat(sessionStorage.getItem('token'))
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
        Authorization: "Bearer ".concat(sessionStorage.getItem('token'))
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
    var res= await axios.post(APIurl+"leads/modelo_tipo_vehiculo?tipoVehiculo="+vehicule,{headers: {
        Authorization: "Bearer ".concat(sessionStorage.getItem('token'))
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar modelos"
    })
    return res
}


async function consultYears(version){
    var res= await axios.post(APIurl+"products/get_years_version",{marca:700,codempresa:900,estado:0,codversion:version},{headers: {
        Authorization: "Bearer ".concat(sessionStorage.getItem('token'))
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar anios"
    })
    return res
}

async function consultBranch(version){
    var res= await axios.post(APIurl+"shared/get_agencies",{marca:700,codempresa:900,estado:0,codversion:version},{headers: {
        Authorization: "Bearer ".concat(sessionStorage.getItem('token'))
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar agencias"
    })
    return res
}

async function consultBuyTimes(version){
    var res= await axios.post(APIurl+"shared/get_agencies/get_purchase_times",{marca:700,estado:0},{headers: {
        Authorization: "Bearer ".concat(sessionStorage.getItem('token'))
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
        Authorization: "Bearer ".concat(sessionStorage.getItem('token'))
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al guardar lead"
    })
    return res
}

function listMenu(options){
    let msj=""
    for(let i;i>options.length;i++){
        msj+="\n "+options[i]
    }
    return msj
}

async function navFlow(msg,cell_number,flow_father){
    let result
    let lowmsg=msg.toLowerCase().trim()
    let user=await consultUserbyCellphone(cell_number)    
    if(user.status=="None"){
        user=await createUserCellOnly(cell_number)        
        result=await createConversation(user.data)
        if(result.status=="OK"){
            // Enviar mensaje de saludo y autorizacion            
            return {msg:"permintenos la autorizacion"}
        }
    }
    let conv =await consultConvesationbyUser(user.data.usu_id)    
    let accpet=conv.status=="Unique"?conv.data.conv_term_acept:false;
    if(!accpet){
        if(lowmsg!="si"){
            await modifyConversationbyID(conv.data.conv_id,true,null)
        }else{
            // Enviar autorizacion
            // return
            return {msg:"permitenos la autorizacion , sino no podremos comunicarnos"}
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
            await modifyUserbyCell(last_name,0,null,user.data.usu_id,name,user.data.usu_celular)
        }else{
            return {msg:"Por favor ingrese sus nombres [nombre apellido]"}
        }
    }    
    if(conv.data.conv_princ_menu_opc==null){
        return {msg:"En que te podemos ayudar?\n1. Me interesa una moto\n2.Necesito Repuestos\n3.Tiendas y horarios\n4.Accesorios/Power Wear\n5.Asesor en linea"}    
    }else{
        if(regexNumber.test(msg) && msg>0 && msg<6){
            await modifyConversationbyID(conv.data.conv_id,conv.data.conv_term_acept,msg)
        }
    }
    switch(msg){
        case 1:

        break;
        case 2:
        break;
        case 3:
        break;
        case 4:
        break;
        case 5:
        break;
        
    }

    switch(indexFlow){        
        case 2:
            if(regexName.test(msg)){
                if(/\s/.test(lowmsg)){
                    let names=lowmsg.split(" ")
                    indexFlow=3
                }else{

                }
            }
        break;
        case 3:
        if(regexNumber.test(msg) && msg>1 && msg<6 && msg!=3){
            indexFlow=4
        }else{
            //consultar agencias
            if(msg==3){

            }
        }
        break;
        case 5.1:
            if(regexNumber.test(msg) && msg>0 && msg<3){

            }else{

            }
        break;
        case 5.2:
            if(regexNumber.test(msg) && msg>0 && msg<3){

            }else{

            }
        break;
        case 5.21:
            if(regexCedEc.test(aux)){

            }else{

            }
        break;
        case 5.22:
            let aux=msg.replace(/[\s-]/g, '')
            if(regexCedCol.test(aux) || regexPasCol.test(aux) || regexPasEc.test(aux)){

            }else{

            }
        break;
        case 5.3:
            if(regexMail.test(msg)){

            }else{

            }
        break;
        case 5.4:
            //case 6.3
        case 5.5:
            //enlistar modelos de moto
        break;
        case 5.6:
            //recibir cuantos modelos de motos hay
            if(regexNumber.test(msg) && msg>0 && msg<3){

            }else{

            }
        break;
        case 6.1:
            //nombre
            if(regexOnlyName.test(msg)){
                if(msg==1){
                    
                }else{
                    
                }
            }else{
            
            }
        break;
        case 6.2:
            //celular
            if(regexNumber.test(msg)){
                
            }else{

            }
        break;
        case 6.3:
            //Enviar mensaje con los codigos de las ciudades,recibir cuantas ciudades hay
            if(regexNumber.test(msg)){
                if(msg==4){
                    //enviar mensaje para ciudad
                    //case 6.31
                }
            }else{

            }
        break;
        case 6.31:
            if(regexName(aux)){

            }else{

            }
        break;
        case 6.4:
            //cedula

        break;
        case 6.5:
            //correo
            if(regexMail.test(msg)){

            }else{

            }
        break;
        case 6.6:
            //Enviar codigos de sucursales, recibir cuantas sucursales hay
            if(regexNumber.test(msg)){

            }else{

            }
        break;
        case 6.7:
            //Enviar codigos de motos,recibir cuales son validos,validar
            if(regexNumber.test(msg)){

            }else{

            }
        break;
        case 6.8:
            //Enviar tipo de repuesto, recibir cuantos tipos hay
            if(regexNumber.test(msg)){

            }else{

            }
        break;
        case 6.9:
            //Enviar años de la moto,validar cuales estan disponibles
            if(regexAnio.test(msg)){

            }else{

            }
        break;
        case 6.11:{
            //Mensaje de menu principal
        }
        
    }
}

app.post('/getWhtspMsg', async (req, res) => {
    const jsonData = req.body;
    if (Object.keys(jsonData).length > 0) {
        let message=jsonData.message
        let number=jsonData.number
        let father=jsonData.father
        
        let result= await navFlow(message,number,father)
        res.status(200).json(result)
    } else {
    res.status(400).json({error: 'Solicitud no contiene JSON válido'});
    }
})

app.listen(app.get('port'),()=>{
    console.log(`Server listening on port ${app.get('port')}`);
});