const User = require('../model/userModel')
const Admin = require('../model/adminModel');
const Product = require('../model/productsModel')
const Cart = require('../model/cart')
const Order = require('../model/order')
const Category = require('../model/category')
const Wishlist = require('../model/wishlist')
const Paypal = require('paypal-rest-sdk')
const Razorpay = require('razorpay')
const { ObjectId } = require('bson');
const otp = require('../middleware/otp');
const Coupon = require('../model/coupon');
const orderHelpers = require('../userHelpers/orderHelpers')
const excelJs = require('exceljs')
// const session = require('express-session')


let session;

let validation = {
    category: false,
    existCoupon: false,
    validCoupon: false,
    usedCoupon: false,
    dateExpiry: false,
    amountMin: false,
    wishlist: false
}


// session for user

exports.isLoggedIn = (req, res, next) => {
    session = req.session
    if (session.userId) {
        next()
    } else
        res.redirect('/user_signin')
}

exports.isLoggedOut = (req, res, next) => {
    session = req.session
    if (!session.userId) {
        next()
    } else
        res.redirect('/')
}

exports.isMobileFound = (req, res, next) => {
    session = req.session
    if (session.mobileNumber) {
        next()
    } else
        res.redirect('/mobile-verification')
}




// session for admin

exports.adminLoggedIn = (req, res, next) => {
    session = req.session
    if (session.adminId) {
        next()
    } else
        res.redirect('/admin_login')
}

exports.adminLoggedOut = (req, res, next) => {
    session = req.session
    if (!session.adminId) {
        next()
    } else
        res.redirect('/admin_panel/dashboard')
}

// get request of home page
exports.userHome = (req, res) => {
    req.session.coupon = ''
    req.session.order = ''
    if (req.query.category) {
        Product.find({ category: req.query.category })
            .then((result) => {
                Category.find()
                    .then(object => {
                        if (result)
                            res.render('user/home', { result, object })
                        validation.wishlist = false
                    }).catch(err => console.log(err))

            }).catch(err => console.log(err))
    } else {
        Product.find()
            .then((result) => {
                Category.find()
                    .then(object => {
                        if (result)
                            res.render('user/home', { result, object })
                    }).catch(err => console.log(err))

            }).catch(err => console.log(err))
    }
}

exports.cartPage = (req, res) => {
    req.session.coupon = ''
    req.session.order = ''
    let user = req.session.userId
    if (user) {
        Cart.findOne({ owner: user })
            .then((cartprod) => {
                Category.find()
                    .then(object => {

                        if (cartprod) {
                            res.render('user/cart', { cartprod, object, validation })

                        } else {
                            res.render('user/cart', { cartprod: { items: [] }, object, validation })
                        }
                    })
                    .catch((err) => console.log(err))

            }).catch(err => console.log(err))


    }

}

