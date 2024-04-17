const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const users = require('../../models/user/usermodel')
const products = require('../../models/admin/productModel')
const { getAddProduct, deleteProduct, getEditProduct, doAddProduct, postEditProduct, getEditImage, postEditImage, MultImage, getProduct, DeleteMultiImg, productDetailPage, listProduct, unListProduct } = require('../../controllers/admin/productController')
const { verifyAdmin, upload, ProductRules, productRes, editProductRes, categoryRules, categoryRes, editCategoryRes, EditCategoryRes, EditProductRes, verifyUser, cropImage } = require('../../middlewares/middleware')
const{doLogin, postLogin, adminLogout}=require('../../controllers/admin/adminControllers')
const fileUpload = require('express-fileupload')
const multer = require('multer');
const { getCustomers, blockCustomer, unblockCustomers, searchCustomer } = require('../../controllers/admin/customerController')
const { getCategory, doAddcategory, deleteCategory, getEditcategory, postEditCategory, getAddcategory, getEditCategoryImg, postEditCategoryImg, unlistCategory, listCategory } = require('../../controllers/admin/catogaryController')
const { getDashboard, getSales, customDate, salesReport, report, salesReportDashboard, ameera, getSalesReport, customDateReport, downloadSalesReport, downloadSalesReportPdf } = require('../../controllers/admin/dashboarController')



const myusername = 'Ameera'
const mypassword = '123456'


//*********************************Login *****************************************/


//getv Admin Login page
router.get('/',doLogin)
//post admin loginpage
  
router.post('/login',postLogin)
 

// /*************************** */ customers*************************************//


router.get("/customers",verifyAdmin,getCustomers)

///////     Block user///
router.post("/block/:id",verifyAdmin,blockCustomer)
  
//////unblock user
router.post('/unblock/:id',verifyAdmin,unblockCustomers)
  
///////// search a specific name///////
router.post('/search',searchCustomer) 


//*************************************dashbord */**************** */


//Get Dashboard/////
router.get("/dashboard",verifyAdmin,getDashboard)
// get sales based on dropdown
router.get("/dashboard/:sale",verifyAdmin,getSales)
// get customdate sales
router.post("/dashboard/customdate",verifyAdmin,customDate)
// get sales report page
router.get("/dash/sales-reports",verifyAdmin,salesReportDashboard);
// report sales report
router.get("/dash/:report",verifyAdmin,getSalesReport)
// custom date report
router.post("/dash/customdate-report",verifyAdmin,customDateReport)
// download sales report csv
router.get("/dash/csv-report/:period",verifyAdmin,downloadSalesReport)
// download sales report pdf
router.get("/dash/pdf-report/:period",verifyAdmin,downloadSalesReportPdf)
/**********************************************Product****************** */


router.get("/product",getProduct)
//get add product
router.get("/add-product", getAddProduct)
//post add products//

router.post('/add-product',verifyAdmin,upload.any(),doAddProduct)
//Delete product
router.delete('/delete/:id',verifyAdmin, deleteProduct)
//Get edit product
router.get('/edit/:id',verifyAdmin, getEditProduct)
//post edit product
router.post('/edit-product/:id',verifyAdmin,upload.any(),postEditProduct)
//get list product//
router.post('/list/:id',verifyAdmin, listProduct)
// unlist product
router.post('/unList/:id',verifyAdmin,unListProduct)
// get product detail apge
router.get("/product-detail/:id",verifyAdmin,productDetailPage)

///**********************************Catogary *********************************/


router.get('/category',verifyAdmin,getCategory)
//get add product
router.get('/add-category',verifyAdmin,getAddcategory)
//Post catogary in database
router.post('/add-category',verifyAdmin,upload.single('image'),doAddcategory)
//Delete category
router.delete('/deleteCategory/:id',verifyAdmin, deleteCategory)
// Unlist category
router.post("/unListCategory/:id",verifyAdmin,unlistCategory)
// list category
router.post("/listCategory/:id",verifyAdmin,listCategory)
//Get edit product
router.get('/editCategory/:id',verifyAdmin, getEditcategory)
//post edit product
router.post('/edit-category/:id',verifyAdmin,postEditCategory)
//get Edit image//
router.get("/edit-categoryimage/:id",verifyAdmin,getEditCategoryImg)
//post Edit image//
router.post('/edit-categoryimage/:id',verifyAdmin, upload.single('image'),postEditCategoryImg)





//Logout Admin
router.get("/logout",adminLogout)
module.exports = router;