const express = require('express')
const mongoose = require('mongoose');
const { verifyAdmin } = require('../../middlewares/middleware');
const { getOrder, changeStatus } = require('../../controllers/admin/orderController');
const router = express.Router()


// get order page
router.get("/",verifyAdmin,getOrder)
// cchange status
router.get("/change-status/:id/:status",verifyAdmin,changeStatus)
module.exports = router;