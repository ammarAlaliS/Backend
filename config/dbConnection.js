const { default: mongoose } = require("mongoose")

const dbConnection = ()=>{
    try {
        const conn = mongoose.connect(process.env.MONGODB_URL);
        console.log('connection success')
    } catch (error) {
       console.log('error to connect to data base')
    }
}
module.exports = dbConnection; 