exports.addToCart = (req, res) => {
    let subItems
    let subIndex = 0
    if (req.query.cartSub) {
        Cart.findOne({ "items.itemId": req.query.id })
            .then((subprod) => {
                subItems = subprod.items
                subItems.forEach((value, index) => {
                    if (value.itemId == req.query.id) {
                        subItems[index].quantity--
                        subIndex = index
                    }
                })

                if (subItems[subIndex].quantity > 0) {

                    let subBill = +subprod.bill - +subItems[subIndex].price
                    Cart.updateOne({ owner: req.session.userId }, { $set: { items: subItems, bill: subBill } })
                        .then(() => {
                            if (req.query.cartSub) {
                                res.redirect("/user_home/cart")
                            } else
                                res.redirect("/")
                        }).catch((err) => console.log(err))
                } else {
                    let subBill1 = +subprod.bill - +subItems[subIndex].price

                    Cart.updateOne({ owner: req.session.userId }, { $pull: { items: { itemId: subItems[subIndex].itemId } }, $set: { bill: subBill1 } })
                        .then(() => {
                            if (req.query.cartSub) {
                                res.redirect("/user_home/cart")
                            } else
                                res.redirect("/")
                        }).catch((err) => console.log(err))
                }
            }).catch((err) => console.log(err))
    } else {
        let productId = req.query.id
        let user = req.session.userId

        Cart.findOne({ owner: user })
            .then(cart => {
                if (cart) {

                    Cart.findOne({ owner: user, "items.itemId": productId })
                        .then((exist) => {

                            if (exist) {
                                let updatedItem = exist.items
                                let itemIndex = 0;
                                updatedItem.forEach((value, index) => {
                                    if (value.itemId == productId) {
                                        updatedItem[index].quantity++

                                        itemIndex = index
                                    }
                                });

                                if (updatedItem[itemIndex].quantity <= updatedItem[itemIndex].stock) {
                                    let existBill = +exist.items[itemIndex].price + +exist.bill

                                    Cart.updateOne({ owner: user }, { $set: { items: updatedItem, bill: existBill } })
                                        .then(() => {
                                            if (req.query.inCart) {
                                                res.redirect("/user_home/cart")
                                            } else
                                                res.redirect("/")
                                        }).catch((err) => {
                                            console.log(err)
                                        })
                                } else {
                                    if (req.query.inCart) {
                                        res.redirect("/user_home/cart")
                                    } else
                                        res.redirect("/")
                                }
                            } else {

                                Product.findOne({ _id: ObjectId(productId) })
                                    .then((prod) => {
                                        let cartBill = +prod.price + +cart.bill
                                        Cart.updateOne({ owner: user }, {
                                            $push: {
                                                items: {
                                                    itemId: prod._id,
                                                    productName: prod.productName,
                                                    price: prod.price,
                                                    quantity: 1,
                                                    category: prod.category,
                                                    stock: prod.stock,
                                                    image: prod.image1

                                                }
                                            }, $set: { bill: cartBill }
                                        }).then(() => {
                                            res.redirect("/")
                                        }).catch((err) => {
                                            console.log(err)
                                        })
                                    }).catch((err) => {
                                        console.log(err)
                                    })
                            }
                        })
                } else {

                    Product.findOne({ _id: ObjectId(productId) })
                        .then((pro) => {
                            let cart = new Cart({
                                owner: user,
                                items: [{
                                    itemId: productId,
                                    productName: pro.productName,
                                    price: pro.price,
                                    quantity: 1,
                                    category: pro.category,
                                    stock: pro.stock,
                                    image: pro.image1

                                }],
                                bill: pro.price
                            })
                            cart.save()
                                .then(() => {
                                    res.redirect('/')
                                }).catch((err) => {
                                    console.log(err);
                                })
                        }).catch((err) => {
                            console.log(err)
                        })


                }
            })

    }
}

exports.deleteCart = (req, res) => {
    const deleteId = req.query.id
    Cart.findOne({ owner: req.session.userId })
        .then((cart) => {
            let deleteCart = cart.items
            let updateCart = cart
            deleteCart.forEach((value, index) => {
                if (value.itemId == deleteId) {

                    updateCart.bill = +cart.bill - (+value.quantity * +value.price)
                }
            })
            Cart.updateOne({ "items.itemId": deleteId }, { $pull: { items: { itemId: deleteId } }, $set: { bill: updateCart.bill } })
                .then(() => {
                    res.redirect('/user_home/cart')
                })
                .catch((err) => {
                    console.log(err)
                })
        }).catch((err) => {
            console.log(err)
        })

}

exports.wishlist = (req, res) => {
    let userId = req.session.userId
    orderHelpers.findCategory()
        .then((object) => {
            return orderHelpers.findWishlist1(userId, object)
        })
        .catch((err) => console.log(err))
        .then(([wishlist, object]) => {
            res.render('user/wishlist', { object, wishlist })
        })
        .catch(err => console.log(err))
}

exports.addWishlist = (req, res) => {
    const productId = req.query.id
    const userId = req.session.userId
    orderHelpers.findWishlist(productId, userId)
        .then((wishlistItem) => {
            if (wishlistItem) {
                orderHelpers.deleteWishlist(wishlistItem._id)
                    .then(() => {
                        res.redirect('/')
                    }).catch(err => console.log(err))
            } else {
                orderHelpers.findProduct(productId)
                    .then((product) => {
                        return orderHelpers.addWishlist(product, userId)
                    }).catch(err => console.log(err))
                    .then(() => {
                        res.redirect('/')
                    })
                    .catch(err => console.log(err))
            }
        }).catch(err => console.log(err))
}

