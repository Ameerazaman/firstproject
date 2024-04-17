const mongoose = require('mongoose');

const deliveryAddressSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    fullname: {
        type: String
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    postalcode: {
        type: Number
    },
    payment: {
        type: String
    },
    phone: {
        type: Number
    }
})

const deliveryAddress = mongoose.model('deliveryAddress', deliveryAddressSchema);

module.exports = deliveryAddress;