var Application= require ('./class/Application')
const express = require('express');
const morgan=require('morgan');
const axios=require('axios');
const { Pool } = require('pg');
const APIurl="https://jsonplaceholder.typicode.com/"

const dbConfig = {
    user: '',
    host: '',
    database: '',
    password: '',
    port: 5432
};

const app = express();
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2)
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

let indexFlow=1;

async function consultIDCompany(number) {
    const pool = new Pool(dbConfig);
    let company
    try {
      const connection = await pool.connect();
      const consulta = 'SELECT * FROM empresa WHERE emp_num_whtsp = $1';
      const valores = [number];
      const resultado = await connection.query(consulta, valores);
      console.log('Resultados de la consulta:');
      console.log(resultado.rows);
      company=resultado.rows      
      connection.end();
    } catch (error) {
      console.error('Error al consultar la tabla:', error);
    }finally{
        return company[0]
    }
  }

async function writeClient(object) {
    const pool = new Pool(dbConfig);
    try {
      const connection = await pool.connect();
      const queryText = 'INSERT INTO usuario (usu_apellido, usu_nombre, usu_celular,usu_correo,usu_identificador,usu_ciudad) VALUES ($1, $2, $3, $4, $5, $6)';
      const values = [object.lastname,object.name,object.cell,object.mail,object.ID,object.ciudad];
      await connection.query(queryText, values);
      connection.release();
      console.log('Datos insertados correctamente en la tabla');
    } catch (error) {
      console.error('Error al insertar datos en la tabla:', error);
    } finally {
      connection.end();
    }
  }

async function consultBranch(){
    var res= await axios.get(APIurl+"users")
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar sucursales"
    })
    return res
}

async function consultMotorcycles(){
    var res= await axios.get(APIurl+"users")
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar listado motos"
    })
    return res
}

async function consultBuyTime(){
    var res= await axios.get(APIurl+"users")
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar listado tiempo de compra"
    })
    return res
}

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

async function consultMotorcycleYear(){
    var res= await axios.get(APIurl+"users")
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return "Error al consultar año de motocicleta"
    })
    return res
}

function consultAPI(url){
    axios.get(url)
    .then(function (response) {
        return response.data
    })
    .catch(function(error){
        return error
    })
}

function listMenu(options){
    let msj=""
    for(let i;i>options.length;i++){
        msj+="\n "+options[i]
    }
    return msj
}

function navFlow(msg){
    let lowmsg=msg.toLowerCase().trim()
    switch(indexFlow){
        case 1:
            if(lowmsg=="si" || lowmsg=="sí"){
                indexFlow=2
            }else{

            }
        break;
        case 2:
        let regexName=/^[A-Za-z]+(\s[A-Za-z]+)?$/
        if(regexName.test(msg))
            if(/\s/.test(lowmsg)){
                let names=lowmsg.split(" ")
                indexFlow=3
            }else{
                
            }
        break;
        case 3:
        let regexMenu=/[0-9]+/
            
        break;
        case 4:

        break;
    }
}

app.post('/getWhtspMsg', async (req, res) => {
    const jsonData = req.body;
    if (Object.keys(jsonData).length > 0) {
        let branchoff= await consultBranch()
        res.status(200).json(branchoff)
    } else {
    res.status(400).json({error: 'Solicitud no contiene JSON válido'});
    }
})

app.post('/getReport', async (req, res) => {
    const jsonData = req.body;
    if (Object.keys(jsonData).length > 0) {
        let branchoff= await consultBranch()
        res.status(200).json(branchoff)
    } else {
    res.status(400).json({error: 'Solicitud no contiene JSON válido'});
    }
})

app.post('/getReportNumber', async (req, res) => {
    const jsonData = req.body;
    if (Object.keys(jsonData).length > 0) {
        let branchoff= await consultBranch()
        res.status(200).json(branchoff)
    } else {
    res.status(400).json({error: 'Solicitud no contiene JSON válido'});
    }
})

app.post('/asingAdviser', async (req, res) => {
    const jsonData = req.body;
    if (Object.keys(jsonData).length > 0) {
        let branchoff= await consultBranch()
        res.status(200).json(branchoff)
    } else {
    res.status(400).json({error: 'Solicitud no contiene JSON válido'});
    }
})

app.get('/', async (req, res) => {
    let aplicacion=new Application()
    // res.status(200).json(aplicacion)
    let compID=consultIDCompany('0912345678')

})

app.listen(app.get('port'),()=>{
    console.log(`Server listening on port ${app.get('port')}`);
});