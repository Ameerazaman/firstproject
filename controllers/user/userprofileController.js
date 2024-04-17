const mongoose = require('mongoose')
var easyinvoice = require('easyinvoice')
var fs = require('fs')
const User = require("../../models/user/usermodel")
const products = require("../../models/admin/productModel")
const category = require('../../models/admin/categorymodel')
const nodemailer = require('nodemailer')

const cart = require("../../models/user/add-to-cart-model")
const personalprofile = require('../../models/user/personalmodel')
const { ResultWithContextImpl } = require('express-validator/src/chain')
const address = require('../../models/user/addressmodel')
const Order = require('../../models/user/ordermodel')
const wallet = require('../../models/user/walletmodel')
const referaloffer = require('../../models/admin/referalofferModel')
const referoffer = require('../../models/user/referOffermodel')

// /*************************************User profile********************************* */
// get profilepage

const getProfile = async (req, res) => {
    try {

        const userId = req.session.user._id
        const result = await personalprofile.findOne({ userId: userId }).lean()
        const cartcount = req.session.cartcount
        const existuser = await User.findOne({ _id: userId }).lean()

        // const password = existuser.password
        console.log("existuser", existuser)
        if (result) {
            res.render("users/user-profile", { result, existuser })
        }
        else {
            res.render("users/user-profile", { existuser, cartcount })
        }
    }
    catch (error) {
        console.log("error in get profile route in userprofile controller")
    }
}

// create profile(personal information)

const postPersonalProfile = async (req, res) => {
    try {
        console.log("personal profile")
        const userId = req.session.user._id
        const result = await personalprofile.findOne({ userId: userId }).lean()
        if (result) {
            const data = await personalprofile.findByIdAndUpdate({ _id: result._id },
                {
                    fullname: req.body.fullname, email: req.body.email, phone: req.body.phone,
                    city: req.body.city, postalcode: req.body.postalcode, state: req.body.state,
                    userId: userId
                })
            res.redirect("/user-profile")
        }
        else {
            const data = await personalprofile.create({
                fullname: req.body.fullname, email: req.body.email, phone: req.body.phone,
                city: req.body.city, postalcode: req.body.postalcode, state: req.body.state,
                userId: userId, address: req.body.address
            })
            const result = await personalprofile.findOne({ userId: userId }).lean()
            console.log("result", result)
            res.render("users/user-profile", { result })
        }
    }
    catch (error) {
        console.log("error in personal Profile page in user profile controller")
    }
}


// Chenge password

const changePassword = async (req, res) => {
    try {
        console.log(req.body)
        const check = await User.findById({ _id: req.params.id, password: req.body.password })
        console.log(check)
        if (check) {
            const data = await User.findByIdAndUpdate({ _id: req.params.id }, { password: req.body.newpassword })

            res.redirect("/user-profile")
        }
        else {
            const message = "Exist password is not match"
            res.render("users/user-profile", { message })
        }

    }
    catch (error) {
        console.log("error in change password route in user profile controller")
    }
}

// Delete the profile
const deleteProfile = async (req, res) => {
    try {

        const data = await personalprofile.findByIdAndDelete({ _id: req.params.id })
        res.redirect("/user-profile")
    }
    catch (error) {
        console.log("Error in delete profile route in user profile controller")
    }
}
// *****************************************Address Mangement********************************
// get address mgt page
const getAddressMgt = async (req, res) => {
    try {
        const userId = req.session.user._id
        const resultadd = await address.find({ userId: userId }).lean()
        const cartcount = req.session.cartcount
        if (resultadd) {
            res.render("users/manage-address", { resultadd, cartcount })
        }
        else {
            const message = "Please add your Address"
            res.render("users/manage-address", { message, cartcount })
        }
    }
    catch (error) {
        console.log("error in get Address mangemnet route in user profile route")
    }
}

// post or save address in address management

