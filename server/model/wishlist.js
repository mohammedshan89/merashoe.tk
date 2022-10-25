const mongoose = require('mongoose')

const Schema = mongoose.Schema

const WishlistSchema = new Schema({

    owner : {
        type : String,
    },
        
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
    image : {
        type : String,
        required : true
    },
    
},{ timestamps : true})


const Wishlist = mongoose.model ('Wishlist', WishlistSchema)

module.exports = Wishlist