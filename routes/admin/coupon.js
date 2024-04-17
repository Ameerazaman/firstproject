const express = require('express')
const mongoose = require('mongoose');
const { verifyAdmin } = require('../../middlewares/middleware');
const { getOrder, changeStatus } = require('../../controllers/admin/orderController');
const { getCoupon, addCoupon, getaddCoupon, deleteCoupon } = require('../../controllers/admin/coupon Controller');
const router = express.Router()

// get coupon
router.get("/",verifyAdmin,getCoupon)
// get addcoupon page
router.get("/add-coupon",verifyAdmin,getaddCoupon)
// create coupon
router.post("/add-coupon",verifyAdmin,addCoupon)
// delete coupon
router.delete("/delete/:id",verifyAdmin,deleteCoupon)


module.exports = router;