const express = require('express');
const morgan=require('morgan');
const axios=require('axios');
var cors = require('cors');
const { Client } = require('pg');
const APIurl=" https://ktm.curbe.com.ec/api/"

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
    } finally {
        client.end();
    }
}

async function modifyUserbyCell(objClient){
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
            WHERE usu_celular ='`+objClient.usu_celular.toString()+`'
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
    } finally {
      client.end();
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
      } finally {
          client.end();
      }

}

async function consultUserbyCellphone(number,emp_id){
    try {
        const queryText = 'SELECT * FROM usuario WHERE usu_celular=$1 and usu_emp_id=$2';
        const values = [number,emp_id];
        let response=await client.query(queryText, values);
        if(response.rowCount==1){
            return response.rows[0]
        }else{
            if(response.rowCount==0){
                return []
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
    try {        
        const queryText = 'SELECT * FROM conversacion WHERE conv_usuario=$1 and conv_finalizada=false';
        const values = [user];
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
      } finally {
          client.end();
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
      } finally {
          client.end();
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
      } finally {
          client.end();
      }
}


const app = express();
app.set('port', process.env.PORT || 8585);
app.set('json spaces', 2)
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

let client
let token,consult,names,codes,result,user,conv,msg,lowmsg,instances,objUser,objConv,emp
let listOpc=""
let msgAnt=""
let msgError="❌ Opcion Incorrecta, intentalo nuevamente 😄"

async function connectDB(){
    if(client==undefined){
        client= new Client(dbConfig);
        try {
            await client.connect();
        } catch (error) {
            console.log(error)
            return {status:"Error",data:error}
        }finally{
            console.log(client)
        }
    }        
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

async function consultCities(){
    var res= await axios.get(APIurl+"leads/ciudades",{headers: {
        Authorization: "Bearer ".concat(token)
    }})
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar ciudades "+error
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
        return "Error al consultar agencias de ciudad "+error
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
        return "Error al consultar tipo de vehiculos "+error
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
        return "Error al consultar modelos "+error
    })
    return res
}

async function consultBuyTimes(){
    var res= await axios.get(APIurl+"leads/surveys",{headers: {
        Authorization: "Bearer ".concat(token)
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

async function navInstance(cell_number){
    if(user.length==0){        
        user=await createUserCellOnly(cell_number,emp.emp_id)        
        conv=await createConversation(user)
    }else{
        conv =await consultConvesationbyUser(user.usu_id)        
    }    
    let flow= await consultFlowbyComp(emp.emp_id)
    instances= await consultInstancesbyIndex(flow.flu_id,conv.conv_indice_flujo)
    console.log(instances)
        if(instances.length>0){        
            for(let i=0;i<instances.length;i++){                    
                let conditions=JSON.parse(instances[i].inst_condicion)                
                if(instances[i].inst_consulta!=null){
                    token= await getToken()                    
                    switch(instances[i].inst_consulta){
                        case "Ciudad":
                            consult = await consultCities()                            
                            names=consult.map((objeto) => objeto.nombre)
                            codes=consult.map((city) => city.codigo)
                            listOpc=listOptions(names)+(consult.length+1).toString()+". Otro\n"
                            conditions.push(consult.length+1)
                        break;
                        case "Sucursal":
                            consult=await consultAgencies(user.usu_ciudad)
                            console.log(consult)
                            if(consult.length==0){
                                lowmsg=conditions                                
                            }else{
                                names=consult.map((objeto) => objeto.vitrina)
                                codes=consult.map((city) => city.emp_codigo)
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
                        console.log("no se puede convertir a valor")
                    }                    
                    if(regex.test(lowmsg) && (conditions.includes(lowmsg) || conditions.includes(nummsg))){
                        if(instances[i].inst_consulta!=null){
                            switch(instances[i].inst_consulta){
                                case "Horarios":
                                    let listH="Estamos ubicados en: \n"
                                    let cities = await consultCities()
                                    for (let i=0;i<cities.length;i++){
                                        listH+="\t 📍"+cities[i].nombre+"\n"
                                        let branches= await consultAgencies(cities[i].codigo)                
                                        for(let j=0;j<branches.length;j++){
                                            listH+="\t\t"+branches[j].direccion+"\n"
                                        }
                                    }
                                    listH+="🕒 Nuestro horario de atención es:\nLunes a Viernes de 9:00 am hasta las 7:00 pm\nSábados de 9:30 am a 1:00 pm\n¡Te esperamos! 🔥" 
                                    conv.conv_mutable=false
                                    conv.conv_indice_flujo=instances.data[i].inst_hijo
                                    await modifyConversationbyID(conv)
                                    await modifyUserbyCell(user)
                                    await confirmConversation(conv.conv_id)
                                    result=await navInstance(cell_number)
                                    return {status:"Msg",data:listH+result}
                                break;
                                case "Sucursal":
                                    msgAnt=instances[i].msj_contenido
                                break;
                            }
                        }
                        conv.conv_mutable=false                        
                        conv.conv_indice_flujo=instances[i].inst_hijo
                        let mod_user=JSON.parse(instances[i].inst_usu_mod)
                        if(mod_user.length>0){
                            for(let j=0;j<mod_user.length;j++){
                                if(msg=="si"){                                
                                    user[mod_user[j]]=true
                                }else{
                                    if(msg=="no"){                                    
                                        user[mod_user[j]]=false                                    
                                    }else{                                    
                                        user[mod_user[j]]=msg                                    
                                    }
                                }
                            }
                            user=await modifyUserbyCell(user)
                        }
                        
                        let mod_conv=JSON.parse(instances[i].inst_conv_mod)
                        if(mod_conv.length>0){
                            for(let k=0;k<mod_conv.length;k++){
                                if(msg=="si"){
                                    conv[mod_conv[k]]=true
                                }else{
                                    if(msg=="no"){
                                        conv[mod_conv[k]]=false
                                    }else{
                                        conv[mod_conv[k]]=msg
                                    }
                                }
                            }
                            conv=await modifyConversationbyID(conv)
                        }                        
                        return await navInstance(cell_number)
                    }else{                        
                        if(i==(instances.length-1)){
                            conv.conv_mutable=true
                            await modifyConversationbyID(conv)
                            return {status:"Msg",data:msgError}
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

async function navFlow(cell_number,comp_cell_number){    
    emp = await consultCompanybynumber(comp_cell_number)    
    lowmsg=msg.toString().toLowerCase().trim()    
    user=await consultUserbyCellphone(cell_number,emp.emp_id)    
    return await navInstance(cell_number)
    
    /*
    let confirm="Por favor confirma tus datos:\n"
    confirm+=user.data.usu_opcion_identificador?"Tipo de Identificacion: Cedula identidad\n":"Tipo de Identificacion: Cedula de Extranjeria o Pasaporte\n"
    confirm+="Identificacion: "+user.data.usu_identificador+"\n"
    confirm+="Nombre: "+user.data.usu_nombre+"\n"
    confirm+="Apellido: "+user.data.usu_apellido+"\n"
    confirm+="Email: "+user.data.usu_correo+"\n"            
    
    if(user.data.usu_ciudad!=null){
        consult= await consultCities()
        let nameCity=consult.filter((object)=>object.codigo==user.data.usu_ciudad)            
        nameCity=user.data.usu_ciudad==0?conv.data.conv_ciudad:nameCity[0].nombre
        confirm+="Ciudad: "+nameCity+"\n"
    }
    
    if(conv.data.conv_tipo_moto!=null){
        consult= await consultTypeVehicule()
        let nameType=consult.filter((object)=>object.veh_codigo==conv.data.conv_tipo_moto)
        confirm+="Tipo de vehiculo: "+nameType[0].veh_nombre+"\n"
    }                
    
    if(conv.data.conv_moto!=null){
        consult= await consultModels(conv.data.conv_tipo_moto)
        let nameModel=consult.filter((object)=>object.cod_modelo==conv.data.conv_moto)
        confirm+="Modelo: "+nameModel[0].nombre+"\n"
    }

    if(conv.data.conv_tiempo_compra!=null){
        consult= await consultBuyTimes()
        let optionName=consult.map((object)=>object.options)
        let nombre =optionName[0].filter((object)=>object.id==conv.data.conv_tiempo_compra)            
        confirm+="Opcion de compra: "+nombre[0].name+"\n"
    }

    confirm+="Son correctos Si o No"
    return {status:"Msg",data:confirm}
    */
                           
            
       
    
}

app.use(cors());

app.post('/getWhtspMsg', async (req, res) => {
    const jsonData = req.body;
    if (Object.keys(jsonData).length > 0) {
        let message=jsonData.message
        let number=jsonData.number
        let compNumber=jsonData.compNumber
        msg=message
        let result= await navFlow(number,compNumber)        
        res.status(200).json(result)
    } else {
    res.status(400).json({error: 'Solicitud no contiene JSON válido'});
    }
})

app.listen(app.get('port'),()=>{
    console.log(`Server listening on port ${app.get('port')}`);
});