exports.deleteWishlist1 = (req, res) => {
    let productId = req.query.id
    orderHelpers.deleteWishlist(productId)
        .then(() => {
            res.redirect('/')
        })
        .catch((err) => {
            console.log(err)
        })
}

exports.proceed = (req, res) => {
    User.findOne({ email: req.session.userId }, { address: 1, _id: 0 })
        .then((value) => {

            Cart.findOne({ owner: req.session.userId }, { items: 1, bill: 1 })
                .then((cartItems) => {
                    if (cartItems) {
                        Category.find()
                            .then(object => {
                                if (value.address.length === 0) {
                                    res.render('user/addNewAddress', { cartItems, value, object })

                                } else {

                                    res.render('user/checkout', { cartItems, value, object, validation })
                                    validation.validCoupon = false
                                    validation.usedCoupon = false
                                    validation.dateExpiry = false
                                    validation.amountMin = false
                                }
                            }).catch((err) => console.log(err))
                    } else {
                        Category.find()
                            .then(object => {
                                res.render('user/addNewAddress', { cartItems, value, object })
                            }).catch(err => console.log(err))
                    }
                }).catch((err) => conaole.log(err))
        }).catch((err) => console.log(err))


}

exports.addressPage = (req, res) => {
    Cart.findOne({ owner: req.session.userId }, { items: 1, bill: 1 })
        .then((cartItems) => {
            Category.find()
                .then(object => {

                    res.render('user/addNewAddress', { cartItems, object })

                }).catch((err) => conaole.log(err))

        }).catch(err => console.log(err))

}


exports.addAddress = (req, res) => {
    let address = req.body
    if (req.body.save) {
        User.updateOne({ email: req.session.userId }, { $push: { address: address } })
            .then((result) => {
                res.redirect("/proceed-checkout");
            }).catch((err) => conaole.log(err))
    } else {
        res.redirect('/proceed-checkout')
    }
}


