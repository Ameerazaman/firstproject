const mongoose = require('mongoose')
const products = require("../../models/admin/productModel")
const category = require('../../models/admin/categorymodel')
// ***********************************Product******************************************
//get product page
const getProduct = async (req, res) => {
    const data = await products.find().sort({_id:-1}).lean();
    res.render('admin/product', { admin: true, data })
}
// get product page//
const getAddProduct = async (req, res) => {
    console.log("called add product")
    const categorydata = await category.find({ isUnlist: { $ne: true } }).lean()
    res.render('admin/add-product', { categorydata })
}

// // post Product page//
const doAddProduct = async (req, res) => {


    const checkProduct = await products.findOne({ product: { $regex: new RegExp(req.body.product, "i") } });
    console.log(checkProduct, "check")
    if (checkProduct) {
        const message = "Product already exist,please add another product"
        res.render("admin/add-product", { message })
    }
    else {
        console.log("product creation")
        const pro = await products.create({
            product: req.body.product,
            category: req.body.category,
            quantity: req.body.quantity,
            price: req.body.price,
            discount: req.body.discount,
            productImage1: req.files[0].filename,
            productImage2: req.files[1].filename,
            productImage3: req.files[2].filename,
            productImage4: req.files[3].filename,
            description: req.body.description,

        })
        console.log("product created", pro)

        res.redirect('/admin/product')

    }

}

//Delete product//
const deleteProduct = async (req, res) => {
    try {
        console.log("delete product")
        var id = req.params.id;

        const deleteproduct=await products.findByIdAndDelete({ _id: id });
       if(deleteproduct){
        res.json(deleteproduct)
       }
    }
    catch (error) {
        console.log("delete product")
    }
}
// list product
const listProduct= async (req, res) => {
    try {
      await products.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { isUnlist: true } }
      );
      res.redirect("/admin/product");
    } catch (error) {
      console.error(error,"error in llist product route product controller");
    }
  }
//   unlist product
  const unListProduct= async (req, res) => {
    try {
      await products.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { isUnlist: false } }
      );
      res.redirect("/admin/product");
    } catch (error) {
      console.error(error,"Error in unlusProduct route product controller");
    }
  }
// Get edit data//
const getEditProduct = async (req, res) => {
    try {
        console.log("edit called")
        var id = req.params.id
        const data = await products.findOne({ _id: id }).lean()
        const categorydata = await category.find().lean()
        console.log("edit", data)
        res.render('admin/edit-product', { data, categorydata, id, admin: true })
    }
    catch (error) {
        console.log("get edit pro error")
    }
}
// post Edit product//
const postEditProduct = async (req, res) => {
    console.log("passed to post page")
    const proId = req.params.id;
    console.log(req.body)
   
    const data = await products.findByIdAndUpdate({ _id: req.params.id }, {
        product: req.body.product,
        category: req.body.category,
        price: req.body.price,
        quantity: req.body.quantity,
        description: req.body.description,
        descount: req.body.descount,
    })

    for (let i = 0; i < req.files.length; i++) {
        if (req.files[i].fieldname == "productImage1") {
            console.log(0)
            await products.findByIdAndUpdate({ _id: req.params.id }, { productImage1: req.files[0].filename })
            break
        }


        else if (req.files[i].fieldname == "productImage2") {
            console.log(1)
            await products.findByIdAndUpdate({ _id: req.params.id }, { productImage2: req.files[0].filename })
            break
        }
        else if (req.files[i].fieldname == "productImage3") {
            console.log(2)
            await products.findByIdAndUpdate({ _id: req.params.id }, { productImage3: req.files[0].filename })
            break
        }


        else if (req.files[i].fieldname == "productImage4") {
            console.log(3)
            await products.findByIdAndUpdate({ _id: req.params.id }, { productImage4: req.files[0].filename })
            break
        }
    }
    console.log(data, "updatedata")
    res.redirect("/admin/product");
}
//get edit product image

// product detail page
const productDetailPage = async (req, res) => {
    try {
        const datas = await products.findOne({ _id: req.params.id }).lean()
        res.render("admin/product-detail", { datas })
    }
    catch (error) {
        console.log("Error in product detailpage in product controlller")
    }

}
module.exports = {
    getAddProduct,
    doAddProduct,
    deleteProduct,
    getEditProduct,
    postEditProduct,
    listProduct,
    unListProduct,
    getProduct,
    productDetailPage
}
