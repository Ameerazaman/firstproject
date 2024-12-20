const express = require('express')
const Razorpay = require('razorpay');
const mongoose = require('mongoose')
const path = require('path')

// user side
var user = require('./routes/users/user')
var cart = require("./routes/users/cart")
var checkout = require("./routes/users/checkout")
var userprofile=require("./routes/users/user-profile")
var wishlist=require("./routes/users/wishlist")

// admin side
var admin = require('./routes/admin/admin')
var order=require("./routes/admin/order")
var coupon=require("./routes/admin/coupon")
var referaloffer=require("./routes/admin/referaloffer")
const bodyParser = require('body-parser');
var hbs = require('express-handlebars').engine
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();
const app = express()
const nocache = require("nocache")
var connect = require("./config/connection")
var middleware = require('./middlewares/middleware')
const { Collection } = require('mongoose')
const multer = require('multer')
connect()



app.use(nocache())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const cookieParser = require("cookie-parser");
const session = require('express-session');
const products = require('./models/admin/productModel');
const category = require('./models/admin/categorymodel');
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/' }))
app.set('view engine', 'hbs');
admin.use((req, res, next) => {
  next();
});
user.use((req, res, next) => {
  next();
});
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  }),
);
const oneDay = 1000 * 60 * 60 * 24;

app.use(session({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: oneDay }, // Adjust this according to your environment
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  const check = await products.find().lean().limit(4)
 
  const newdata=await products.find().limit(4).sort({_id:-1}).lean()
  const categorydata = await category.find({ isUnlist: { $ne: true } }).lean()
  res.render('users/landing-page', { check,categorydata,newdata })
})
// Admiin side

app.use('/admin', admin)
app.use("/order",order)
app.use("/coupon",coupon)

app.use("/referaloffer",referaloffer)
// user side
app.use('/user', user)
app.use('/cart', cart)
app.use('/checkout',checkout)
app.use("/user-profile",userprofile)
app.use("/wishlist",wishlist)

const port = process.env.port||3004;
app.listen(port, console.log("server started"))