exports.successPage = ((req, res) => {
    if (req.session.order) {
        const order = req.session.order
        const coupon = req.session.coupon || ''
        const userId = req.session.userId
        order.items.forEach((items) => {
            items.orderStatus = "processed"
        })

        orderHelpers.updateStock(order.items)
            .then(() => {
                console.log("upadate stock")
                return orderHelpers.createOrder(order)
            })
            .catch((err) => {
                console.log(err)
            })
            .then(() => {

                if (coupon) {
                    return orderHelpers.couponUpdate(coupon, userId)
                } else {
                    return
                }
            })
            .catch((err) => {
                console.log(err)
            })
            .then(() => {
                console.log("couponUpdate")
                return orderHelpers.deleteCart(userId)
            })
            .catch((err) => {
                console.log(err)
            })
            .then(() => {
                console.log('deleteCart')
                return orderHelpers.findCategory()
            })
            .catch((err) => {
                console.log(err)
            })
            .then((object) => {
                console.log("orderCreated")
                res.render('user/payment-success', { object })
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        orderHelpers.findCategory()
            .then((object) => {
                console.log("orderCreated")
                res.render('user/payment-success', { object })
            })
            .catch((err) => {
                console.log(err)
            })
    }

})



exports.checkout = (req, res) => {

    function createOrder(cart, user) {
        const newOrder = {
            user: cart.owner,
            items: cart.items,
            address: user.address[addressIndex],
            cartBill: cart.bill,
            couponCode: coupon.couponCode || '',
            couponValue: coupon.couponValue || '',
            orderBill: orderBill || cart.bill,
            paymentMethod: paymentMethod,
            orderDate: new Date(),
        }
        req.session.order = newOrder
    }

    const paymentMethod = req.body.paymentType
    const addressIndex = +req.body.selectedAddress
    const orderBill = req.body.bill
    const userId = req.session.userId
    const coupon = req.session.coupon || {}

    orderHelpers.findUser(userId)
        .then((user) => {
            return orderHelpers.findCart(user)
        })
        .catch((err) => {
        })
        .then(([cart, user]) => {
            if (paymentMethod === "cod") {
                createOrder(cart, user)
                res.json({ codSuccess: true, value: paymentMethod })
            } else if (paymentMethod === "paypal") {
                createOrder(cart, user)
                res.json({ paypal: true })
            } else if (paymentMethod === "razorpay") {
                createOrder(cart, user)
                res.redirect('/razorpay')
            }
        })
        .catch((err) => {
            console.log(err)
        })

}



exports.razorpay = (req, res) => {
    const bill = Cart.findOne({ owner: req.session.userId })
        .then((cart) => {
            return cart.bill
        })
    bill.then((totalBill) => {
        console.log(totalBill)
        const razorpay = new Razorpay({
            key_id: `${process.env.RAZORPAY_KEY_ID}`,
            key_secret: `${process.env.RAZORPAY_KEY_SECRET}`
        })

        let options = {
            amount: totalBill * 100,  // amount in the smallest currency unit
            currency: "INR"
        };

        razorpay.orders.create(options, function (err, order) {
            console.log(order);
            res.json({ razorpay: true, order });
        });
    })
}

exports.paypal = (req, res) => {
    let billAmount = Order.findOne({ owner: req.session.userId })
        .then((order) => {
            return order.orderBill;
        })
    billAmount.then((bill) => {
        bill = Math.round(+bill * 0.01368)
        console.log(bill);

        Paypal.configure({
            'mode': 'sandbox', //sandbox or live 
            'client_id': 'AXO3kN5P9x-0TYzO06OVSawpde3WMLwiv_czU2c3KdVks5qkvg_TI5po3BLaCwfjN5hc4sbZYvTkI-n9',
            // please provide your client id here 
            'client_secret': 'EKq_3bxd_PTGt6ul6Y4ZaN5TInOXA-50OH0KhpMXoWq3a_4Pj1nlDg1LsMwFwTqxnisc3O1jFiV1jdXj' // provide your client secret here 
        });

        // create payment object 
        let payment = {
            "intent": "authorize",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": 'http://localhost:5050/payment-success',
                "cancel_url": "http://127.0.0.1:3000/err"
            },
            "transactions": [{
                "amount": {
                    "total": `${+bill}`,
                    "currency": "USD"
                },
                "description": " a book on mean stack "
            }]
        }

        let createPay = (payment) => {
            return new Promise((resolve, reject) => {
                Paypal.payment.create(payment, function (err, payment) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(payment);
                    }
                });
            });
        }

        // call the create Pay method 
        createPay(payment)
            .then((transaction) => {
                console.log(transaction)
                var id = transaction.id;
                var links = transaction.links;
                var counter = links.length;
                while (counter--) {
                    if (links[counter].method == 'REDIRECT') {
                        // redirect to paypal where user approves the transaction 
                        return res.redirect(links[counter].href)
                    }
                }
            })
            .catch((err) => {
                console.log(err);
                res.redirect('/err');
            });


    })
}


exports.profile = (req, res) => {
    req.session.coupon = ''
    req.session.order = ''
    Category.find()
        .then(object => {
            User.findOne({ email: req.session.userId })
                .then((user) => {
                    res.render('user/myAccount', { user, object })
                }).catch((err) => console.log(err))

        }).catch(err => console.log(err))

}

exports.editProfile = (req, res) => {
    Category.find()
        .then(object => {
            User.findOne({ email: req.session.userId })
                .then((result) => {
                    res.render('user/profileEdit', { result, object })
                }).catch((err) => console.log(err))
        }).catch(err => console.log(err))

}

exports.userOrders = (req, res) => {
    Category.find()
        .then(object => {
            Order.find({ user: req.session.userId })
                .then((orders) => {
                    res.render('user/userOrder', { orders, object })
                }).catch((err) => console.log(err))
        }).catch(err => console.log(err))

}

exports.userViewOrders = (req, res) => {
    let userOrderId = req.query.id
    Category.find()
        .then(object => {
            Order.findOne({ _id: ObjectId(userOrderId) })
                .then((indOrder) => {
                    res.render('user/userViewItems', { indOrder, object })
                }).catch((err) => console.log(err))
        }).catch(err => console.log(err))

}

