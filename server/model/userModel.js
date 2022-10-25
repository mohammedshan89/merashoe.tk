const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    name: {
        type : String,
        required : true
    },
    email: {
        type : String,
        required : true
    },
    mobile: {
        type : String,
        required : true
    },
    password: {
        type : String,
        required : true
    },
    blockStatus: {
        type : Boolean
    },
    address : [{
        name: {type : String},
        mobile: {type : String},
        address1: {type : String},
        address2: {type : String},
        city: {type : String},
        state: {type : String},
        zip: {type : String},
        
    }]
},{timestamps : true})


// model to access schema

const User = mongoose.model('User',userSchema)

module.exports = User