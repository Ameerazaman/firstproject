const mongoose = require('mongoose')
const Razorpay = require('razorpay');
require('dotenv').config();
const User = require("../../models/user/usermodel")
const products = require("../../models/admin/productModel")
const category = require('../../models/admin/categorymodel')
const cart = require("../../models/user/add-to-cart-model")
const address = require('../../models/user/addressmodel')
const deliveryAddress = require('../../models/user/delivery-addressmodel')
const Order = require('../../models/user/ordermodel');
const referaloffer = require('../../models/admin/referalofferModel');
const wallet = require('../../models/user/walletmodel');
const Coupon = require('../../models/admin/couponmodel');
const referoffer = require('../../models/user/referOffermodel');
const { categoryOffer } = require('./cartController');


const raz = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});


// Check Out page 
const checkoutPage = async (req, res) => {
    try {

        const userId = req.session.user._id
        const productId = req.session.productId
        console.log("product Id", productId)
        const data = await cart.aggregate([
            { $match: { userId: userId } },
            { $unwind: "$products" },
            {
                $project: {
                    proId: "$products.proId",
                    quantity: "$products.quantity",
                }
            },
            {
                $lookup: {
                    from: "products",
                    let: { proId: { $toObjectId: "$proId" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$proId"] } } }
                    ],
                    as: "productDetails"
                }
            },
            {
                $project: {
                    proId: "$proId",
                    quantity: "$quantity",
                    product: { $arrayElemAt: ["$productDetails", 0] },
                },
            },
            {
                $project: {
                    proId: 1,
                    quantity: 1,
                    image: 1,
                    product: 1,
                    subtotal: { $multiply: ["$quantity", "$product.price"] },
                    discountProduct: { $multiply: ["$quantity", "$product.discount"] },

                },
            }
        ]);
        console.log(data, "data")
        const result = await cart.aggregate([
            { $match: { userId: userId } },
            { $unwind: "$products" },
            {
                $project: {
                    proId: "$products.proId",
                    quantity: "$products.quantity",
                }
            },
            {
                $lookup: {
                    from: "products",
                    let: { proId: { $toObjectId: "$proId" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$proId"] } } }
                    ],
                    as: "productDetails"
                }
            },
            {
                $project: {
                    proId: "$proId",
                    quantity: "$quantity",
                    product: { $arrayElemAt: ["$productDetails", 0] },
                },
            },
            {
                $project: {
                    proId: "$product.proId",
                    quantity: 1,
                    image: "$product.image",
                    product: "$product.product",
                    subtotal: { $multiply: ["$quantity", "$product.price"] },
                    discountProduct: { $multiply: ["$quantity", "$product.discount"] },

                },
            },
            {
                $group: {
                    _id: null,
                    totalPrice: { $sum: "$subtotal" },
                    totalDiscount: { $sum: "$discountProduct" }
                }
            },
            {
                $project: {
                    totalPrice: 1,
                    totalDiscount: 1,
                    totalPriceAfterDiscount: { $subtract: ["$totalPrice", "$totalDiscount"] }
                }
            }
        ]);
        // Calculate total price of all products in the cart
        // Const totalPrice = data.reduce((total, product) => total + product.subtotal, 0);
        console.log(result, "result")
        const usersId = req.session.user._id
        const resultadd = await address.find({ userId: userId }).lean()
        const userdata = await User.findOne({ _id: usersId }).lean()
        var categoryOffer = req.session.categoryOffer
        console.log("checkout page")
        const shippingCharge = req.session.ship
        var totalPrice = (result[0].totalPriceAfterDiscount - categoryOffer) + shippingCharge
        console.log("checkout page 2")
        req.session.userdata = userdata
        req.session.resultadd = resultadd
        var couponDiscount = 0
        req.session.totalAmt = totalPrice
        console.log("ship", shippingCharge)
        const coupondata = await Coupon.find({ users: { $ne: userId } }).lean();

        for (let i = 0; i < data.length; i++) {
            console.log(data[i].quantity, data[i].product.quantity, "quantity")
            if (data[i].quantity > data[i].product.quantity) {
                console.log("outof stock")
                const Outofstock = "One product is out of stock"
                res.render("users/cart", { Outofstock, categoryOffer: req.session.categoryOffer, data, result, totalPrice, resultadd, userdata })
            }
        }

        console.log(couponDiscount, "discount", req.session.categoryOffer, "categoryoffer", shippingCharge, "ship", coupondata, "coupondata", data, "data", result, "result", resultadd, "resultadd", userdata, "userdata", totalPrice, "total")
        console.log("checkout page")
        res.render("users/checkout", { couponDiscount, categoryOffer: req.session.categoryOffer, shippingCharge, coupondata, data, result, resultadd, userdata, totalPrice })

    }
    
    catch (error) {
    console.log("Error in checkOut page")
}

}

// increment quantity

const incQuantity = async (req, res) => {
    const productId = req.params.id;
    const userId = req.session.user._id;

    try {
        // Fetch the current quantity of the product in the user's cart
        const cartItem = await cart.findOne({ userId, 'products.proId': productId });
        const currentQuantity = cartItem.products.find(item => item.proId === productId).quantity;

        // Check if the current quantity is less than 5 before incrementing
        if (currentQuantity < 5) {
            await cart.findOneAndUpdate(
                { userId, 'products.proId': productId },
                { $inc: { 'products.$.quantity': 1 } }
            );
        } else {
            console.log('Quantity limit reached for product:', productId);
        }
        res.redirect("/checkout");
    } catch (error) {
        console.log("Increment the quantity error:", error);
    }
};

// Decrement quantity

const decQuantity = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.user._id;

        // Fetch the current quantity of the product in the user's cart
        const cartItem = await cart.findOne({ userId, 'products.proId': productId });
        const currentQuantity = cartItem.products.find(item => item.proId === productId).quantity;

        // Check if the current quantity is greater than 1 before decrementing
        if (currentQuantity > 1) {
            await cart.updateOne(
                { userId, 'products.proId': productId },
                { $inc: { 'products.$.quantity': -1 } } // Use negative value to decrement
            );
            console.log("Decremented quantity for product:", productId);
        } else {
            console.log("Minimum quantity reached for product:", productId);
        }

        res.redirect("/checkout");
    } catch (error) {
        res.status(500).send("Error in decrementing quantity");
    }
};
// select address
const selectAddress = async (req, res) => {
    try {
        console.log("selsct address")
        console.log("select address", req.params.id)
        const selectedAddress = req.params.id;
        const userId = req.session.user._id
        // Now you can use the selectedAddress value as needed
        const data = await address.findOne({ _id: selectedAddress }).lean()
        const existData = await deliveryAddress.findOne().lean()

        if (existData) {
            const result = await deliveryAddress.findOneAndUpdate({ _id: existData._id }, {
                fullname: data.fullname, address: data.address,
                city: data.city, state: data.state,
                postalcode: data.postalcode, payment: data.payment, userId: userId
            })
        }
        else {
            const result = await deliveryAddress.create({
                fullname: data.fullname, address: data.address,
                city: data.city, state: data.state,
                postalcode: data.postalcode, payment: data.payment, userId: userId,
                phone: data.phone, email: data.email
            })
        }
        res.redirect("/checkout")
    }
    catch (error) {
        console.log("error in select address route in chekout controller")
    }
}
// save address
const postAddress = async (req, res) => {
    try {
        console.log(req.body)
        const userId = req.session.user._id
        console.log("userid address", userId)
        const check = await address.findOne({ fullname: req.body.fullname, address: req.body.address, email: req.body.email })
        if (check) {
            const message = "Address already exist."
            const totalPrice = req.session.totalAmount
            const resultadd = await address.find({ userId: userId }).lean()
            const userdata = await User.findOne({ _id: userId }).lean()
            const data = req.session.data
            const result = req.session.result
            console.log(data, result, "post address")
            res.render("users/checkout", { admin: false, data, message, result, resultadd, userdata, totalPrice })


        }
        else {
            const data = await address.create({
                userId: userId,
                fullname: req.body.fullname, address: req.body.address, postalcode: req.body.postalcode,
                city: req.body.city, payment: req.body.paymentMethod, state: req.body.state, phone: req.body.phone,
                email: req.body.email,
            })

            res.redirect("/checkout")
        }
    }
    catch (error) {
        console.log("error in post address route in checkoutcontroller")
    }
    //  res.render("users/success")
}
// post payment
const postPayment = async (req, res) => {
    try {
        console.log("payment")
        console.log("paramspayment", req.params.payment)
        const data = await deliveryAddress.findOne()

        const result = await deliveryAddress.findByIdAndUpdate({ _id: data._id }, { payment: req.params.payment })
        console.log("payment result", result)
        res.redirect("/checkout")
    }
    catch (error) {
        console.log("Error in save payment address in checkout controller")
    }
}
// selsect coupon
const selectCoupon = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.session.user._id;
        var categoryOffer = req.session.categoryOffer

        // Fetch necessary data concurrently
        const [coupondata, resultadd, userdata] = await Promise.all([
            Coupon.findOne({ _id: id }),
            address.find({ userId }).lean(),
            User.findOne({ _id: userId }).lean()
        ]);

        var totalAmount = req.session.totalAmt
        console.log("session", totalAmount)

        if (coupondata) {
            const total = req.session.result[0].totalPriceAfterDiscount;
            const multipledData = total * coupondata.discount;
            const couponDiscount = multipledData / 100;
            console.log("coupon")
            const totalPrice = totalAmount - couponDiscount;
            console.log("hai")
            // Update session data
            req.session.couponId = coupondata._id;
            req.session.totalAmt = totalPrice;
            req.session.couponDiscount = couponDiscount;
            console.log(totalPrice, "totalPrice")
            console.log("select coupon");
            console.log("fast");
            const couponMessage = "Only one coupon is used at one time"

            // Render the view with optimized data
            res.render("users/checkout", {
                couponDiscount,
                shippingCharge: req.session.ship,
                data: req.session.data,
                result: req.session.result,
                resultadd,
                userdata,
                categoryDiscount: req.session.categoryDiscount,
                totalPrice, couponMessage,
                categoryOffer: req.session.categoryOffer
            });

        }
    } catch (error) {
        console.error("Error in select coupon route in cart controller:", error);
        res.status(500).send("Internal Server Error");
    }
};

