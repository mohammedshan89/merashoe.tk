const mongoose = require('mongoose')

const Schema = mongoose.Schema


const categorySchema = new Schema({
    category  : {
        type :String,
        category :true
    },
  
} , { timestamps : true  })

// model to access Schema

const Category = mongoose.model('Category',categorySchema)

module.exports = Category