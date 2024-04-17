const mongoose = require('mongoose')
const User = require("../../models/user/usermodel")
const products = require("../../models/admin/productModel")
const category = require('../../models/admin/categorymodel')
const nodemailer = require('nodemailer')
const wishlist = require('../../models/user/wishlist-model')
const cart = require("../../models/user/add-to-cart-model")
const Users = require('../../models/user/usermodel')

// generate otp//
function generateOTP(limit) {
    var digits = '0123456789';
    let otp = '';
    for (let i = 0; i < limit; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;

}

// get home page
const homePage = async (req, res) => {
    if (req.session.username) {
        const userId = req.session.user._id;
        const newdata = await products.find().limit(4).sort({ _id: -1 }).lean()
        const cartCount = await cart.find({ userId: userId })
        console.log("cartcount", cartCount.length)
        const categorydata = await category.find({ isUnlist: { $ne: true } }).lean()
        const productdata = await products.find().limit(4).lean()
        const product = await products.find().lean()

        if (product) {

            for (let i = 0; i < product.length; i++) {

                if (product[i].quantity < 1) {

                    const result = await products.findByIdAndUpdate({ _id: product[i]._id }, { status: "Out of Stock" })

                }
                else if (product[i].quantity > 10) {

                    const result = await products.findByIdAndUpdate({ _id: product[i]._id }, { status: "Published" })
                }
                else if (product[i].quantity <= 10) {

                    const result = await products.findByIdAndUpdate({ _id: product[i]._id }, { status: "Low Stock" })

                }

            }
            const cartcount = cartCount.length
            req.session.cartcount = cartCount.length

            res.render('users/home', { newdata, categorydata, productdata, cartcount })
        }
    } else {
        res.redirect("/user/login")
    }
}

const doSignup = (data) => {

    // console.log(data);
    return new Promise(async (resolve, reject) => {
        // data.password=await bcrypt.hash(data.password,10)
        await User.create(data).then((result) => {
            resolve(result)
            console.log("data stored", result)
        })

    })
}

// login page//
const getLogin = async (req, res) => {
    if (req.session.username) {
        res.redirect("/user/home")
    }
    else {
        const check = "true"
        res.render('users/login', { check, null: true })
    }


}
// post login page
const postLogin = async (req, res) => {
    console.log("login page", req.body.username)
    const check = await User.findOne({ username: req.body.username })

    if (!check) {
        console.log('login failed')
        const message = "User not found"
        res.render('users/login', { message })

    }
    else if (check.isBlocked === true) {
        console.log("user is blocked")
        const message = "user is blocked"
        res.render('users/login', { message, admin: true })
    }

    else {
        req.session.username = req.body.username
        req.session.user = check
        console.log("session", req.session.user._id)
        res.redirect("/user/home")


    }

}
// get signup page
const getSignup = async (req, res) => {
    const check = "true"
    res.render('users/signup', { check })


}
// post signup page
const postSignup = async (req, res) => {
    console.log(req.body.username)
    try {

        let existuser = await User.findOne({ username: req.body.username });


        if (existuser) {
            console.log(existuser);
            const message = 'User already exist.Please choose diffrent username';
            res.render("users/signup", { message })
            console.log("failed signup")
        }
        else {

            doSignup(req.body).then((result) => {

                req.session.loggedin = true
                req.session.username = req.body.username
                var email = req.body.email
                req.session.email = req.body.email
                // req.session.password=req.body.password
                console.log(result)
                req.session.user = result

                console.log(req.session.user._id)
                req.session.otp = generateOTP(6)
                async function main() {
                    const transport = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            // user: 'fathimathameeraap@gmail.com',
                            // pass: 'eply owri jdtq pgse',
                            user: process.env.user,
                            pass: process.env.pass
                        }
                    })
                    const info = await transport.sendMail({
                        from: 'fathimathameeraap@gmail.com',
                        to: email,
                        // req.session.email,
                        subject: 'OTP Verification',
                        text: `Your resend OTP for signup: ${req.session.otp}`

                    })
                    console.log("Resend message send " + info.messageId)
                    console.log(req.session.otp)
                }
                main();
                res.render("users/verification")


            })
        }
    }
    catch (error) {
        console.log("signup error")
    }
}
//otp submit
const otpSubmit = async (req, res) => {

    try {
        if (req.session.otp === req.body.otp) {
            res.redirect('/user/home')
        }
        else {
            let message = "OTP is incorrect"

            res.render('users/failOtp')
        }
    }
    catch (error) {
        console.log("otp submit", error)
    }

}

