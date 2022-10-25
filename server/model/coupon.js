const mongoose = require('mongoose')

const Schema = mongoose.Schema


const couponSchema = new Schema({
    couponCode  : {
        type :String,
        trim : true,
        uppercase : true
    },
    couponValue : {
        type : Number,
        trim : true
    },
    minBill : {
        type : Number,
        trim : true
    },
    couponExpiry : {
        type : Date,
        trim : true
    },
    users : [{
        type : String,
        trim : true
    }],
    status : {
        type : String,
        
        uppercase : true
    }
  
} , { timestamps : true  })

// model to access Schema

const Coupon = mongoose.model('Coupon',couponSchema)

module.exports = Coupon