// order is successfull

const successOrder = async (req, res) => {
    try {
        console.log("order created")
        console.log(req.body.id, "bodyid")

        const userId = req.session.user._id
        const productId = req.session.productId
        // referal offer
        console.log(req.body.payment)
        req.session.payment = req.body.payment
        var data = req.session.data
        var result = req.session.result
        var usersId = req.session.user._id

        var resultadd = await address.find({ userId: userId }).lean()
        var userdata = await User.findOne({ _id: usersId }).lean()
        const DeliveryAd = await address.findOne({ _id: req.body.address }).lean()

        console.log("order")
        var saveOrder = await Order.create(
            {
                userId: userId,
                address: DeliveryAd,
                payment: req.body.payment,
                products: data,
                total: req.body.subtotal,
                discount: req.body.total_discount,
                totalPrice: req.body.total_price,
                ship: req.body.ship_charge,
                coupondiscount: req.body.coupon_dis,
                categoryDiscount: req.body.category_off,
                success: "failed"
            })
        if (req.body.id) {
            await Order.findByIdAndDelete({ _id: req.body.id })
            console.log("deleted")

        }
        console.log(saveOrder, "saveOrder")
        req.session.orderId = saveOrder._id
        if (req.body.payment) {
            for (let i = 0; i < data.length; i++) {

                if (data[i].quantity > data[i].product.quantity) {
                    const Outofstock = "One product is out of stock"



                    res.render("users/checkout", {
                        admin: false, Outofstock, data, result, resultadd, userdata, totalPrice
                    })
                }
                else {
                    const total = result[0]

                    if (req.body.payment == "cash-on-delivery") {
                        if (req.session.couponId) {
                            const couponData = await Coupon.findOne({ _id: req.session.couponId })
                            console.log("coupondata", couponData)
                            if (couponData) {
                                const updateData = await Coupon.findByIdAndUpdate(
                                    { _id: req.session.couponId },
                                    { $push: { users: userId } },
                                    { new: true } // To return the updated document
                                )

                                const updateOrder = await Order.findByIdAndUpdate({ _id: saveOrder._id }, { success: "success" })

                                const orderdata = await Order.find().sort({ _id: -1 }).lean()
                                var orderProduct = orderdata[0].products

                                for (let i = 0; i < orderProduct.length; i++) {

                                    var productdata = await products.findById({ _id: orderProduct[i].product._id })
                                    if (productdata) {
                                        var newProduct = await products.findOneAndUpdate(
                                            { _id: orderProduct[i].product._id },
                                            { $inc: { quantity: -orderProduct[i].quantity } }
                                        );
                                    }
                                }

                                if (req.session.referalofferdata) {

                                    const amount = req.session.referalofferdata

                                    const referalData = {
                                        userId: userId,
                                        orderId: saveOrder._id,
                                        amount: amount,
                                        status: "pending"
                                    }
                                    console.log("referaldata", referalData)
                                    const newreferdata = await referoffer.create(referalData)


                                }
                                else {
                                    console.log("not use referal code")
                                }

                                await cart.deleteMany({ userId: userId })
                                res.render("users/success")
                            }
                            else {
                                const invalidCoupon = "Coupon is Inavlid"
                                res.render("users/checkout", { data, shippingCharge: req.session.ship, couponDiscount: req.session.couponDiscount, result, resultadd, userdata, totalPrice, invalidCoupon })
                            }
                        }
                        else {
                            var totalAmount = req.session.totalAmt
                            const updateOrder = await Order.findByIdAndUpdate({ _id: saveOrder._id }, { success: "success" })
                            const orderdata = await Order.find().sort({ _id: -1 }).lean()
                            var orderProduct = orderdata[0].products
                            for (let i = 0; i < orderProduct.length; i++) {

                                var productdata = await products.findById({ _id: orderProduct[i].product._id })
                                if (productdata) {
                                    var newProduct = await products.findOneAndUpdate(
                                        { _id: orderProduct[i].product._id },
                                        { $inc: { quantity: -orderProduct[i].quantity } }
                                    );
                                }
                            }

                            await cart.deleteMany({ userId: userId })
                            res.render("users/success")

                        }

                    }



                    // online Paymenet
                    else if (req.body.payment == "online-payment") {
                        console.log("online payment")
                        if (req.session.couponDiscount) {
                            const couponData = await Coupon.findOne({ _id: req.session.couponId })
                            console.log("coupondata", couponData)

                            const createRazorpayOrder = async (totalAmountInPaisa) => {
                                try {
                                    const razorpayOrder = await raz.orders.create({
                                        amount: totalAmountInPaisa * 100, // Amount in paisa
                                        currency: 'INR',
                                        receipt: 'order_receipt_123',
                                    });

                                    req.session.razorid = razorpayOrder.id;
                                    req.session.razorpayOrder = razorpayOrder;

                                    return razorpayOrder; // Return the created order object
                                } catch (error) {
                                    console.error('Error creating Razorpay order:', error);
                                    throw error; // Throw the error for handling
                                }
                            }
                            // req.session.razorid = razorpayOrder.id;

                            var totalAmount = req.body.total_price

                            console.log("totalAmoung", totalAmount)
                            // Example: ₹500.00 (amount in paisa)

                            createRazorpayOrder(totalAmount)
                                .then(async (razorpayOrder) => {
                                    // Handle successful order creation

                                    var totalPrice = req.body.total_price


                                    // referal offer
                                    console.log("totalPrice", totalPrice)
                                    if (req.session.referalofferdata) {

                                        const amount = req.session.referalofferdata

                                        const referalData = {
                                            userId: userId,
                                            orderId: saveOrder._id,
                                            amount: amount,
                                            status: "pending"
                                        }

                                        const newreferdata = await referoffer.create(referalData)


                                    }
                                    else {
                                        console.log("not use referal code")
                                    }
                                    // coupon saved
                                    res.render("users/razorpay", { DeliveryAd, data, result, razorpayOrder, keyId: process.env.RAZORPAY_KEY_ID, totalPrice })
                                })
                        }
                        else {
                            console.log("error in with out coupon")
                            const createRazorpayOrder = async (totalAmountInPaisa) => {
                                try {
                                    const razorpayOrder = await raz.orders.create({
                                        amount: totalAmountInPaisa * 100, // Amount in paisa
                                        currency: 'INR',
                                        receipt: 'order_receipt_123',
                                    });

                                    req.session.razorid = razorpayOrder.id;
                                    req.session.razorpayOrder = razorpayOrder;

                                    return razorpayOrder; // Return the created order object
                                } catch (error) {
                                    console.error('Error creating Razorpay order:', error);
                                    throw error; // Throw the error for handling
                                }
                            }
                            console.log("error in with out coupon2")
                            // req.session.razorid = razorpayOrder.id;

                            var totalAmount = saveOrder.totalPrice
                            // Example: ₹500.00 (amount in paisa)

                            createRazorpayOrder(totalAmount)
                                .then(async (razorpayOrder) => {
                                    // Handle successful order creation
                                    var totalPrice = saveOrder.totalPrice
                                    // referal offer
                                    console.log("online payment")

                                    res.render("users/razorpay", { DeliveryAd, data, result, razorpayOrder, keyId: process.env.RAZORPAY_KEY_ID, totalPrice })
                                })
                        }
                    }
                    // wallet
                    else if (req.body.payment == "wallet") {
                        console.log(req.session.couponId, "couponId")
                        if (req.session.couponId) {
                            const couponData = await Coupon.findOne({ _id: req.session.couponId })
                            console.log("coupondata", couponData)
                            if (couponData) {
                                const updateData = await Coupon.findByIdAndUpdate(
                                    { _id: req.session.couponId },
                                    { $push: { users: userId } },
                                    { new: true } // To return the updated document
                                )
                                var totalAmount = req.body.total_price
                                const updateOrder = await Order.findByIdAndUpdate({ _id: saveOrder._id }, { success: "success" })

                                const orderdata = await Order.find().sort({ _id: -1 }).lean()
                                var orderProduct = orderdata[0].products

                                for (let i = 0; i < orderProduct.length; i++) {

                                    var productdata = await products.findById({ _id: orderProduct[i].product._id })
                                    if (productdata) {
                                        var newProduct = await products.findOneAndUpdate(
                                            { _id: orderProduct[i].product._id },
                                            { $inc: { quantity: -orderProduct[i].quantity } }
                                        );
                                    }
                                }

                                const id = saveOrder._id
                                const checkWallet = await wallet.find({ userId: userId })


                                const Amount = checkWallet[0].totalPrice - totalAmount


                                const walletData = {
                                    userId: userId,
                                    orderId: id,
                                    totalPrice: totalAmount,
                                    transactiontype: "Debit",
                                    reasontype: "Purchase",
                                    price: totalAmount
                                }


                                const newdata = await wallet.create(walletData)
                                console.log("wallet")

                                // coupon

                                // referal offer
                                if (req.session.referalofferdata) {


                                    const amount = req.session.referalofferdata


                                    const referalData = {
                                        userId: userId,
                                        orderId: saveOrder._id,
                                        amount: amount,
                                        status: "pending"

                                    }
                                    const newreferdata = await referoffer.create(referalData)


                                }

                                console.log("not use referal code")
                                await cart.deleteMany({ userId: userId })
                                res.render("users/success")

                            }
                            else {
                                const invalidCoupon = "Coupon is Inavlid"
                                res.render("users/checkout", { data, shippingCharge: req.session.ship, couponDiscount: req.session.couponDiscount, result, resultadd, userdata, totalPrice, invalidCoupon })
                            }
                        }
                        else {
                            var totalAmount = req.body.total_price

                            const updateOrder = await Order.findByIdAndUpdate({ _id: saveOrder._id }, { success: "success" })

                            const orderdata = await Order.find().sort({ _id: -1 }).lean()
                            var orderProduct = orderdata[0].products

                            for (let i = 0; i < orderProduct.length; i++) {

                                var productdata = await products.findById({ _id: orderProduct[i].product._id })
                                if (productdata) {
                                    var newProduct = await products.findOneAndUpdate(
                                        { _id: orderProduct[i].product._id },
                                        { $inc: { quantity: -orderProduct[i].quantity } }
                                    );
                                }
                            }

                            const id = saveOrder._id
                            const checkWallet = await wallet.find({ userId: userId })


                            const Amount = checkWallet[0].totalPrice - totalAmount


                            const walletData = {
                                userId: userId,
                                orderId: id,
                                totalPrice: totalAmount,
                                transactiontype: "Debit",
                                reasontype: "Purchase",
                                price: totalAmount
                            }


                            const newdata = await wallet.create(walletData)
                            console.log("wallet")

                            // coupon

                            // referal offer
                            if (req.session.referalofferdata) {


                                const amount = req.session.referalofferdata


                                const referalData = {
                                    userId: userId,
                                    orderId: saveOrder._id,
                                    amount: amount,
                                    status: "pending"

                                }
                                const newreferdata = await referoffer.create(referalData)


                            }

                            console.log("not use referal code")
                            await cart.deleteMany({ userId: userId })
                            res.render("users/success")

                        }

                    }
                }
            }
        }
        else {
            const resultadd = await address.find({ userId: userId }).lean()
            const userdata = await User.findOne({ _id: usersId }).lean()
            const paymentMesage = "please select payment method"
            res.render("users/checkout", { paymentMesage, resultadd, userdata, data, result })
        }
    }
    catch (error) {
        console.log("error in success order route in order page")
    }
}

