const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId:{
        type:String
    },
    fullname:{
        type:String
    },
    address:{
        type:String
    },
    email:{
        type:String
    },
    phone:{
        type:Number
    },
    city:{
        type:String
    },
    state:{
        type:String
    },
    postalcode:{
        type:Number
    },
    payment:{
        type:String
    },
    addresstype:{
        type:String
    }
})

const address = mongoose.model('address', addressSchema);

module.exports = address;


