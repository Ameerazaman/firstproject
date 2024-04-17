const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    orderId: {
        type: String
    },
    totalPrice: {
        type: Number
    },
    transactiontype: {
        type: String
    },
    reasontype: {
        type: String
    },

    price: {
        type: Number
    },
   
    date: {
        type: String,
        default: function () {
            return new Date().toDateString()
        }
    },




});

const wallet = mongoose.model('wallet', walletSchema);

module.exports = wallet;