// Razorpay checking
const razorpayChecking = async (req, res) => {
    try {
        var result = req.session.result
        var userId = req.session.user._id
        var crypto = require('crypto')
        var order = await Order.findOne({ _id: req.session.orderId })
        var totalAmount = order.totalPrice
        var razorpaysecret = process.env.RAZORPAY_SECRET_KEY;
        var hmac = crypto.createHmac("sha256", razorpaysecret)
        hmac.update(req.session.razorid + "|" + req.body.razorpay_payment_id);
        hmac = hmac.digest("hex");
        if (req.session.couponId) {

            const updateData = await Coupon.findByIdAndUpdate(
                { _id: req.session.couponId },
                { $push: { users: userId } },
                { new: true } // To return the updated document
            )

            console.log("razorpay1")
            if (hmac == req.body.razorpay_signature) {

                const data = req.session.data
                var result = req.session.result
                const DeliveryAd = await deliveryAddress.findOne().lean()
                const total = result[0]

                console.log("razorpay1")
                const updateOrder = await Order.findByIdAndUpdate({ _id: order._id }, { success: "success" })



                await cart.deleteMany({ userId: userId })
                if (req.session.referalofferdata) {


                    const amount = req.session.referalofferdata


                    const referalData = {
                        userId: userId,
                        orderId: order._id,
                        amount: amount,
                        status: "pending"

                    }
                    const newreferdata = await referoffer.create(referalData)


                }
                const orderdata = await Order.find().sort({ _id: -1 }).lean()
                var orderProduct = orderdata[0].products

                for (let i = 0; i < orderProduct.length; i++) {

                    var productdata = await products.findById({ _id: orderProduct[i].product._id })
                    if (productdata) {
                        var newProduct = await products.findOneAndUpdate(
                            { _id: orderProduct[i].product._id },
                            { $inc: { quantity: -orderProduct[i].quantity } }
                        );
                    }
                }

                res.render("users/success")
            }

            else {
                console.log("Paymnet is failed")
            }
        }
        else {
            if (hmac == req.body.razorpay_signature) {

                const data = req.session.data
                var result = req.session.result
                const DeliveryAd = await deliveryAddress.findOne().lean()
                const total = result[0]


                const updateOrder = await Order.findByIdAndUpdate({ _id: order._id }, { success: "success" })

                await cart.deleteMany({ userId: userId })
                if (req.session.referalofferdata) {


                    const amount = req.session.referalofferdata


                    const referalData = {
                        userId: userId,
                        orderId: order._id,
                        amount: amount,
                        status: "pending"

                    }
                    const newreferdata = await referoffer.create(referalData)


                }

                const orderdata = await Order.find().sort({ _id: -1 }).lean()
                var orderProduct = orderdata[0].products

                for (let i = 0; i < orderProduct.length; i++) {

                    var productdata = await products.findById({ _id: orderProduct[i].product._id })
                    if (productdata) {
                        var newProduct = await products.findOneAndUpdate(
                            { _id: orderProduct[i].product._id },
                            { $inc: { quantity: -orderProduct[i].quantity } }
                        );
                    }
                }

                res.render("users/success")
            }

            else {
                console.log("Paymnet is failed")
            }
        }
    }
    catch (Error) {
        console.log("Error in razorpay checking rpute in checkout controller")
    }
}
// delete Address
const deleteAddress = async (req, res) => {
    try {
        console.log("delete product")
        var id = req.params.id;

        await address.findByIdAndDelete({ _id: id });
        res.redirect('/checkout')
    }
    catch (error) {
        console.log("delete product")
    }
}
// getv edit address
const getEditAddress = async (req, res) => {
    try {

        var id = req.params.id
        const data = await address.findOne({ _id: id }).lean()

        res.render('users/edit-address', { data, id, })
    }
    catch (error) {
        console.log("get edit address error iin checkout controller")
    }
}
// post Edit product//
const postEditAddress = async (req, res) => {

    const addressId = req.params.id;
    console.log(req.body)
    const output = await address.findByIdAndUpdate({ _id: addressId }, {
        fullname: req.body.fullname, address: req.body.address,
        city: req.body.city, state: req.body.state,
        postalcode: req.body.postalcode, payment: req.body.payment
    })
    res.redirect("/checkout")
}
// *****************************referal offer*********************************
const referalOffer = async (req, res) => {
    try {
        console.log("req.body", req.body);
        // Check the value of referal
        let referal = req.body.referal + ""
        console.log("referal", referal);
        const data = await User.findOne({ referalcode: referal });

        console.log("data", data);

        if (data) {
            const userId = req.session.user._id
            if (req.session.checkoutTotal) {
                var totalPrice = req.session.checkoutTotal
            } else if (req.session.totalAmt) {
                var totalPrice = req.session.totalAmt
            } else {
                var totalPrice = req.seesion.total
            }

            const referalData = await referaloffer.findOne();
            if (referalData) {
                // const referalupdates = await referaloffer.findByIdAndUpdate({ _id: referalData._id }, { users: [userId], redeem: "Pending" })
                const referaldiscount = referalData.referalDiscount
                const offerdata = (totalPrice * referaldiscount) / 100
                req.session.referalofferdata = offerdata
                console.log("offerdata", offerdata)
                // const walletData = await wallet.findOne({ _id: userId })
                // if (walletData) {
                //     console.log(walletData)
                //     const total = walletData.totalPrice
                //     console.log("total", total)
                //     const walletTotal = total + offerdata
                //     console.log("wallet total", walletTotal)
                //     const walletUpdation = await wallet.findByIdAndUpdate({ _id: userId }, { totalPrice: totalAfterOffer })
                // }
                // else{
                //     const createWallet=await wallet.create({userId:userId,totalPrice:offerdata})
                // }

                res.redirect("/checkout")
            }
        } else {
            const Message = "Referal code is incorrect"
            const userdata = req.session.userdata;
            const resultadd = req.session.resultadd;
            const result = req.session.result
            const data = req.session.data
            const totalPrice = req.session.totalAmount

            res.render("users/checkout", { admin: false, data, result, resultadd, userdata, totalPrice })

            console.log("No data found for referalcode:", offer);
        }

    } catch (error) {
        console.log("Error in referral offer in checkout controller", error);
    }
}

module.exports = {
    checkoutPage, incQuantity,
    decQuantity, postAddress,
    successOrder, selectAddress,
    deleteAddress, getEditAddress,
    postEditAddress, postPayment,
    razorpayChecking, referalOffer, selectCoupon
}