const postAddressMgt = async (req, res) => {
    try {
        const userId = req.session.user._id
        const data = await address.findOne({
            fullname: req.body.fullname, address: req.body.address,
            city: req.body.city, postalcode: req.body.postalcode,
            userId: userId
        })

        if (data) {

            const message = "Address Already Exist"
            const resultadd = await address.find({ userId: userId }).lean()
            res.render("users/manage-address", { message, resultadd })
        }
        else {

            const newdata = await address.create({
                fullname: req.body.fullname, address: req.body.address,
                city: req.body.city, postalcode: req.body.postalcode, phone: req.body.phone, email: req.body.email,
                userId: userId
            })
            res.redirect("/user-profile/address-mgt")
        }

    }
    catch (error) {
        console.log("Error in Post address Mgt Route in user profile controller")
    }
}
// get invoice
const getInvoice = async (req, res) => {
    try {
        console.log("Invoice download");

        // Find the order by ID
        const orderId = req.params.id;
        const orderdata = await Order.findOne({ _id: orderId }).lean();
        console.log("orderdata", orderdata);
        const productName = orderdata.products[0].product.product
        const total = orderdata.totalPrice

        if (!orderdata) {
            return res.status(404).send('Order not found');
        }


        const products = orderdata.products.map(product => ({
            quantity: product.quantity,
            description: productName,

            price: total
        }));

        var data = {
            apiKey: "free",
            mode: "development",
            products: products // Use the extracted products array
        };

        // Generate the invoice
        easyinvoice.createInvoice(data, async function (result) {
            console.log('PDF base64 string: ', result.pdf);

            if (result.pdf) {
                try {
                    // Write PDF data to a file
                    await fs.promises.writeFile('invoice.pdf', result.pdf, 'base64');
                    console.log('PDF file successfully created: invoice.pdf');

                    // Send the PDF file as a response
                    res.download('invoice.pdf', 'invoice.pdf', function (err) {
                        if (err) {
                            console.error('Error downloading invoice:', err);
                            res.status(500).send('Failed to download invoice');
                        } else {
                            console.log('Invoice downloaded successfully');
                        }
                    });
                } catch (writeError) {
                    console.error('Error writing PDF file:', writeError);
                    res.status(500).send('Failed to generate invoice');
                }
            } else {
                console.error('Failed to generate PDF. No data received.');
                res.status(500).send('Failed to generate invoice');
            }
        });
    } catch (error) {
        console.error("Error in getInvoice route in user profile controller:", error);
        res.status(500).send('Internal Server Error');
    }
}


// Delete Addres mgt
const deleteAddressManagement = async (req, res) => {
    try {
        console.log("delete address")
        var id = req.params.id;
        const data = await address.findOne({ _id: id }).lean()
        await address.findByIdAndDelete({ _id: id })
        console.log("addressmgt", data)
        res.redirect('/user-profile/address-mgt')
    }
    catch (error) {
        console.log("delete product")
    }
}
// getv edit address
const getEditAddressmgt = async (req, res) => {
    try {


        var id = req.params.id
        const data = await address.findOne({ _id: id }).lean()

        res.render('users/edit-addressmgt', { data, id, })
    }
    catch (error) {
        console.log("get edit address error iin checkout controller")
    }
}
// post Edit product//
const postEditAddressmgt = async (req, res) => {

    const addressId = req.params.id;
    const userId = req.session.user._id
    const output = await address.findByIdAndUpdate({ _id: addressId }, {
        fullname: req.body.fullname, address: req.body.address,
        city: req.body.city, state: req.body.state,
        postalcode: req.body.postalcode, payment: req.body.paymment,
        userId: userId
    })
    res.redirect("/user-profile/address-mgt")
}


// ***********************************Order*****************************************
// get order page
const getOrder = async (req, res) => {
    try {
        const cartcount = req.session.cartcount
        const userId = req.session.user._id
        const data = await Order.find({ userId: userId }).sort({ _id: -1 }).lean()

        res.render("users/order", { data, cartcount })
    }
    catch (error) {
        console.log("Error in get Order route in userprofile controller")
    }
}


// getOrder deatil apge
const getOrderDetail = async (req, res) => {
    try {
        const cartcount = req.session.cartcount
        console.log(req.params.id)
        const data = await Order.findOne({ _id: req.params.id })
        console.log(data, "data")
        const addressdata = data.address
        const payment = data.payment
        const total = data.total
        const discount = data.discount
        const status = data.status
        const totalprice = data.totalPrice
        const date = data.orderedAt
        const id = data._id
        const ship = data.ship
        const categoryDiscount = data.categoryDiscount
        const success = data.success
        const coupondiscount=data.coupondiscount
        
        if (success === "failed") {
            var failed="Retry"
           
            if (data.status == "canceled") {
               
                var cancel = "Order is Canceled";
                res.render("users/order-detail", { failed,success,coupondiscount,  cartcount, categoryDiscount, ship, data, addressdata, payment, total, discount, status, date, totalprice, id, cancel })
            }
            else if (data.status == "delivered") {
             
                const deliver = "order delivered";
                res.render("users/order-detail", { failed,success,coupondiscount,  cartcount, categoryDiscount, ship, data, addressdata, payment, total, discount, status, date, totalprice, id, deliver })
            }
            else if (data.status == "Return") {
              
                var Return = "Order is Returened"
                res.render("users/order-detail", { failed,success,coupondiscount,  cartcount, categoryDiscount, ship, data, addressdata, payment, total, discount, status, date, totalprice, id, Return })

            }
            else {
               
                res.render("users/order-detail", { failed,success,coupondiscount,  cartcount, categoryDiscount, ship, data, addressdata, payment, total, discount, status, date, totalprice, id })
            }

        }
        else {
            if (data.status == "canceled") {
                var cancel = "Order is Canceled";
                res.render("users/order-detail", { success, cartcount, categoryDiscount, ship, data, addressdata, payment, total, discount, status, date, totalprice, id, cancel })
            }
            else if (data.status == "delivered") {
                const deliver = "order delivered";
                res.render("users/order-detail", { success, cartcount, categoryDiscount, ship, data, addressdata, payment, total, discount, status, date, totalprice, id, deliver })
            }
            else if (data.status == "Return") {
                var Return = "Order is Returened"
                res.render("users/order-detail", { success, cartcount, categoryDiscount, ship, data, addressdata, payment, total, discount, status, date, totalprice, id, Return })

            }
            else {
                res.render("users/order-detail", { success, cartcount, categoryDiscount, ship, data, addressdata, payment, total, discount, status, date, totalprice, id })
            }
        }
    }
    catch (error) {
        console.log("Error in get order detail page in user profile controller")
    }
}

