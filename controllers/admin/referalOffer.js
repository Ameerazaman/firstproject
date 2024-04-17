const mongoose = require('mongoose')
const referaloffer = require('../../models/admin/referalofferModel')

// get offer page

const getOffer = async (req, res) => {
    try {
        const data=await referaloffer.findOne().lean()
        
        if(data){
        res.render("admin/offer",{admin:true,data})
        }
        else{
            res.render("admin/offer",{admin:true})
        }
    }
    catch (error) {
        console.log("Error in get offer route in referal offer controller")
    }
}

// create referaloffer

const addOffer=async(req,res)=>{
    try{
        console.log("req.body of add offer",req.body)
        const data=await referaloffer.create({referalDiscount:req.body.offer})
        res.render("admin/offer",{admin:true,data})

    }
    catch(error){
        console.log("error in addofeer route in referal offer controller")
    }
}
// edit referal offer

const editOffer=async(req,res)=>{
    try{
      const data=await referaloffer.findByIdAndUpdate({_id:req.params.id},{referalDiscount:req.body.offer})
      res.redirect("/referaloffer")
    }
    catch(error){
        console.log("error in edit offer route iin referal offer controller")
    }
}
module.exports={getOffer,addOffer,editOffer}