exports.userCancelOrders = (req, res) => {
    let itemId = req.query.id
    let orderId = req.query.orderId
    Order.updateOne({ _id: ObjectId(orderId), "items.itemId": itemId }, { $set: { "items.$.orderStatus": "User Cancelled" } })
        .then(() => {
            res.redirect(`/user-viewItems?id=${orderId}`)
        }).catch((err) => console.log(err))

}

// get request of loginpage
exports.userLogin = (req, res) => {
    let response = {
        passMatchErr: req.query.password,
        registrationErr: req.query.registration,
        blockstatus: req.query.blockstatus,
        passMatchErrMsg: "Password miss match",
        regErrMsg: "Invalid User Please register",
        blockStatusmsg: "You Have Blocked by Admin"
    }
    res.render('user/login', { response })
}

// get request of signup page
exports.userSignup = (req, res) => {
    let response = {
        passMatchErr: req.query.passwordMatch,
        userExistsErr: req.query.userExists,
        passMatchErrMsg: "password and confirm password does not match",
        userExistsErrMsg: "User Already registered !",

    }

    res.render('user/signup', { response })
}

// get request of otp page


exports.adminLogin = (req, res) => {
    let response = {
        passMatchErr: req.query.password,
        registrationErr: req.query.adminfound,
        passMatchErrMsg: "Password miss match",
        regErrMsg: "Invalid Admin Please register"
    }
    res.render('admin/login', { response })
}

exports.adminPanel = (req, res) => {
    res.render('admin/dashBoard')
}

exports.userManagement = (req, res) => {
    User.find((err, users) => {
        if (!err) {

            res.render('admin/users', { users })
        }
    })

}

exports.productManagement = (req, res) => {
    Product.find()
        .then((result) => {
            let num = 1
            if (result) {
                res.render('admin/products', { result, num })
            }
        })
        .catch((err) => {
            console.log(err)
        })

}

exports.orderManagement = (req, res) => {
    Order.find()
        .then((orders) => {
            res.render('admin/orders', { orders })
        }).catch((err) => console.log(err))
}

exports.itemsView = (req, res) => {
    let orderId = req.query.id
    Order.findOne({ _id: ObjectId(orderId) })
        .then((indOrder) => {
            res.render('admin/viewItems', { indOrder })
        }).catch((err) => console.log(err))
}

exports.orderUpdate = (req, res) => {
    let itemId = req.query.id
    let orderId = req.query.orderId
    let action = req.query.action

    let updateOrder
    switch (action) {
        case 'accept':
            updateOrder = Order.updateOne({ _id: ObjectId(orderId), "items.itemId": itemId }, { $set: { "items.$.orderStatus": "Proceed" } })
            break;
        case 'shipp':
            updateOrder = Order.updateOne({ _id: ObjectId(orderId), "items.itemId": itemId }, { $set: { "items.$.orderStatus": "Shipped" } })
            break;
        case 'deliver':
            updateOrder = Order.updateOne({ _id: ObjectId(orderId), "items.itemId": itemId }, { $set: { "items.$.orderStatus": "Deliverd" } })
            break;
        default:
            updateOrder = Order.updateOne({ _id: ObjectId(orderId), "items.itemId": itemId }, { $set: { "items.$.orderStatus": "Vendor Cancelled" } })
            break;

    }

    updateOrder.then(() => {
        res.redirect(`/orders-itemsview?id=${orderId}`)
    }).catch((err) => console.log(err))
}



exports.productView = (req, res) => {
    const prodid = req.query.id
    Category.find()
        .then(object => {
            Product.findOne({ _id: ObjectId(prodid) })
                .then((product) => {
                    if (product) {
                        res.render('user/productView', { product, object })
                    } else {
                        res.send('product not found')
                    }
                }).catch(err => console.log(err))
        }).catch(err => console.log(err))

}

exports.addProducts = (req, res) => {

    Category.find()
        .then((object) => {
            res.render('admin/add-product', { prod: '', object })
        }).catch((err) => console.log(err))

}

exports.category = (req, res) => {

    Category.find()
        .then((object) => {
            res.render('admin/category', { object, validation })
            validation.category = false
        }).catch((err) => console.log(err))

}

