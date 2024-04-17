const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
    },
    minAmount: {
        type: Number,
    },
    discount: {
        type: Number
    },
    expirationDate: {
        type: String
    },
    addedAt: {
        type: String,
        default: function () {  // Use a function for default value
            return new Date().toDateString();
        }
    },
    users: {
        type: Array
    }
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;