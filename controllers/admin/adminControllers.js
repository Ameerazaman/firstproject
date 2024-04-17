const mongoose = require('mongoose')
const User = require("../../models/user/usermodel")
const products = require("../../models/admin/productModel")

// *************************Admin Page******************************//
// const myusername = 'Ameera'
// const mypassword = '123456'
const myusername = process.env.myusername;
const mypassword = process.env.mypassword;


const doLogin = async (req, res) => {
  if (req.session.loggedin) {
    res.render('admin/dashboard')
  }
  else {
    res.render('admin/login', { admin: true })
  }

}
// Post admin Login page//
const postLogin = async (req, res) => {


  if (req.body.username != myusername) {
    const message = 'Username is not match';
    res.render('admin/login', { message, admin: true });
  }
  if (req.body.password != mypassword) {
    const messages = 'Password is not match';
    res.render('admin/login', { messages, admin: true });

  }

  else {
    session = req.session;
    req.session.loggedin = true
    session.userid = req.body.username;
    session.password = req.body.password;
    console.log(req.session)
    

    res.redirect('/admin/dashboard')
  }
}



///Logout
const adminLogout = async (req, res) => {

  req.session.destroy()
  console.log("destroy")
  console.log(req.session)
  res.redirect('/admin')
}
module.exports = { doLogin, postLogin, adminLogout };