exports.addCategory = (req, res) => {
    Category.findOne({ category: req.body.category })
        .then((result) => {
            if (result) {
                validation.category = true
                res.redirect('/admin-category')
            } else {
                let category = new Category({
                    category: req.body.category
                })
                category.save()
                    .then(() => {
                        res.redirect('/admin-category')
                    }).catch((err) => console.log(err))
            }


        }).catch((err) => console.log(err))

}

exports.deleteCategory = (req, res) => {

    Category.deleteOne({ category: req.query.name })
        .then(() => {
            res.redirect('/admin-category')
        }).catch((err) => console.log(err))
}

exports.couponPage = (req, res) => {
    Coupon.find()
        .then(coupons => {

            Coupon.updateMany({ couponExpiry: { $lte: Date.now() } }, { $set: { status: "expired" } })
                .then(() => {
                    res.render('admin/coupon', { coupons, validation })
                    validation.existCoupon = false
                })

        }).catch((err) => console.log(err))

}

exports.addCoupon = (req, res) => {

    Coupon.findOne({ couponCode: req.body.couponcode })
        .then((coupon) => {
            if (coupon) {
                validation.existCoupon = true
                res.redirect('/coupon-page')
            } else {
                let addCoupon = new Coupon({
                    couponCode: req.body.couponcode,
                    couponValue: req.body.couponvalue,
                    minBill: req.body.minbill,
                    couponExpiry: req.body.expirydate,
                    status: "active"
                })
                addCoupon.save()
                    .then(() => {
                        res.redirect('/coupon-page')
                    }).catch((err) => console.log(err))
            }
        }).catch((err) => console.log(err))

}

exports.deleteCoupon = (req, res) => {
    Coupon.deleteOne({ _id: req.query.id })
        .then(() => {
            res.redirect('/coupon-page')
        }).catch((err) => console.log(err))
}

exports.applyCoupon = (req, res) => {
    let coupon = req.body.coupon.toUpperCase()
    Cart.findOne({ owner: req.session.userId })
        .then((cart) => {

            Coupon.findOne({ couponCode: coupon })
                .then((coupons) => {
                    if (coupons) {
                        Coupon.findOne({ couponCode: coupon, users: req.session.userId })
                            .then((usedCoupon) => {
                                if (usedCoupon) {
                                    validation.usedCoupon = true

                                    res.json({})
                                } else {
                                    if (coupons.couponExpiry >= Date.now()) {
                                        if (coupons.minBill > cart.bill) {
                                            validation.amountMin = true

                                            res.json({})
                                        } else {
                                            req.session.coupon = coupons
                                            res.json({ couponValue: coupons.couponValue, couponCode: coupons.couponCode })

                                        }
                                    } else {

                                        validation.dateExpiry = true

                                        res.json({})
                                    }
                                }
                            }).catch((err) => console.log(err))
                    } else {
                        validation.validCoupon = true

                        res.json({})
                    }
                }).catch((err) => console.log(err))

        }).catch((err) => console.log(err))

}




exports.editProduct = (req, res) => {
    let prId = req.query.id
    Category.find()
        .then((object) => {
            Product.findOne({ _id: ObjectId(prId) })
                .then((prod) => {
                    if (prod) {
                        res.render('admin/add-product', { prod, object })
                    }
                }).catch((err) => console.log(err))
        }).catch((err) => console.log(err))

}

exports.otpVerification = (req, res) => {
    if (req.session.otplogin) {
        res.redirect('/')
    } else {
        res.render('user/mobile-verification')
    }
}

exports.verifyOtpPage = (req, res) => {
    if (req.session.otplogin) {
        res.redirect('/')
    } else {
        res.render('user/otp-verify')
    }
}

exports.verifyOtp = (req, res) => {
    let otpObject = req.body
    otp.veriOtp(otpObject.otp, req.session.mobileNumber)
        .then((verify) => {
            if (verify) {
                User.findOne({ mobile: req.session.mobileNumber })
                    .then((user) => {
                        req.session.userId = user.email
                        req.session.otplogin = true
                        res.redirect('/')
                    })
            } else
                res.redirect('/verifyOtp?otp=false')
        })
        .catch((err) => {
            console.log(err)
        })
}

