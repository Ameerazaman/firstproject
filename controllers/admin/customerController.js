const mongoose = require('mongoose')
const products = require("../../models/admin/productModel")
const User = require("../../models/user/usermodel");


// Get Customer Page//
const getCustomers= async (req, res) => {

    try {
      const data = await User.find().lean();
      console.log(data);
      res.render('admin/customers', { admin: true, data });
    } catch (error) {
      console.log("error in get customers")
    }
  
  };
//   block user//

const unblockCustomers= async (req, res) => {
  try {
      console.log("unlist")
    await User.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { isBlocked: false } }
    );
    res.status(200).json({success: true})
  } catch (error) {
    console.error(error);
  }
}


//   list category


const blockCustomer= async (req, res) => {
  try {
      console.log("list")
    await User.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { isBlocked: true } }
    );
    res.status(200).json({success: true})
  } catch (error) {
    console.error(error);
  }
}
  //search user//
  const searchCustomer= async (req, res) => {

    const user = req.body.username
  
    const data = await User.find({ username: { $regex: user, $options: "i" } }).lean()
    console.log(data)
    res.render('admin/dashboard', { admin: true, data });
  }
  module.exports={getCustomers,blockCustomer,unblockCustomers,searchCustomer}