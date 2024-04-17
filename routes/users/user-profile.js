const express = require('express')
const mongoose = require('mongoose');
const { verifyUser, blockMiddleware } = require('../../middlewares/middleware');
const { getProfile, postPersonalProfile, getAddressMgt, postAddressMgt, deleteAddressMgt, getEditAddressmgt, postEditAddressmgt, getOrder, getOrderDetail, changePassword, orderCancel, deleteProfile, walletPage, returnOrder, getOffer, CreateReferalCode, sendReferalCode, redeemOffer, deleteAddressManagement, orderReturn, getInvoice } = require('../../controllers/user/userprofileController');
const router = express.Router()


// *******************************User profile******************************
// get profile page
router.get("/",verifyUser,getProfile)
// post create personal profile
router.post("/personal-information",verifyUser,blockMiddleware,postPersonalProfile)
// change password
router.post("/change-password/:id",verifyUser,blockMiddleware,changePassword)
// delete profile
router.get("/delete/:id",verifyUser,blockMiddleware,deleteProfile)

// **************************Address Mangement***********************


// get address mangment page
router.get("/address-mgt",verifyUser,blockMiddleware,getAddressMgt)
// post address management page
router.post("/address-mgt",verifyUser,blockMiddleware,postAddressMgt)
// delete address from address mgt 
router.get("/delete-address/:id",verifyUser,blockMiddleware,deleteAddressManagement)
// edit address from address mgt
router.get("/edit/:id",verifyUser,blockMiddleware,getEditAddressmgt)
// post edit Address
router.post("/edit-addressmgt/:id",verifyUser,blockMiddleware,postEditAddressmgt)

// ****************************Order***********************************

// get Order page
router.get("/order",verifyUser,blockMiddleware,getOrder)
// get order deatil page
router.get("/order-detail/:id",verifyUser,blockMiddleware,getOrderDetail)
// cancel Order
router.get("/order-cancel/:id",verifyUser,blockMiddleware,orderCancel)
// return Order
router.get("/order-return/:id",verifyUser,blockMiddleware,orderReturn)
//  get invoice
router.get("/invoice/:id",verifyUser,blockMiddleware,getInvoice) 
// router.get("/order-return/:id",verifyUser,returnOrder)
// ************************************Wallet***************************

// get wallet page
router.get("/wallet",verifyUser,blockMiddleware,walletPage)

//*************************************offer************************** */
// get offer
router.get("/offer",verifyUser,blockMiddleware,getOffer)
// create referal code
router.get("/create-referalcode",verifyUser,blockMiddleware,CreateReferalCode)
// send referal offer
router.post("/referal-offers",verifyUser,blockMiddleware,sendReferalCode)
// redeem offer
router.get("/redeem/:id",verifyUser,blockMiddleware,redeemOffer)


module.exports = router;