const express = require('express')
const mongoose = require('mongoose');
const router = express.Router()
const { verifyUser, blockMiddleware } = require('../../middlewares/middleware');
const { addToCart, deleteCart, incrementQuantity, decrementQuantity, getCart, checkoutPage, categoryOffer } = require('../../controllers/user/cartController');
const cart=require("../../models/user/add-to-cart-model")


// get cart page
router.get("/cartpage",verifyUser,blockMiddleware,getCart)
// /product add- to cart car page
router.get("/add-to-cart/:id",verifyUser,blockMiddleware,addToCart)

// delete cart
router.delete("/deletecart/:id",verifyUser ,blockMiddleware,deleteCart)

// incrrement the quantity
router.put("/inc_qty/:id", verifyUser, blockMiddleware, incrementQuantity);

// decrement quantity

router.put("/dec_qty/:id",verifyUser,blockMiddleware,decrementQuantity)

// use coupn

// category offer
router.get("/categoryOffer/:id",verifyUser,blockMiddleware,categoryOffer)
// *******************************************CheckOut Page****************************************




module.exports = router;