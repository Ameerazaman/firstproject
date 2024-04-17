const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId:{
        type:String
    },
    products:[
        {
            proId:{
                type:String
            }
        }   
    ]
});

const wishlist = mongoose.model('wishlist', wishlistSchema);

module.exports = wishlist;