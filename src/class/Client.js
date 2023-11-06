class Client{
    constructor(){
        this.name=""
        this.lastname=""
        this.cell=""
        this.mail=""
        this.city=0
        this.ID=""
        this.other_city=""
        this.marital_status=0
    }
    set setName(input){
        this.name=input
    }
    get getName(){
        return this.name
    }
    set setLastname(input){
        this.lastname=input
    }
    get getLastname(){
        return this.lastname
    }
    set setCell(input){
        this.cell=input
    }
    get getCell(){
        return this.cell
    }
    set setMail(input){
        this.mail=input
    }
    get getMail(){
        return this.mail
    }
    set setCity(input){
        this.city=input
    }
    get getCity(){
        return this.city
    }
    set setID(input){
        this.ID=input
    }
    get getID(){
        return this.ID
    }
    set setMarital_status(input){
        this.marital_status=input
    }
    get getMarital_status(){
        return this.marital_status
    }
    set setOther_city(input){
        this.other_city=input
    }
    get getOther_city(){
        return this.other_city
    }
    verifyMail(){
        var regexMail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regexMail.test(this.mail);
    }
}
module.exports = Client