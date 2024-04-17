const mongoose = require('mongoose')
const coupon = require('../../models/admin/couponmodel')

// get coupon

const getCoupon = async (req, res) => {
    try {
        const data = await coupon.find().lean()
        res.render("admin/coupon", { admin: true, data })
    }
    catch (error) {
        console.log("Error in getcoupon route in getcoupon controller")
    }
}

//  const add coupon
const getaddCoupon = async (req, res) => {
    try {

        res.render("admin/couponcreation", { admin: true })
    }
    catch (error) {
        console.log("Error in addcoupon route in addcoupon controller")
    }
}
// create addcoupon
const addCoupon = async (req, res) => {
    try {
        // Function to generate a random alphanumeric string of given length
        function generateCouponCode(length) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let couponCode = '';
            for (let i = 0; i < length; i++) {
                couponCode += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return couponCode;
        }

        // Generate a coupon code with 10 characters
        const couponCode = generateCouponCode(10);
        console.log('Generated Coupon Code:', couponCode);
        console.log("coupon reqbody", req.body.expirationDate)
        const today = new Date(); // Get today's date as a Date object
        const expirationDate = new Date(req.body.expirationDate); // Convert expiration date from req.body to Date object
        
        console.log("today", today, expirationDate);
        
        if (today.getTime() >= expirationDate.getTime()) {
            res.render("admin/couponcreation", { admin: true, message: "This date is not accepted... please select a future date" });
        } else {
            const data = await coupon.create({
                code: couponCode,
                discount: req.body.discount,
                minAmount: req.body.minAmount,
                expirationDate: expirationDate
            });
            
            console.log("datacoupon", data);
            res.redirect("/coupon");
        }
        
    }
    catch (error) {
        console.log("ErrorError in add or create coupon route in coupon controller ")
    }
}
// delete coupon

const deleteCoupon = async (req, res) => {
    try {
        const data = await coupon.findByIdAndDelete({ _id: req.params.id })
        res.json(data)
    }
    catch (error) {
        console.log("Error in delete coupon route in coupon controller")
    }
}
module.exports = { getCoupon, addCoupon, getaddCoupon, deleteCoupon }