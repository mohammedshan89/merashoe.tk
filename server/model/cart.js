const mongoose = require('mongoose')

const Schema = mongoose.Schema

const CartSchema = new Schema({

    owner : {
        type : String,
    },

    items : [{
        
        itemId : {
            type : String,
            required : true
        },

        productName :{
            type : String,
            required : true
        },
        price : {
            type :Number,
            required : true
        },
        
        quantity : {
            type : Number,
            required : true,
            min : 1,
            default : 1
        },
        category : {
            type : String,
            required : true
        },

        stock : {
            type : Number,
            required : true
        },
        
        image : {
            type : String,
            required : true
        },
        orderStatus : {
            type : String,
            default : "none"
        }
        }],
    
    bill : {
        type : Number,
        required : true,
        default : 0
    },
    coupen : {
        type : Number
    },
    address : {
        type  : Object
    }
   
    
},{ timestamps : true})

const Cart = mongoose.model ('Cart', CartSchema)

module.exports = Cart