//Ressend otp//
const resendOtp = function (req, res) {
    req.session.otp = generateOTP(6)
    var email = req.session.email
    async function main() {
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.user,
                pass: process.env.pass
            }
        })
        const info = await transport.sendMail({
            from: 'fathimathameeraap@gmail.com',
            to: email,
            // req.session.email,
            subject: 'OTP Verification',
            text: `Your resend OTP for signup: ${req.session.otp}`

        })
        console.log("Resend message send " + info.messageId)
        console.log(req.session.otp)

    }
    main();
    res.render("users/verification")


}
// get gforgot password page
const getForgot = async (req, res) => {
    res.render("users/forgott")
}
// email submit in forgot page or otp send//
const getForgotOtp = async (req, res) => {
    const data = await User.findOne({ email: req.body.email })
    if (data) {
        req.session.otp = generateOTP(6)
        async function main() {
            const transport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'fathimathameeraap@gmail.com',
                    pass: 'eply owri jdtq pgse'
                }
            })
            const info = await transport.sendMail({
                from: 'fathimathameeraap@gmail.com',
                to: 'fathimathameeraap@gmail.com',
                // req.session.email,
                subject: 'OTP Verification',
                text: `Your  OTP for forgot password: ${req.session.otp}`

            })
            console.log("forgot otp message send " + info.messageId)
            console.log(req.session.otp)
        }
        main();
        const otpsubmit = "submit"
        res.render('users/forgott', { otpsubmit })
    }
    else {
        const message = "User not exist";
        res.render('users/forgott', { message })
    }
}
// 
// forgot password check and submit otp
const forgotOtpVerify = async (req, res) => {
    try {
        if (req.session.otp === req.body.otp) {
            console.log("otp is verifyiued")
            res.render('users/newpassword')

        }
        else {
            let message = "OTP is incorrect"

            res.render('users/forgott', { message })
        }
    }
    catch (error) {
        console.log("otp submit", error)
    }
}
// post new password
const changeForgotPassword = async (req, res) => {
    console.log(req.body)
    const userin = await User.findOne({ email: req.body.email })
    console.log("userin", userin)
    try {
        if (userin) {
            console.log("hai")
            const data = await User.updateOne({ email: req.body.email }, { password: req.body.password });
            console.log(data, "data")
            res.redirect("/user")
        }
        else {
            const message = "User is not exist";
            res.render("users/newpassword", { message })
        }
    }
    catch (error) {
        console.log("Error in change forgot password")
    }
}
//get product detail page
const getProductDetail = async (req, res) => {

    try {
        const proId = req.params.id
        const data = await products.findOne({ _id: proId }).lean()
        const categorydata = await products.find({ category: data.category }).limit(5).lean()
        const userId = req.session.user._id;
        const cartCount = await cart.find({ userId: userId })
        const cartcount = cartCount.length
        req.session.cartcount = cartcount
        res.render("users/product-detail", { data, categorydata, admin: false, cartcount })
    }
    catch (error) {
        console.log("error in product detail route", error)
    }
}
const userLogout = async (req, res) => {
    req.session.destroy()
    console.log("logout")
    res.redirect('/user')
}

//Add rto cart//

