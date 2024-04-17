const express = require('express')
const mongoose = require('mongoose');
const router = express.Router()
const { verifyUser, blockMiddleware } = require('../../middlewares/middleware');
const { addToCart, deleteCart, incrementQuantity, decrementQuantity, getCart } = require('../../controllers/user/cartController');
const cart=require("../../models/user/add-to-cart-model");
const { checkoutPage, incQuantity, decQuantity, postAddress, successOrder, selectAddress,deleteAddress, getEditAddress, postEditAddress, postPayment, razorpayChecking, referalOffer, selectCoupon } = require('../../controllers/user/checkoutController');

// GET CHECKoUT PAGE
router.get("/",verifyUser,blockMiddleware,checkoutPage)
// increment quantity
router.get("/quantityinc/:id",verifyUser,blockMiddleware,incQuantity)
// select coupon
router.get("/select-coupon/:id",verifyUser,blockMiddleware,selectCoupon)
// decrement quantity

router.get("/quantitydec/:id",verifyUser,blockMiddleware,decQuantity)
// select Address
router.get("/select-Address/:id",verifyUser,blockMiddleware,selectAddress)
// save address
router.post("/save-address",verifyUser,blockMiddleware,postAddress)
// save payment
// router.get("/save-payment/:payment",verifyUser,blockMiddleware,postPayment)
// order is success
router.post("/create-order",verifyUser,blockMiddleware,successOrder)
// checking razorpay
router.post("/razorpay/callback", verifyUser,blockMiddleware, razorpayChecking);
// get Edit Address
router.get("/edit/:id",verifyUser,blockMiddleware,getEditAddress)
// post edit Address
router.post("/edit-address/:id",verifyUser,blockMiddleware,postEditAddress)
// Delete Address
router.get("/delete/:id",verifyUser,blockMiddleware,deleteAddress)
// *************************referal offer***************
router.post("/referal-offer",verifyUser,blockMiddleware,referalOffer)
module.exports = router;