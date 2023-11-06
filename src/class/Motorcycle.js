class Motorcycle {
    constructor(){
        this.ID=0
        this.year=0
        this.type=0
    }
    set setID(input){
        this.ID=input
    }
    get getID(){
        return this.ID
    }
    set setYear(input){
        this.year=input
    }
    get getYear(){
        return this.year
    }
    set setType(input){
        this.type=input
    }
    get getType(){
        return this.type
    }
}
module.exports = Motorcycle