//get mobile page
const getcategory = async (req, res) => {
    // console.log(req.params)
    try {
        console.log(req.params)
        if ("Laptop" === req.params.category) {
            const productdata = await products.find({ category: req.params.category }).lean()

            res.render("users/product", { productdata })
        }

        else if ("Mobile Phone" === req.params.category) {
            const productdata = await products.find({ category: req.params.category }).lean()

            res.render("users/product", { productdata })
        }
        else if ("Watch" === req.params.category) {
            const productdata = await products.find({ category: req.params.category }).lean()

            res.render("users/product", { productdata })
        }
    }
    catch (e) {
        console.log("categorypage error.(mobile,laptop and watch)")
    }
}

// get mobile category
const getFilterCategory = async (req, res) => {
    // console.log(req.params)
    try {

        const filterCategory = req.params.category
        const productdata = await products.find({ category: req.params.category }).lean()
        const categorydata = await category.find({ isUnlist: false }).lean()
        res.render("users/product", { filterCategory, productdata, categorydata })
    }
    catch (e) {
        console.log("categorypage error.(mobile,laptop and watch)")
    }
}

// filter based on category
const categorySort = async (req, res) => {
    try {
        console.log("sorting category sort")
        const filterCategory = req.params.filterCategory
        console.log("req.body filter", req.body);
        const filters = req.body;
        let query = {};

        // Construct query based on filters
        if (filters['sort-product'] === 'low-to-high') {
            var priceLowToHigh = "low-to-high"
            query.sort = { price: 1 }; // Sort by price ascending
        } else if (filters['sort-product'] === 'high-to-low') {
            var priceHighToLow = "high-to-low"
            query.sort = { price: -1 }; // Sort by price descending
        } else if (filters['sort-product'] === 'a-z') {
            var alphaAtoZ = "a-z"
            query.sort = { product: 1 }; // Sort alphabetically A to Z
        } else if (filters['sort-product'] === 'z-a') {
            var alphaZtoA = "z-a"
            query.sort = { product: -1 }; // Sort alphabetically Z to A
        }
        console.log("price", priceHighToLow)

        // Filter based on selected categories

        query.category = { $in: req.params.filterCategory };

        // Fetch filtered data from the database
        const sort = query.sort
        console.log("sort", sort)

        console.log("category", query.category)
        console.log("Query:", query, "sort", sort); // Log the constructed query

        const productdata = await products.find({ category: query.category }).sort(sort).lean();
        const categorydata = await category.find().lean()
        console.log("Product Data:", productdata);
        if (priceLowToHigh) {// Log the fetched product data
            res.render("users/product", {
                productdata, categorydata, filterCategory, priceLowToHigh
            });
        }
        else if (priceHighToLow) {
            res.render("users/product", {
                productdata, categorydata, filterCategory, priceHighToLow
            });
        }
        else if (alphaAtoZ) {
            res.render("users/product", {
                productdata, categorydata, filterCategory, alphaAtoZ
            })
        }
        else if (alphaZtoA) {
            res.render("users/product", {
                productdata, categorydata, filterCategory, alphaZtoA
            })
        }

    }
    catch (error) {
        console.log("error in category sort in user controller")
    }
}

