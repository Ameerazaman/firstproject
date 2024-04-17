const mongoose = require('mongoose')
const wishlist = require('../../models/user/wishlist-model')
const cart = require('../../models/user/add-to-cart-model')


// get wishlist page
const GetWishlist = async (req, res) => {
    try {
        
        const userId = req.session.user._id
        const productId = req.session.productId
        const data = await wishlist.aggregate([
            { $match: { userId: userId } },
            { $unwind: "$products" },
            {
                $project: {
                    proId: "$products.proId",
                   
                }
            },
            {
                $lookup: {
                    from: "products",
                    let: { proId: { $toObjectId: "$proId" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$proId"] } } }
                    ],
                    as: "productDetails"
                }
            },
            {
                $project: {
                    proId: "$proId",
                    product: { $arrayElemAt: ["$productDetails", 0] },
                },
            },
            {
                $project: {
                    proId: 1,
                    image: 1,
                    product: 1,
                },
            }
        ]);
        console.log(data)
        if(data){

            const cartCount=await cart.find({userId:userId})
            const cartcount=cartCount.length
            req.session.cartcount=cartcount
    
            res.render("users/wishlist",{data,cartcount})
        }
        else{
            
        }
    }
    catch (error) {
        console.log("Error in getwishlist route in  wishlist controler")
    }
}

// get add to wishlist
const addToWishlist = async (req, res) => {
    try {

        const productId = req.params.id;
        console.log(productId)
        req.session.productId = productId
        const userId = req.session.user._id;
        const user = await wishlist.findOne({ userId });

        if (user) {
            // Existing user, add/update product in cart

            await wishlist.create({ userId: userId, products: [{ proId: productId }] });
            console.log("Product saved in wishlist");

            res.redirect("/user/product");
        }
        else {
            const wishlistData = {
                userId, products:
                    [{ proId: productId }]
            }
            const newdata = await wishlist.create(wishlistData)
            console.log("new wishlist created for new user")
            res.redirect("/user/product")
        }
    }
    catch (error) {
        console.log("Error in add to wishlist router wishlist controller")
    }
}

// delete product from wish list
const deleteWishlistproduct=async(req,res)=>{
    try{
        console.log("wishlist delete")
        const data=await wishlist.findByIdAndDelete({_id:req.params.id})
        res.json(data)
    }
    catch(error){
        console.log("Error in delete wishlist product route in wishlist controller")
    }
   
}
// Add to cart
const addToCartWishlist = async (req, res) => {

    try {
        const productId = req.params.id;
        console.log(productId,"wishlist")
        req.session.productId = productId
        const userId = req.session.user._id;
        const user = await cart.findOne({ userId });
       
        if (user) {
            // Existing user, add/update product in cart
            const existingCartItem = await cart.findOne({ userId, 'products.proId': productId });

            if (existingCartItem) {
                // Update existing product quantity
                const cartItem = await cart.findOne({ userId, 'products.proId': productId });
                const currentQuantity = cartItem.products.find(item => item.proId === productId).quantity;
                console.log("add cart",currentQuantity)
                if (currentQuantity >= 5) {
                   console.log("quantity limit exceeded")
                }
                else {
                    await cart.updateOne(
                        { userId, 'products.proId': productId,count:1 },
                        {
                            $inc: { 'products.$.quantity': 1} 
                        }
                    );
                   return res.redirect('/wishlist');
                }// Redirect to the cart page after updating the cart
            } else {
                const addQuantity = 1;
                await cart.create({ userId: userId, products: [{ proId: productId, quantity: addQuantity }] });

                res.redirect("/wishlist");
            }
        }
        else {
            const cartData = {
                userId, products:
                    [{ proId: productId, quantity: 1 }]
            }
            const newdata = await cart.create(cartData)
            res.redirect("/wishlist")
        }

    } catch (error) {
        console.log("Error in add to cart:", error);
        res.status(500).send("Error in add to cart");
    }
};
module.exports = { GetWishlist, addToWishlist,deleteWishlistproduct,addToCartWishlist }
