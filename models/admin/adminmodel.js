const mongoose=require('mongoose')
const adminschema=mongoose.Schema({
    Name:{
        type:String,
        required:true},
    password:{
        type:Number,
        required:true}

})
const admin=mongoose.model("admin",adminschema)
module.exports=admin


