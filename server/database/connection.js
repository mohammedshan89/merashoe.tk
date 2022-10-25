const  mongoose = require('mongoose')

module.exports = {
    connectToDb : (cb) => {
        mongoose.connect(process.env.MONGO_URI)
            .then(() => {
                console.log("connect db")
                return cb()
            })
            .catch((err) => {
                console.log(err)
                return cb(err)
            })
    }
}

