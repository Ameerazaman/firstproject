const express = require('express')
const mongoose = require('mongoose');
const { verifyUser, blockMiddleware } = require('../../middlewares/middleware');
const { GetWishlist, addToWishlist, deleteWishlistproduct, addToCartWishlist } = require('../../controllers/user/wishlistController');
const router = express.Router()

// ******************************************Wish list*********************

// get wishlist
router.get("/",verifyUser,blockMiddleware,GetWishlist)
// add product in wishlist
router.get("/add-product/:id",verifyUser,blockMiddleware,addToWishlist)

// delet wproduct from wishlist
router.delete("/delete/:id",verifyUser,blockMiddleware,deleteWishlistproduct)
// add to cart
router.get("/add-to-cart/:id",verifyUser,blockMiddleware,addToCartWishlist)

module.exports = router;