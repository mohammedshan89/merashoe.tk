const User = require('../model/userModel')
const Cart = require('../model/cart')
const Category = require('../model/category')
const Order = require('../model/order')
const Product = require('../model/productsModel')
const Coupon = require('../model/coupon');
const Wishlist = require('../model/wishlist')
const { ObjectId } = require('bson');





module.exports = {
    findUser : function(userId) {
        return new Promise((resolve, reject) => {
            User.findOne({ email : userId })
                .then((user) => {
                    resolve(user)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    findCart : function(user) {
        return new Promise((resolve, reject) => {
            Cart.findOne({ owner : user.email })
                .then((cart) => {
                    resolve([cart, user])
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    updateStock : function(items) {
        return new Promise((resolve, reject) => {
            items.forEach(item => {
                let itemQuantity = +item.quantity
                Product.updateOne({ _id : item.itemId }, { $inc : { stock : - itemQuantity } })
                    .then(()=> {
                        return
                    })
                    .catch((err)=> {
                        
                    })
            })
            resolve()
            // reject(err)
        })
    },

    createOrder : function(order){
        return new Promise((resolve, reject) => {
           let newOrder = new Order(order)
           newOrder.save()
                .then(() => {
                    resolve()
                })
                .catch((err) => {
                    reject(err)
                })  
        })
    },

    couponUpdate : function(coupon,userId){
        return new Promise((resolve, reject) => {
            Coupon.updateOne({ couponCode : coupon.couponCode||''}, { $push : { users : userId}})
                .then(() => {
                    resolve()
                })
                .catch(() => {
                    // let error = new Error()
                    reject()
                })
        })
    },

    deleteCart : function(userId){
        return new Promise((resolve, reject) => {
            Cart.deleteOne({ owner : userId })
                .then(() => {
                    resolve()
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    findCategory: function() {
        return new Promise((resolve, reject) => {
            Category.find()
                .then((object) => {
                    resolve(object)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    findWishlist : function(productId, userId){
        return new Promise((resolve, reject) => {
            Wishlist.findOne({ itemId : productId, owner : userId})
                .then((wishlistItem) => {
                    resolve(wishlistItem)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

    findProduct : function(productId){
        return new Promise((resolve, reject) => {
            Product.findOne({ _id : productId })
                .then((product) => {
                    resolve(product)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },

    addWishlist : function(product, userId){
        return new Promise((resolve, reject) => {
            new Wishlist({
                 owner : userId,
                 itemId :ObjectId(product._id),
                 productName : product.productName,
                 price : product.price,
                 image : product.image1
            })
            .save()
            .then(()=> {
                resolve()
            })
            .catch((err)=> {
                reject(err)
            })
        })
    },

    deleteWishlist : function(productId){
        return new Promise((resolve, reject) => {
            Wishlist.deleteOne({_id : productId})
                .then(() => {
                    resolve()
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },

  

    findWishlist1 : function(user,object){
        return new Promise((resolve,rejcet) => {
            Wishlist.find({owner:user})
            .then((wishlist) => {
                resolve([wishlist,object])
            })
            .catch(err => console.log(err))
        })
    }

}