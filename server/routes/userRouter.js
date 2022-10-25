const express = require('express')
const services = require('../controller/render')


const router = express.Router()



router.get('/user_signin', services.isLoggedOut, services.userLogin)
router.post('/user_signin',services.login)

router.get('/',services.userHome)
router.get('/user_logout',services.userLogout)

router.get('/user_home/cart',services.isLoggedIn,services.cartPage)
router.post('/user_home/add-to-cart',services.isLoggedIn, services.addToCart)

router.get('/delete-cart',services.isLoggedIn, services.deleteCart)

router.get('/user_home/wishlist',services.isLoggedIn, services.wishlist)
router.post('/add-wishlist',services.isLoggedIn,services.addWishlist)
router.get("/delete-wishlist",services.isLoggedIn,services.deleteWishlist1)

router.get('/proceed-checkout',services.isLoggedIn, services.proceed)

router.get('/add-address',services.isLoggedIn, services.addressPage)
router.post('/add-address',services.isLoggedIn, services.addAddress)

router.post('/apply-coupon',services.isLoggedIn, services.applyCoupon)

router.get('/payment-success',services.isLoggedIn, services.successPage)
router.post('/checkout/payment',services.isLoggedIn, services.checkout)
router.get('/paypal',services.isLoggedIn,services.paypal)
router.get('/razorpay',services.isLoggedIn,services.razorpay)


router.get('/user_home/productView', services.productView)

router.get('/user_home/profile',services.isLoggedIn,services.profile)
router.get('/edit-profile',services.isLoggedIn,services.editProfile)

router.get('/user-myorders',services.isLoggedIn,services.userOrders)
router.get('/user-viewItems',services.isLoggedIn,services.userViewOrders)
router.get('/user-cancelOrder',services.isLoggedIn,services.userCancelOrders)

router.get('/user_registration',services.userSignup)
router.post('/user_registration', services.signup)

router.get('/mobile-verification',services.otpVerification )

router.get('/verifyOtp', services.isMobileFound, services.verifyOtpPage)

router.post('/verifyOtp', services.verifyOtp)

router.post('/user/send-otp', services.sendOtp)


module.exports = router