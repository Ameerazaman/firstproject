const multer = require('multer')
const sharp = require('sharp');

const { check, validationResult, body } = require('express-validator');
const Users = require('../models/user/usermodel');


const verifyAdmin = (req, res, next) => {
    
    if (session.userid) {
        console.log("session exist")
        next()
    }
    else {
        res.render('admin/login',{admin:true})
    }
}


const verifyUser = (req, res, next) => {
   
    if (req.session.username) {
        next()
    }
    else {
        console.log("session failed")
        res.redirect('/user')
    }
}
//file upload///upload images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Destination folder for uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });
//***************validation signup********************************* */

// block middlewar
const blockMiddleware = async (req, res, next) => {
    const userId = req.session.user._id
  
    const user = await Users.findOne({ _id: userId })
    if (!user) {
        return res.redirect("/user")
    }
   
    if (user.isBlocked===true) {
        req.session.destroy((err) => {
            if (err) {
                console.log("error destroy session", err)
            }
            const message = "user is blocked"
            res.render("users/login",{error:true,message})
        })
    }
    else{
        next();
    }
};




module.exports = {
    verifyAdmin, verifyUser, upload,
     blockMiddleware
}