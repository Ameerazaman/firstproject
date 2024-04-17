const mongoose = require('mongoose')
const Order = require('../../models/user/ordermodel')

// get order page
const getOrder = async (req, res) => {

    try {
        const data=await Order.find().sort({_id:-1}).lean()
        res.render("admin/order", { admin: true, data})
    }

    catch (error) {
        console.log("Error in get order in order controller")
    }
}
// oredr change status

const changeStatus=async(req,res)=>{
   
    try{
        console.log(req.params.status,"change status")
     const data=await Order.findByIdAndUpdate({_id:req.params.id},{status:req.params.status})
     res.redirect("/order")
    }
    catch(error){
        console.log("Error in change status route user profile controller ")
    }
}
    
module.exports = { getOrder,changeStatus }