exports.sendOtp = (req, res) => {
    User.findOne({ mobile: req.body.mobile })
        .then((user) => {
            if (user) {
                req.session.mobileNumber = req.body.mobile
                otp.sendOtp(req.body.mobile)
                res.redirect('/verifyOtp')
            } else {
                res.redirect('/user_registration')
            }
        }).catch((err) => console.log(err))
}

// post request of signup page
exports.signup = (req, res) => {
    if (req.body.password === req.body.confirmpassword) {
        let userEmail = req.body.email
        User.findOne({ email: userEmail })
            .then((result) => {
                if (result) {
                    if (result.email === userEmail) {
                        res.redirect('/user_registration?userExists=flase');
                    }
                } else {
                    const userData = new User(req.body)
                    userData.blockStatus = false
                    userData.save()
                        .then(() => {
                            res.redirect('/user_signin')
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                }
            })
            .catch((err) => {
                console.log(err)
            })

    } else
        res.redirect('/user_registration?passwordMatch=false')
}





// post request of login page
exports.login = (req, res) => {
    const loginData = req.body
    User.findOne({ email: loginData.email, password: loginData.password, blockStatus: false })
        .then((result) => {
            if (result) {
                session = req.session
                session.userId = loginData.email
                res.redirect('/')
            } else {
                User.findOne({ email: loginData.email })
                    .then((result) => {
                        if (result) {
                            if (result.blockStatus) {
                                res.redirect('/user_signin?blockstatus=true')
                            } else
                                res.redirect('/user_signin?password=false')
                        } else {
                            res.redirect('/user_signin?registration=false')
                        }
                    }).catch((err) => {
                        console.log(err)
                    })
            }
        })
        .catch((err) => console.log(err))
}









exports.adminSignin = (req, res) => {
    const adminData = req.body
    Admin.findOne({ username: adminData.username, password: adminData.password })
        .then((result) => {
            if (result) {
                session = req.session
                session.adminId = adminData.username
                res.redirect('/admin_panel/dashboard')
            } else {
                Admin.findOne({ username: adminData.username })
                    .then((result) => {
                        if (result) {
                            res.redirect('/admin_login?password=false')
                        } else
                            res.redirect('/admin_login?adminfound=false')
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            }
        })
        .catch((err) => {
            console.log(err)
        })
}


exports.userBlock = (req, res) => {
    let blockId = req.query.id
    User.updateOne({ _id: ObjectId(blockId) }, { $set: { blockStatus: true } })
        .then(() => {
            req.session.userId = "";
            res.redirect('/admin_panel/user-management')
        })
        .catch((err) => {
            console.log(err)
        })
}

exports.userUnblock = (req, res) => {
    let blockId = req.query.id
    User.updateOne({ _id: ObjectId(blockId) }, { $set: { blockStatus: false } })
        .then(() => {
            res.redirect('/admin_panel/user-management')
        })
        .catch((err) => {
            console.log(err)
        })
}


// ///////////////
exports.addProduct = (req, res, next) => {
    const files = req.files;

    if (!files) {
        const error = new Error('please choose file')
        error.httpStatusCode = 400
        return next(error)
    }

    let productDetail = new Product({
        productName: req.body.productName,
        price: req.body.price,
        description: req.body.description,
        stock: req.body.stock,
        category: req.body.category,
        // subCategory : req.body.subCategory,
        image1: req.files[0] && req.files[0].filename ? req.files[0].filename : "",
        image2: req.files[1] && req.files[1].filename ? req.files[1].filename : ""
    })


    productDetail.save()
        .then(() => {
            res.redirect('/admin_panel/add-product')
        })
        .catch(error => {
            console.log(error)
        })
}


//////////////////  // 

exports.updateProduct = (req, res) => {
    let updateId = req.query.id


    Product.updateOne({ _id: ObjectId(updateId) }, {
        $set: {
            productName: req.body.productName,
            price: req.body.price,
            description: req.body.description,
            stock: req.body.stock,
            category: req.body.category,
            // subCategory : req.body.subCategory,
            image1: req.files[0] && req.files[0].filename ? req.files[0].filename : "",
            image2: req.files[1] && req.files[1].filename ? req.files[1].filename : ""
        }
    })
        .then(() => {

            res.redirect('/admin_panel/product-management')
        })
        .catch((err) => {
            console.log(err)
        })


}

exports.deleteProduct = (req, res) => {
    const deleteId = req.query.id

    Product.deleteOne({ _id: ObjectId(deleteId) })
        .then(() => {
            res.redirect('/admin_panel/product-management')
        })
        .catch((err) => {
            console.log(err)
        })
}

exports.dash = (req, res) => {
    const months = [
        january = [],
        february = [],
        march = [],
        april = [],
        may = [],
        june = [],
        july = [],
        august = [],
        september = [],
        october = [],
        november = [],
        december = []
    ]

    const quarters = [
        Q1 = [],
        Q2 = [],
        Q3 = [],
        Q4 = []
    ]

    const monthNum = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

    Order.find({ "items.orderStatus": "Deliverd" })
        .then((orders) => {
            monthNum.forEach((month, monthIndex) => {
                orders.forEach((order, index) => {
                    if (order.orderDate.getMonth() + 1 == monthIndex + 1) {
                        months[monthIndex].push(order);
                    }
                })
            })//

            orders.forEach((order) => {
                if (order.orderDate.getMonth() + 1 <= 3) {
                    quarters[0].push(order)
                } else if (order.orderDate.getMonth() + 1 > 3 && order.orderDate.getMonth() + 1 <= 6) {
                    quarters[1].push(order)
                } else if (order.orderDate.getMonth() + 1 > 6 && order.orderDate.getMonth() + 1 <= 9) {
                    quarters[2].push(order)
                } else if (order.orderDate.getMonth() + 1 > 9 && order.orderDate.getMonth() + 1 <= 12) {
                    quarters[3].push(order)
                }
            })

            const monthlySalesTurnover = [];
            const quarterlySalesTurnover = [];
            months.forEach((month) => {
                let eachMonthTurnover = month.reduce((acc, curr) => {
                    acc += +curr.orderBill;
                    return acc;
                }, 0)
                monthlySalesTurnover.push(eachMonthTurnover);
            })

            quarters.forEach((quarter) => {
                let eachQuarterTurnover = quarter.reduce((acc, curr) => {
                    acc += curr.orderBill;
                    return acc;
                }, 0)
                quarterlySalesTurnover.push(eachQuarterTurnover)
            })

            let annualSales = orders.reduce((acc, curr) => {
                acc += curr.orderBill
                return acc;
            }, 0)

            res.json({ salesOfTheYear: monthlySalesTurnover, quarterlySales: quarterlySalesTurnover, annualSales: annualSales })
        }).catch((err) => console.log(err))
}

exports.exportExcel = (req, res) => {
    Order.find()
        .then((SalesReport) => {
            try {
                const workbook = new excelJs.Workbook();

                const worksheet = workbook.addWorksheet("Sales Report");

                worksheet.columns = [
                    { header: "S no.", key: "s_no" },
                    { header: "OrderID", key: "_id" },
                    { header: "Date", key: "orderDate" },
                    { header: "Products", key: "productName" },
                    { header: "Method", key: "paymentMethod" },
                    //     { header: "status", key: "status" },
                    { header: "Amount", key: "orderBill" },
                ];
                let counter = 1;
                SalesReport.forEach((report) => {
                    report.s_no = counter;
                    report.productName = "";
                    // report.name = report.userid;
                    report.items.forEach((eachproduct) => {
                        report.productName += eachproduct.productName + ", ";
                    });
                    worksheet.addRow(report);
                    counter++;
                });

                worksheet.getRow(1).eachCell((cell) => {
                    cell.font = { bold: true };
                });


                res.header(
                    "Content-Type",
                    "application/vnd.oppenxmlformats-officedocument.spreadsheatml.sheet"
                );
                res.header("Content-Disposition", "attachment; filename=report.xlsx");

                workbook.xlsx.write(res);
            } catch (err) {
                console.log(err.message);
            }
        });

}



exports.dashBoard = (req, res) => {
    res.redirect("/admin_panel/dashboard")
}


// get request of user logout page
exports.userLogout = (req, res) => {
    req.session.userId = ""
    req.session.otplogin = ''
    req.session.mobileNumber = ''

    res.redirect('/')
}

exports.adminLogout = (req, res) => {
    req.session.adminId = ""
    res.redirect('/admin_login')
}