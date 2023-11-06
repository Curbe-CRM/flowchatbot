var Client = require('./Client')
var Motorcycle = require('./Motorcycle')
class Application {
    constructor(){
        this.branch=0        
        this.sparetype=0        
        this.purchase_option=0
        this.client= new Client()
        this.motorcycle=new Motorcycle()
    }
    set setBranch(input){
        this.branch=input
    }
    get getBranch(){
        return this.branch
    }
    set setMotorcycle(input){
        this.motorcycle=input
    }
    get getMotorcycle(){
        return this.motorcycle
    }
    set setSparetype(input){
        this.sparetype=input
    }
    get getSparetype(){
        return this.sparetype
    }
    set setMotorcycle_year(input){
        this.motorcycle_year=input
    }
    get getMotorcycle_year(){
        return this.motorcycle_year
    }
    set setType_motorcycle(input){
        this.type_motorcycle=input
    }
    get getType_motorcycle(){
        return this.type_motorcycle
    }
    set setPurchase_option(input){
        this.purchase_option=input
    }
    get getPurchase_option(){
        return this.purchase_option
    }
    get getClient(){
        return this.client
    }
    get getMotorcycle(){
        return this.motorcycle
    }
}
module.exports = Application