// filter
const filter = async (req, res) => {
    try {
        console.log("req.body filter", req.body);
        const filters = req.body;
        console.log(filters, "filters")
        let query = {};

        // Construct query based on filters

        if (filters['sort-product'] === 'low-to-high') {
            var priceLowToHigh = "low-to-high"
            query.sort = { price: 1 }; // Sort by price ascending
        } else if (filters['sort-product'] === 'high-to-low') {
            var priceHighToLow = "high-to-low"
            query.sort = { price: -1 }; // Sort by price descending
        } else if (filters['sort-product'] === 'a-z') {
            var alphaAtoZ = "a-z"
            query.sort = { product: 1 }; // Sort alphabetically A to Z
        } else if (filters['sort-product'] === 'z-a') {
            var alphaZtoA = "z-a"
            query.sort = { product: -1 }; // Sort alphabetically Z to A
        }

        // Filter based on selected categories
        if (filters.category && filters.category.length > 0) {
            query.category = { $in: filters.category };
        } else {
            query.category = { $in: ["Mobile Phone", "Laptop", "Watch"] };
        }

        // Fetch filtered data from the database
        const sort = query.sort
        console.log("sort", sort)
        // Checkbox for category filtering
        if (filters.category && filters.category.length > 0) {
            query.category = { $in: filters.category }; // Filtering based on selected categories

        } else {
            query.category = { $in: ["Mobile Phone", "Laptop", "Watch"] };
        }
        console.log("category", query.category)
        console.log("Query:", query, "sort", sort); // Log the constructed query

        const productdata = await products.find({ category: query.category }).sort(sort).lean();
        const categorydata = await category.find().lean()
        console.log("Product Data:", productdata); // Log the fetched product data

        if (priceLowToHigh) {// Log the fetched product data
            res.render("users/product", {
                productdata, categorydata, priceLowToHigh
            });
        }
        else if (priceHighToLow) {
            res.render("users/product", {
                productdata, categorydata, priceHighToLow
            });
        }
        else if (alphaAtoZ) {
            res.render("users/product", {
                productdata, categorydata, alphaAtoZ
            })
        }
        else if (alphaZtoA) {
            res.render("users/product", {
                productdata, categorydata, alphaZtoA
            })
        }
    } catch (error) {
        console.error("Error in filter route:", error);
        res.status(500).send("Internal Server Error");
    }
}
// get product page
const getproduct = async (req, res) => {
    try {
        const productdata = await products.find().lean()
        const userId = req.session.user._id;
        const cartCount = await cart.find({ userId: userId })
        const cartcount = cartCount.length
        req.session.cartcount = cartcount
        const categorydata = await category.find().lean()
        res.render("users/product", { productdata, cartcount, categorydata })
    }
    catch (error) {
        console.log("Error in get product page in user controller")
    }
}
// search products
const searchProducts = async (req, res) => {
    try {
        console.log(req.body.search)
        const query = req.body.search; // Assuming the search query is provided as a query parameter
        const regex = new RegExp(query, 'i'); // 'i' flag for case-insensitive search
        const productdata = await products.find({
            $or: [
                { product: regex },
                { category: regex }
            ]
        }).lean();
        console.log("productdata", productdata.length)
        const categorydata = await category.find().lean()
        if (productdata.length == 0) {
            const noFound = `No results for "${query}" try checking your splelling or use more general items`
            res.render("users/product", { categorydata, noFound })
        }
        else {
            res.render("users/product", { productdata, categorydata })

        }
    }
    catch (error) {
        console.log("Error iin serach product route in user controlleer")
    }
}
// cart count in header

const cartCount = async (req, res) => {
    try {
        const userId = req.session.user._id
        const cartdata = await cart.find({ userId: userId }).lean()
        const data = cartdata.length
        res.json(data)
    }
    catch (error) {
        console.log("error in cartCount route in cart controller")
    }
}

// wishlist count
const wishlistCount = async (req, res) => {
    try {
        const userId = req.session.user._id
        const wishlistdata = await wishlist.find({ userId: userId }).lean()
        const data = wishlistdata.length
        res.json(data)
    }
    catch (error) {
        console.log("error in cartCount route in cart controller")
    }
}

module.exports = {
    getcategory, homePage, doSignup,
    getLogin, postLogin, getSignup,
    postSignup, otpSubmit, resendOtp,
    getProductDetail, userLogout, getForgot,
    getForgotOtp, forgotOtpVerify, changeForgotPassword,
    filter, searchProducts, getproduct,
    getFilterCategory, categorySort,
    cartCount, wishlistCount
}