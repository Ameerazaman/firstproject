const mongoose = require('mongoose')
const orderschema = mongoose.Schema({
    userId: {
        type: String
    },
    address: {
        type: Object
    },
    payment: {
        type: String
    },

    products: {
        type: Array
    },
    total: {
        type: Number
    },
    discount: {
        type: Number
    },
    totalPrice: {
        type: Number
    },
    orderedAt: {
        type: String,
        default: function () {
            return new Date().toDateString()
        }
    },
    status: {
        type: String,
        default: "Placed"
    },
    productsCount: {
        type: Number
    },
    paymentstatus: {
        type: String,
        default: "Paid"
    },
    coupondiscount: {
        type: Number
    },
    categoryDiscount: {
        type: Number
    },

    ship: {
        type: String
    },
    success: {
        type: String,
        default: "failed"
    }
})
const Order = mongoose.model("Order", orderschema)
module.exports = Order