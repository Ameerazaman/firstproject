const mongoose = require('mongoose')
const User = require("../../models/user/usermodel")
const products = require("../../models/admin/productModel")
const category = require('../../models/admin/categorymodel')
const cart = require("../../models/user/add-to-cart-model")
const Coupon = require('../../models/admin/couponmodel')

// add to cart product
const addToCart = async (req, res) => {

    try {
        console.log("add to catt", req.params.id)
        const productId = req.params.id;
        console.log(productId)
        req.session.productId = productId
        const userId = req.session.user._id;
        const productStock = await products.findOne({ _id: productId })
        console.log(productStock.quantity, "quantity")
        if (productStock.quantity > 0) {
            console.log("hai")
            const user = await cart.findOne({ userId });

            if (user) {
                // Existing user, add/update product in cart
                const existingCartItem = await cart.findOne({ userId, 'products.proId': productId });

                if (existingCartItem) {
                    // Update existing product quantity
                    const cartItem = await cart.findOne({ userId, 'products.proId': productId });
                    const currentQuantity = cartItem.products.find(item => item.proId === productId).quantity;
                    console.log("add cart", currentQuantity)
                    if (currentQuantity >= 5) {
                        console.log("quantity limit exceeded")
                    }
                    else {
                        await cart.updateOne(
                            { userId, 'products.proId': productId, count: 1 },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        );
                        const newdata = await cart.find({ userId: userId })
                        console.log("cart item", newdata.length)
                        const data = newdata.length
                        return res.json(data);
                    }// Redirect to the cart page after updating the cart
                } else {
                    const addQuantity = 1;
                    await cart.create({ userId: userId, products: [{ proId: productId, quantity: addQuantity }] });

                    const newdata = await cart.find({ userId: userId })
                    console.log("cart item", newdata.length)
                    const data = newdata.length
                    res.json(data);
                }
            }
            else {
                const cartData = {
                    userId, products:
                        [{ proId: productId, quantity: 1 }]
                }
                await cart.create(cartData)
                const newdata = await cart.find({ userId: userId })
                console.log("cart item", newdata.length)
                const data = newdata.length
                res.json(data);

            }
        }
        else {
            console.log("product Out of stock")
        }

    } catch (error) {
        console.log("Error in add to cart:", error);
        res.status(500).send("Error in add to cart");
    }
};
// get cart page
const getCart = async (req, res) => {

    try {
        const userId = req.session.user._id
        const checkCart = await cart.findOne({ userId: userId })
        const cartCount = await cart.find({ userId: userId })
        const cartcount = cartCount.length

        req.session.cartcount = cartcount
        if (checkCart) {
            const productId = req.session.productId
            const data = await cart.aggregate([
                { $match: { userId: userId } },
                { $unwind: "$products" },
                {
                    $project: {
                        proId: "$products.proId",
                        quantity: "$products.quantity",
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
                        quantity: "$quantity",
                        product: { $arrayElemAt: ["$productDetails", 0] },
                    },
                },
                {
                    $project: {
                        proId: 1,
                        quantity: 1,
                        image: 1,
                        product: 1,
                        subtotal: { $multiply: ["$quantity", "$product.price"] },
                        discountProduct: { $multiply: ["$quantity", "$product.discount"] },

                    },
                }
            ]);
            const result = await cart.aggregate([
                { $match: { userId: userId } },
                { $unwind: "$products" },
                {
                    $project: {
                        proId: "$products.proId",
                        quantity: "$products.quantity",
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
                        quantity: "$quantity",
                        product: { $arrayElemAt: ["$productDetails", 0] },
                    },
                },
                {
                    $project: {
                        proId: "$product.proId",
                        quantity: 1,
                        image: "$product.image",
                        product: "$product.product",
                        subtotal: { $multiply: ["$quantity", "$product.price"] },
                        discountProduct: { $multiply: ["$quantity", "$product.discount"] },

                    },
                },
                {
                    $group: {
                        _id: null,
                        totalPrice: { $sum: "$subtotal" },
                        totalDiscount: { $sum: "$discountProduct" }
                    }
                },
                {
                    $project: {
                        totalPrice: 1,
                        totalDiscount: 1,
                        totalPriceAfterDiscount: { $subtract: ["$totalPrice", "$totalDiscount"] }
                    }
                }
            ]);
            // find coupon

            req.session.data = data
            req.session.result = result
            req.session.cartId = data._id
            const totalAmount = result[0].totalPriceAfterDiscount
            console.log("total", totalAmount)
            req.session.discount = result[0].totalDiscount
            console.log("discount", req.session.discount)
            const coupondata = await Coupon.find({ users: { $ne: userId } }).lean();

            req.session.coupondata = coupondata


            const categoryData = await category.find({ isUnlist: false }).lean()

            console.log(data, "data")
            var categoryOffer = 0
            for (let i = 0; i < data.length; i++) {
                const productCategory = data[i].product.category
                const result = await category.findOne({ category: productCategory })
                const offer = (data[i].product.price * result.offer) / 100
                categoryOffer = categoryOffer + offer
            }
            console.log("cattegory offer", categoryOffer)
            req.session.categoryOffer = categoryOffer
            var totalAmt = totalAmount - categoryOffer
            console.log("total", totalAmt)
            if (totalAmt < 10000) {
                console.log("hai")
                var shippingCharge = 90
                console.log("shipping", shippingCharge)
                totalAmt = (totalAmt + shippingCharge)
                console.log("total", totalAmt)

            }
            else {
                var shippingCharge = 0
            }
            // var shippingCharge = 0
            console.log("total", totalAmt)


            console.log("totalc", totalAmt)
            req.session.ship = shippingCharge
          

            res.render("users/cart", { cartcount, shippingCharge, data, totalAmt, result, coupondata, categoryOffer })


        }
        else {
            const empty = "Cart Page is Empty,Please add your favouraite product"
            res.render("users/cart", { empty })
        }
    }
    catch (error) {
        console.log("Error in cart page")
    }
}

