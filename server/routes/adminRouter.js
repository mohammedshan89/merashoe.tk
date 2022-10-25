const express = require('express')
const services = require('../controller/render')

// for multer 
const store = require('../middleware/multer')

const router = express.Router()


router.get('/admin_login',services.adminLoggedOut, services.adminLogin)

router.get('/admin_panel/dashboard',services.adminLoggedIn,  services.adminPanel)

router.get('/admin_panel/user-management',services.adminLoggedIn,  services.userManagement)

router.get('/admin_panel/product-management',services.adminLoggedIn,  services.productManagement)

router.get('/admin-panel/order', services.adminLoggedIn,services.orderManagement)
router.get('/orders-itemsview', services.adminLoggedIn,services.itemsView)

router.get('/order-update',services.adminLoggedIn,services.orderUpdate)
router.get('/admin/exportExcel',services.exportExcel)

router.get('/admin_panel/add-product', services.addProducts)

router.get('/admin-category', services.category)
router.post('/admin-category', services.addCategory)
router.post('/delete-category', services.deleteCategory)

router.get('/coupon-page',services.adminLoggedIn,services.couponPage)
router.post('/add-coupon',services.adminLoggedIn,services.addCoupon)
router.post('/coupon-delete',services.adminLoggedIn,services.deleteCoupon)


router.get('/admin_panel/edit-product', services.editProduct)

router.get('/admin_panel/delete-product', services.deleteProduct)



router.post('/admin_panel/users/block', services.userBlock)

router.post('/admin_panel/users/unblock', services.userUnblock)


// ////////////
// router.post('/uploadmultiple', services.uploads)
router.post('/admin_panel/add-product',store.any(), services.addProduct)

router.post('/admin_panel/edit-product/update',store.any(), services.updateProduct)

router.post('/dash',services.dash)
router.get('/dash',services.dashBoard)


router.post('/admin_login', services.adminSignin)



router.get('/admin_logout',services.adminLogout)


module.exports = router