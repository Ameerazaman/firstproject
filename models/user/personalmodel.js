const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId:{
        type:String
    },
    fullname:{
        type:String
    },
    email:{
        type:String
    },
    address:{
        type:String
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
    
    phone:{
        type:Number
    }
})

const personalprofile = mongoose.model('personalprofile', profileSchema);

module.exports = personalprofile;