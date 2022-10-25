const mongoose = require('mongoose')
const Schema = mongoose.Schema


const adminSchema = new Schema({
    username  : {
        type :String,
        required: true
    },
    password  : {
        type :String,
        required: true
    }
})

// model to access Schema

const Admin = mongoose.model('Admin',adminSchema)

module.exports = Admin