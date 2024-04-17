const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId:{
        type:String
    },
    count:{
        type:Number
    },
    products:[
        {
            proId:{
                type:String
            },
            quantity:{
                type:Number
            }
        }   
    ]
});

const cart = mongoose.model('cart', cartSchema);

module.exports = cart;