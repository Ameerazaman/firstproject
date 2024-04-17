const express = require('express')
const mongoose = require('mongoose');
const { verifyAdmin } = require('../../middlewares/middleware');
const { getDashboard } = require('../../controllers/admin/dashboarController');
const router = require('./coupon');

router.get("/",verifyAdmin,getDashboard)

module.exports = router;