// Order cancelation

const orderCancel = async (req, res) => {
    try {
        const userId = req.session.user._id
        console.log(req.params.id)
        const datas = await Order.findByIdAndUpdate({ _id: req.params.id }, { status: "canceled" })
        console.log(req.params.id)

        const data = await Order.findOne({ _id: req.params.id })
        const addressdata = data.address
        const payment = data.payment
        const total = data.total
        const discount = data.discount
        const status = data.status
        const totalprice = data.totalPrice
        const date = data.orderedAt
        const id = data._id
        console.log(data.payment)
        const cancel = "Order cancelled"
        //   quatity update at the time of cancel the ordder
        const orderdata = await Order.find({ _id: req.params.id }).lean();

        var orderProduct = orderdata[0].products;

        for (let i = 0; i < orderProduct.length; i++) {

            var productdata = await products.findById(orderProduct[i].product._id);

            if (productdata) {
                console.log("quantity", orderProduct[i].quantity);
                await products.findByIdAndUpdate(
                    orderProduct[i].product._id,
                    { $inc: { quantity: orderProduct[i].quantity } }
                );
                // 
                var newProduct = await products.findOneAndUpdate(
                    { _id: orderProduct[i].product._id },
                    { $inc: { stockLeft: -orderProduct[i].quantity } }
                );
            }
        }
        let totalPrice = 0;


        data.products.forEach(product => {

            totalPrice += product.product.price;
        });
        console.log("total price", totalPrice)
        // create wallet
        const walletData = {
            userId,
            orderId: id,
            totalPrice: totalprice,
            transactiontype: "credit",
            reasontype: "refund",
            price: totalPrice
        }

        const newdata = await wallet.create(walletData)
        res.render("users/order-detail", { cancel, data, addressdata, payment, total, discount, status, date, totalprice, id })
    }
    catch (error) {
        console.log("error in cancel order route in userprofile controller")
    }
}
// return order