// select coupon

// category offer
const categoryOffer = async (req, res) => {
    try {
        const data = req.session.data
        const userId = req.session.user._id
        const categoryData = await category.findById({ _id: req.params.id })
        // console.log("categorydata",data[0].product)

        const result = req.session.result
        const shippingCharge = req.session.ship
        var totalAmt = req.session.total

        //const categorydiscount = function () {
        var categoryDiscount = 0
        for (let i = 0; i < data.length; i++) {

            if (data[i].product.category == categoryData.category) {

                var categoryDiscount = ((data[i].product.price * categoryData.offer) / 100) + categoryDiscount

                const totalAmount = totalAmt - categoryDiscount;

                req.session.categoryDiscount = categoryDiscount
                req.session.checkoutTotal = totalAmount
                res.render("users/cart", { result, shippingCharge, data, totalAmount, categoryDiscount })


            }
            else {

                const categoryMessage = "Match categories are not exist"
                res.render("users/cart", { result, categoryMessage, shippingCharge, data, totalAmt, categoryDiscount, })

            }

        }



    }
    catch (error) {
        console.log("Error in category offer in cart controller")
    }
}
// delete  cart data

const deleteCart = async (req, res) => {
    const data = await cart.findByIdAndDelete({ _id: req.params.id })

    res.json(data)
}

// increment quantity

const incrementQuantity = async (req, res) => {
    try {

        const productId = req.params.id;
        const userId = req.session.user._id;
        const data = req.session.data
        const result = req.session.result
        const coupondata = req.session.coupondata

        // Fetch the current quantity of the product in the user's cart
        const productData = await products.findById({ _id: productId })

        const cartItem = await cart.findOne({ userId, 'products.proId': productId });
        const currentQuantity = cartItem.products.find(item => item.proId === productId).quantity;

        if (productData.quantity == currentQuantity) {
            const message = "Out of stock"
            res.render("users/cart", { message, data, result, coupondata })
        }
        else {
            // Check if the current quantity is less than 5 before incrementing
            if (currentQuantity < 5) {
                const data = await cart.findOneAndUpdate(
                    { userId, 'products.proId': productId },
                    { $inc: { 'products.$.quantity': 1 } }
                );

                res.status(200).json(data)

            } else {
                console.log("Quantity limit reached for product:", productId);
            }

        }
    } catch (error) {
        console.log("Error incrementing quantity:", error);
        res.status(500).send('Internal Server Error');
    }
};

// Decrement quantity

const decrementQuantity = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.user._id;

        // Fetch the current quantity of the product in the user's cart
        const cartItem = await cart.findOne({ userId, 'products.proId': productId });
        const currentQuantity = cartItem.products.find(item => item.proId === productId).quantity;

        // Check if the current quantity is greater than 1 before decrementing
        if (currentQuantity > 1) {
            const data = await cart.updateOne(
                { userId, 'products.proId': productId },
                { $inc: { 'products.$.quantity': -1 } }
                // Use negative value to decrement

            );
            res.status(200).json(data)

        } else {
            console.log("Minimum quantity reached for product:", productId);
        }


    } catch (error) {
        console.log("Error in decrementing quantity:", error);
        res.status(500).send("Error in decrementing quantity");
    }
};

module.exports = { categoryOffer, addToCart, deleteCart, incrementQuantity, decrementQuantity, getCart }