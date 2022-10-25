const multer = require('multer')
const path = require('path')



// set storage
let storage = multer.diskStorage({
    destination:function(req, file, cb){
        cb(null,'public/images')
    },
    filename:function(req, file, cb){
        // image.jpg
        // let ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
        let ext = path.extname(file.originalname)
        cb(null,file.fieldname + '-' + Date.now() + ext)
    }
})

store = multer({storage : storage})

module.exports = store