const orderReturn = async (req, res) => {
    try {
        const userId = req.session.user._id
        console.log(req.params.id)
        const datas = await Order.findByIdAndUpdate({ _id: req.params.id }, { status: "Return" })
        console.log(req.params.id)
       
        const data = await Order.findOne({ _id: req.params.id })
        const addressdata = data.address
        const payment = data.payment
        const total = data.total
        const discount = data.discount
        const status = data.status
        const totalprice = data.totalPrice
        const date = data.orderedAt
        const id = data._id
        console.log(data.payment)
        const Return = "order Returned"

        //   quatity update at the time of cancel the ordder
        const orderdata = await Order.find({ _id: req.params.id }).lean();

        var orderProduct = orderdata[0].products;

        for (let i = 0; i < orderProduct.length; i++) {

            var productdata = await products.findById(orderProduct[i].product._id);

            if (productdata) {
                console.log("quantity", orderProduct[i].quantity);
                await products.findByIdAndUpdate(
                    orderProduct[i].product._id,
                    { $inc: { quantity: orderProduct[i].quantity } }
                );
                // 
                var newProduct = await products.findOneAndUpdate(
                    { _id: orderProduct[i].product._id },
                    { $inc: { stockLeft: -orderProduct[i].quantity } }
                );
            }
        }
        let totalPrice = 0;


        data.products.forEach(product => {

            totalPrice += product.product.price;
        });
        console.log("total price", totalPrice)
        // create wallet
        const walletData = {
            userId,
            orderId: id,
            totalPrice: totalprice,
            transactiontype: "credit",
            reasontype: "refund",
            price: totalPrice
        }

        const newdata = await wallet.create(walletData)
        res.render("users/order-detail", { Return, data, addressdata, payment, total, discount, status, date, totalprice, id })
    }
    catch (error) {
        console.log("error in cancel order route in userprofile controller")
    }
}
// ***************************************Wallet*************************************
const walletPage = async (req, res) => {
    try {
        const cartcount = req.session.cartcount
        const userId = req.session.user._id
        const data = await wallet.find({ userId: userId }).sort({ _id: -1 }).lean()
        console.log(data,"wallet")
        if(data.length>0){
        const creditTotal = await wallet.aggregate([
            {
                $match: {
                    transactiontype: "credit",
                    userId:userId
                }
            },
            {
                $group: {
                    _id: null,
                    totalCredit: {
                        $sum: "$totalPrice"
                    }
                }
            }
        ]);
        console.log("creditTotal",creditTotal)
        
        // Second stage of aggregation to calculate the total debit amount
        const debitTotal = await wallet.aggregate([
            {
                $match: {
                    transactiontype: "Debit",
                    userId:userId
                }
            },
            {
                $group: {
                    _id: null,
                    totalDebit: {
                        $sum: "$totalPrice"
                    }
                }
            }
        ]);
        const total=creditTotal[0].totalCredit-debitTotal[0].totalDebit
        
        res.render("users/wallet", { data, total, cartcount });
    }
    else{
        var empty="your wallet is empty"
        res.render("users/wallet", {empty});  
    }
    }
    catch (error) {
        console.log("Error in wallet page route in userprofile controller")
    }
}
// ******************************************Offer**********************
// referal offer
const getOffer = async (req, res) => {
    try {
        const userId = req.session.user._id
        const cartcount = req.session.cartcount
        const data = await User.findById({ _id: userId })
        const referal = data.referalcode
        if (referal) {
            // const referal=await referaloffer.find({userId:userId})
            const referaldata = await referoffer.find({ userId: userId }).sort({ _id: -1 }).lean()
            res.render("users/offers", { referal, referaldata, cartcount })
        }
        else {
            res.render("users/offers")
        }
    }
    catch (error) {
        console.log("error in get offer route in user profile controller")
    }
}
// create referal code

const CreateReferalCode = async (req, res) => {
    try {

        function generateReferralCode() {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let referralCode = '';
            for (let i = 0; i < 8; i++) {
                referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return referralCode;
        }
        const referal = generateReferralCode()
        const userId = req.session.user._id
        const data = await User.findByIdAndUpdate({ _id: userId }, { referalcode: referal })

        req.session.referal = referal
        res.redirect("/user-profile/offer")

    }
    catch (error) {
        console.log("Error inreferal code in userprofile route")
    }
}


// send referal code to friend
const sendReferalCode = async (req, res) => {
    try {
        const email = req.body.email
        const userId = req.session.user._id
        const data = await User.findById({ _id: userId })
        const referal = data.referalcode
        async function main() {
            const transport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'fathimathameeraap@gmail.com',
                    pass: 'eply owri jdtq pgse',
                }
            })
            const info = await transport.sendMail({
                from: 'fathimathameeraap@gmail.com',
                to: email,
                // req.session.email,
                subject: 'Reference offer',
                text: `Your referalcode: ${referal}`

            })
            console.log("referal code" + info.messageId)
            console.log("referaklcode", referal)
        }
        main();
        res.redirect("/user-profile/offer")
    }
    catch (error) {
        console.log("Error in send referal code in userprofile controlleer")
    }
}

// Redeem referal offer
const redeemOffer = async (req, res) => {
    try {
        console.log("redeem offer")
        console.log("id", req.params.id)
        const id = req.params.id

        const referalData = await referoffer.findByIdAndUpdate(
            id, // The ID of the document to update
            { status: "redeem" }, // The update operation
            { new: true } // Options: returns the updated document
        ); console.log("referalDatauserid", referalData.userId)
        console.log("referalData", referalData)
        const walletData = await wallet.findOneAndUpdate(
            { userId: referalData.userId },
            { $inc: { totalPrice: referalData.amount } },
            { new: true }
        );

        console.log("walletData", walletData)
        res.redirect("/user-profile/offer")
    }
    catch (error) {
        console.log("error in redeem offer route in user profile controller")
        res.render("users/404")
    }
}
module.exports = {

    getProfile, postPersonalProfile,
    changePassword, getAddressMgt,
    postAddressMgt, postEditAddressmgt,
    deleteAddressManagement, getEditAddressmgt,
    getOrder, getOrderDetail,
    orderCancel, deleteProfile,
    walletPage, getOffer,
    CreateReferalCode, sendReferalCode,
    redeemOffer, orderReturn, getInvoice

}


