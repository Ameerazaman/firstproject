const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const users = require('../../models/user/usermodel')
const nodemailer = require('nodemailer')
const { doSignup, getLogin, postLogin, getSignup, otpSubmit, postSignup, resendOtp, getProductDetail, userLogout, getcategory, homePage, getForgot, getForgotOtp, forgotOtpVerify, changeForgotPassword, filter, search, searchProducts, getproduct, getMobile, getFilterCategory, categorySort, cartCount, wishlistCount } = require('../../controllers/user/userControllers')
const products = require('../../models/admin/productModel')
const category = require('../../models/admin/categorymodel')
const { verifyUser, blockMiddleware, } = require('../../middlewares/middleware')
const { addToCart, deleteCart } = require('../../controllers/user/cartController')
const { deleteProfile } = require('../../controllers/user/userprofileController')
//////////
//Otp generation//
// get Home Page
router.get("/home",homePage)
//Get login page
router.get('/',getLogin)

//Post Login page
router.post('/login',postLogin)

//get Signup page

router.get('/signup', getSignup)
  
// post signup
router.post('/signup' ,postSignup)

//otp submit
router.post('/signup/verification',verifyUser,otpSubmit)

////********************Resend OTP*********************/
router.get('/resend-otp',verifyUser,resendOtp)
//Get product detail page
router.get("/product-detail/:id",verifyUser,blockMiddleware, getProductDetail)

//user Logout
router.get("/logout",verifyUser,userLogout)

//add to cart


//get category
router.get("/category/:category",verifyUser,blockMiddleware,getcategory)
// 8**********************************forgott password****************************
// get forgot page
router.get("/forgotpassword",getForgot)
// post forgot email page
router.post("/forgotpassword",getForgotOtp)
// post forgot otp verify
router.post("/forgototpverify",forgotOtpVerify)
// change forgot password
router.post("/change-forgot-password",changeForgotPassword)

//*********************************filter*********************************
router.get("/filter/:category", verifyUser, blockMiddleware, getFilterCategory);
// filter
router.post("/filter",verifyUser,blockMiddleware,filter)
// filter based on category
router.post("/filter/:filterCategory",verifyUser,blockMiddleware,categorySort)

//***********************************Search products********************************

router.post("/search",verifyUser,blockMiddleware,searchProducts)

//*************************************product page***********************************

router.get("/product",verifyUser ,blockMiddleware,getproduct)


// ************************************header****************************
// cart count
router.get("/cart/count",verifyUser,blockMiddleware,cartCount)
// wishlist count
router.get("/wishlist/count",verifyUser,blockMiddleware,wishlistCount)


module.exports = router;