const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product: {
    type: String,
    // required: true
  },
  image: {
    type: String,
    //required: true
  },
  //   catogary:'',
  description: {
    type: String,
    // required: true
  },
  category: {
    type: String,
    // required: true
  },
  price: {
    type: Number,
    // required: true
  },

  discount: {
    type: Number,
   // required: true
  },
  quantity:{
    type:Number
  },
  status:{
    type:String
  },
  stockLeft:{
    type:Number
  },
  categoryOffer:{
    type:Number
  },
  isUnlist:{
    type:Boolean,
    default:false
  },
  productImage1: { type: String },
  productImage2: { type: String },
  productImage3: { type: String },
  productImage4: { type: String }
  // Add more fields as needed
});

const products = mongoose.model('products', productSchema);

module.exports = products;