const express = require('express')
const mongoose = require('mongoose');
const { verifyAdmin } = require('../../middlewares/middleware');
const { getOffer, addOffer, editOffer } = require('../../controllers/admin/referalOffer');
const router = express.Router()


// get offer page
router.get("/",verifyAdmin,getOffer)
// create or add offer
router.post("/create",verifyAdmin,addOffer)
// edit offer
router.post("/edit-offer/:id",verifyAdmin,editOffer)

module.exports = router;