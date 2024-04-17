const fs = require('fs');
const { Parser } = require('json2csv')
const Order = require("../../models/user/ordermodel");
const Users = require("../../models/user/usermodel");
const exceljs = require("exceljs");

// Read HTML Template



// getDashboard
const getDashboard = async (req, res) => {
    try {
        if (session) {
            const checkorder = await Order.findOne({ status: 'delivered' })
            console.log(checkorder, "checkorder")
            if (checkorder) {
                // *************Find total revenue and total price***************
                const nonCanceledOrders = await Order.find({ status: { $eq: 'delivered' } });
                console.log(nonCanceledOrders, "revenue dsh")
                // Calculate total price
                let total = 0;
                nonCanceledOrders.forEach(order => {
                    total += order.totalPrice;
                });
                const totalrevenue = ((total * 30) / 100)
                console.log(totalrevenue, "totalRevenue")
                ////////////////////////////////////
                // *************************find total sales****************

                const totalProductsCount = await Order.aggregate([
                    {
                        $match: { status: { $eq: "delivered" } } // Match orders with status not equal to "Canceled"
                    },
                    {
                        $project: {
                            productsCount: {
                                $size: {
                                    $filter: {
                                        input: "$products",
                                        as: "product",
                                        cond: { $ne: ["$$product.status", "delivered"] } // Exclude products with status "Canceled"
                                    }
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalProductsCount: { $sum: "$productsCount" } // Sum up the products count for all orders
                        }
                    },
                    {
                        $project: {
                            totalProductsCount: 1
                        }
                    }
                ]);

                // total category result         

                const sales = totalProductsCount[0].totalProductsCount
                const totalSales = JSON.stringify([totalrevenue])
                const label = JSON.stringify(["totalrevenue"])
                console.log("label", label, "totalsales", totalSales)
                const type = "Total"

                // totalProductsCount.length > 0 ? totalProductsCount[0].totalProductsCount : 0;

                // *******************count Total users**************
                const totalUsers = await Users.countDocuments({});


                req.session.Users = totalUsers
                req.session.sales = sales
                req.session.totalSales = totalSales
                const header = "Total Sales"
                const categoryWiseRevenue = await Order.aggregate([
                    {
                        $match: { status: { $eq: "delivered" } } // Match orders with status "delivered"
                    },
                    {
                        $unwind: "$products" // Unwind the products array
                    },
                    {
                        $group: {
                            _id: "$products.product.category", // Group by product category
                            totalAmount: { $sum: "$totalPrice" } // Calculate total amount for each category
                        }
                    },
                    {
                        $project: {
                            _id: 0, // Exclude _id field
                            category: "$_id", // Rename _id field as category
                            totalAmount: 1 // Include totalAmount field
                        }
                    },
                    {
                        $sort: {
                            totalAmount: -1 // Sort in descending order of totalAmount
                        }
                    }
                ]);

                var pieChartLabels = [];
                var pieChartData = [];

                // Iterate over the revenue data to extract labels and data
                categoryWiseRevenue.forEach(item => {
                    pieChartLabels.push(item.category);
                    pieChartData.push(item.totalAmount);
                });
                var chartLabels = JSON.stringify(pieChartLabels)
                var chartData = JSON.stringify(pieChartData)
                const topSellingProducts = await Order.aggregate([
                    { $match: { status: "delivered" } },
                    { $unwind: "$products" },
                    {
                        $group: {
                            _id: "$products.product",
                            totalQuantity: { $sum: "$products.quantity" },
                        },
                    },
                    { $sort: { totalQuantity: -1 } },
                    { $limit: 10 },
                    {
                        $lookup: {
                            from: "products",
                            localField: "_id",
                            foreignField: "_id",
                            as: "productDetails",
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            name: { $arrayElemAt: ["$productDetails.name", 0] },
                            totalQuantity: 1,
                        },
                    },
                ]);

                console.log(topSellingProducts, "top sales")

                res.render('admin/dashboard', { topSellingProducts, categoryWiseRevenue, admin: true, header, chartData, chartLabels, totalrevenue, totalUsers, sales, totalSales, type, label });
            }
            else {
                const Error = "Orders are not exist"
                res.render("admin/dashboard", { admin: true, Error })
            }
        }
        else {
            res.redirect("/admin")
        }
    }


    catch (error) {
        console.error('Error calculating total price:', error);
    }
}


// get sales based on dropdown
const getSales = async (req, res) => {
    try {
        const topSellingProducts = await Order.aggregate([
            { $match: { status: "delivered" } },
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.product",
                    totalQuantity: { $sum: "$products.quantity" },
                },
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            {
                $project: {
                    _id: 1,
                    name: { $arrayElemAt: ["$productDetails.name", 0] },
                    totalQuantity: 1,
                },
            },
        ]);

        console.log(topSellingProducts, "top sales")

        const today = new Date().toDateString();
        const header = "Daily Sales"
        // daily sales
        if (req.params.sale === "daily") {

            const nonCanceledOrders = await Order.find({ orderedAt: today, status: { $eq: 'delivered' } });
            // Calculate total price
            let total = 0;
            nonCanceledOrders.forEach(order => {
                total += order.totalPrice;
            });
            const totalrevenue = ((total * 30) / 100)
            console.log("total revenue", totalrevenue)
            if (totalrevenue == 0) {
                const Message = "Today not Sale anything"
                res.render("admin/dashboard", { admin: true, Message, header })
            } else {
                ////////////////////////////////////
                // *************************find total sales****************

                const totalProductsCount = await Order.aggregate([
                    {
                        $match: { status: { $ne: "Canceled" }, orderedAt: today } // Match orders with status not equal to "Canceled"
                    },
                    {
                        $project: {
                            productsCount: {
                                $size: {
                                    $filter: {
                                        input: "$products",
                                        as: "product",
                                        cond: { $ne: ["$$product.status", "Canceled"] } // Exclude products with status "Canceled"
                                    }
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalProductsCount: { $sum: "$productsCount" } // Sum up the products count for all orders
                        }
                    },
                    {
                        $project: {
                            totalProductsCount: 1
                        }
                    }
                ]);

                const sales = totalProductsCount[0].totalProductsCount
                const totalSales = JSON.stringify([totalrevenue])
                const label = JSON.stringify(["totalrevenue"])
                const type = "Total"

                // totalProductsCount.length > 0 ? totalProductsCount[0].totalProductsCount : 0;

                // *******************count Total users**************
                const totalUsers = await Users.countDocuments({ orderedAt: today });


                req.session.Users = totalUsers
                req.session.sales = sales
                req.session.totalSales = totalSales


                const categoryWiseRevenue = await Order.aggregate([
                    {
                        $match: { status: { $eq: "delivered" }, orderedAt: today } // Match orders with status "delivered"
                    },
                    {
                        $unwind: "$products" // Unwind the products array
                    },
                    {
                        $group: {
                            _id: "$products.product.category", // Group by product category
                            totalAmount: { $sum: "$totalPrice" } // Calculate total amount for each category
                        }
                    },
                    {
                        $project: {
                            _id: 0, // Exclude _id field
                            category: "$_id", // Rename _id field as category
                            totalAmount: 1 // Include totalAmount field
                        }
                    },
                    {
                        $sort: {
                            totalAmount: -1 // Sort in descending order of totalAmount
                        }
                    }

                ]);
                var pieChartLabels = [];
                var pieChartData = [];

                categoryWiseRevenue.forEach(item => {
                    pieChartLabels.push(item.category);
                    pieChartData.push(item.totalAmount);
                });
                var chartLabels = JSON.stringify(pieChartLabels)
                var chartData = JSON.stringify(pieChartData)

                const topSellingProducts = await Order.aggregate([
                    { $match: { status: "delivered" } },
                    { $unwind: "$products" },
                    {
                        $group: {
                            _id: "$products.product",
                            totalQuantity: { $sum: "$products.quantity" },
                        },
                    },
                    { $sort: { totalQuantity: -1 } },
                    { $limit: 10 },
                    {
                        $lookup: {
                            from: "products",
                            localField: "_id",
                            foreignField: "_id",
                            as: "productDetails",
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            name: { $arrayElemAt: ["$productDetails.name", 0] },
                            totalQuantity: 1,
                        },
                    },
                ]);

                console.log(topSellingProducts, "top sales")

                res.render('admin/dashboard', { topSellingProducts, categoryWiseRevenue, admin: true, header, chartData, chartLabels, totalUsers, sales, totalrevenue, totalSales, type, label });
            }
        }
        //    monthly Sales

        else if (req.params.sale === "monthly") {

            const monthlySales = await Order.aggregate([
                {
                    $group: {
                        _id: { $month: { $toDate: "$orderedAt" } },
                        totalSales: { $sum: "$total" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        month: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$_id", 1] }, then: "January" },
                                    { case: { $eq: ["$_id", 2] }, then: "February" },
                                    { case: { $eq: ["$_id", 3] }, then: "March" },
                                    { case: { $eq: ["$_id", 4] }, then: "April" },
                                    { case: { $eq: ["$_id", 5] }, then: "May" },
                                    { case: { $eq: ["$_id", 6] }, then: "June" },
                                    { case: { $eq: ["$_id", 7] }, then: "July" },
                                    { case: { $eq: ["$_id", 8] }, then: "August" },
                                    { case: { $eq: ["$_id", 9] }, then: "September" },
                                    { case: { $eq: ["$_id", 10] }, then: "October" },
                                    { case: { $eq: ["$_id", 11] }, then: "November" },
                                    { case: { $eq: ["$_id", 12] }, then: "December" },
                                ],
                                default: "Invalid Month",
                            },
                        },
                        totalSales: 1,
                    },
                },
            ]);

            let totalsales = [];
            let labels = [];
            monthlySales.forEach((e) => {
                totalsales.push(e.totalSales);
                labels.push(e.month);
            });

            // total users
            const totalUsers = await Users.countDocuments({})
            // total Sales
            const totalProductsCount = await Order.aggregate([
                {
                    $match: { status: { $ne: "Canceled" } } // Match orders with status not equal to "Canceled"
                },
                {
                    $project: {
                        productsCount: {
                            $size: {
                                $filter: {
                                    input: "$products",
                                    as: "product",
                                    cond: { $ne: ["$$product.status", "Canceled"] } // Exclude products with status "Canceled"
                                }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalProductsCount: { $sum: "$productsCount" } // Sum up the products count for all orders
                    }
                },
                {
                    $project: {
                        totalProductsCount: 1
                    }
                }
            ]);
            const sales = totalProductsCount[0].totalProductsCount
            // 

            const totalSales = JSON.stringify([...totalsales])
            const label = JSON.stringify([...labels])
            const type = "Monthly"
            const header = "Monthly Sales"
            const nonCanceledOrders = await Order.find({ status: { $ne: 'Canceled' } });

            // Calculate total price
            let total = 0;
            nonCanceledOrders.forEach(order => {
                total += order.totalPrice;
            });
            const totalrevenue = ((total * 30) / 100)


            const Today = new Date(); // Get the current date as a Date object
            const endDate = new Date(Today.getTime() - (30 * 24 * 60 * 60 * 1000)); // Subtract 30 days from the current date
            console.log("today", Today);
            console.log("endDate", endDate);
            var startDate = Today.toDateString()
            var lastDate = endDate.toDateString()
            console.log(lastDate, "latsdate")
            console.log("start", startDate, "end", lastDate, "today", today)
            const categoryWiseRevenue = await Order.aggregate([
                {
                    $match: {
                        status: "delivered",
                        orderedAt: { $gt: lastDate } // Match orders within the last 7 days
                    }
                },
                {
                    $unwind: "$products" // Unwind the products array
                },
                {
                    $group: {
                        _id: "$products.product.category", // Group by product category
                        totalAmount: { $sum: "$totalPrice" } // Calculate total amount for each category
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id field
                        category: "$_id", // Rename _id field as category
                        totalAmount: 1 // Include totalAmount field
                    }
                },
                {
                    $sort: {
                        totalAmount: -1 // Sort in descending order of totalAmount
                    }
                }
            ]);


            var pieChartLabels = [];
            var pieChartData = [];
            console.log("monthly revenure", categoryWiseRevenue)
            categoryWiseRevenue.forEach(item => {
                pieChartLabels.push(item.category);
                pieChartData.push(item.totalAmount);
            });
            var chartLabels = JSON.stringify(pieChartLabels)
            var chartData = JSON.stringify(pieChartData)
            console.log("monthly", chartData, chartLabels)
            const topSellingProducts = await Order.aggregate([
                { $match: { status: "delivered" } },
                { $unwind: "$products" },
                {
                    $group: {
                        _id: "$products.product",
                        totalQuantity: { $sum: "$products.quantity" },
                    },
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "productDetails",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        name: { $arrayElemAt: ["$productDetails.name", 0] },
                        totalQuantity: 1,
                    },
                },
            ]);

            console.log(topSellingProducts, "top sales")

            res.render('admin/dashboard', { topSellingProducts, categoryWiseRevenue, admin: true, chartData, chartLabels, totalrevenue, header, totalUsers, totalSales, type, label });

        }
        else if (req.params.sale === "weekly") {

            let weeklySales = await Order.aggregate([
                {
                    $group: {
                        _id: { $week: { $toDate: "$orderedAt" } },
                        totalSales: { $sum: "$total" },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]);


            let totalsales = [];
            let labels = [];
            weeklySales.forEach((e) => {
                totalsales.push(e.totalSales);
                labels.push(e._id);
            });
            const Today = new Date(); // Get the current date as a Date object
            const endDate = new Date(Today.getTime() - (7 * 24 * 60 * 60 * 1000));
            console.log("today", today)

            console.log("enddata", endDate)
            var startDate = Today.toDateString()
            var lastDate = endDate.toDateString()
            console.log("start", startDate, "end", lastDate, "today", today)
            const categoryWiseRevenue = await Order.aggregate([
                {
                    $match: {
                        status: "delivered",
                        orderedAt: { $gt: lastDate } // Match orders within the last 7 days
                    }
                },
                {
                    $unwind: "$products" // Unwind the products array
                },
                {
                    $group: {
                        _id: "$products.product.category", // Group by product category
                        totalAmount: { $sum: "$totalPrice" } // Calculate total amount for each category
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id field
                        category: "$_id", // Rename _id field as category
                        totalAmount: 1 // Include totalAmount field
                    }
                },
                {
                    $sort: {
                        totalAmount: -1 // Sort in descending order of totalAmount
                    }
                }
            ]);

            console.log("category", categoryWiseRevenue);


            var pieChartLabels = [];
            var pieChartData = [];

            categoryWiseRevenue.forEach(item => {
                pieChartLabels.push(item.category);
                pieChartData.push(item.totalAmount);
            });
            var chartLabels = JSON.stringify(pieChartLabels)
            var chartData = JSON.stringify(pieChartData)

            const total = await Order.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$total" },
                        productCount: { $sum: "$productsCount" },
                    },
                },
            ]);

            // //total sales productcount total revenue

            const totalProductsCount = await Order.aggregate([
                {
                    $match: { status: { $ne: "Canceled" } } // Match orders with status not equal to "Canceled"
                },
                {
                    $project: {
                        productsCount: {
                            $size: {
                                $filter: {
                                    input: "$products",
                                    as: "product",
                                    cond: { $ne: ["$$product.status", "Canceled"] } // Exclude products with status "Canceled"
                                }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalProductsCount: { $sum: "$productsCount" } // Sum up the products count for all orders
                    }
                },
                {
                    $project: {
                        totalProductsCount: 1
                    }
                }
            ]);
            const sales = totalProductsCount[0].totalProductsCount

            const totalrevenue = Math.floor((total[0].total * 30) / 100);

            const type = "weekly"
            const header = "Weekly Sales"
            const totalSales = JSON.stringify([...totalsales])
            const label = JSON.stringify([...labels])
            // users

            const totalUsers = await Users.countDocuments({})

            const productCountInDeliveredOrders = await Order.aggregate([
                {
                    $match: {
                        status: "delivered"
                    }
                },
                {
                    $unwind: "$products" // Unwind the products array
                },
                {
                    $group: {
                        _id: "$products.product.name", // Group by product name
                        count: { $sum: 1 } // Count occurrences of each product
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id field
                        product: "$_id", // Rename _id field as product
                        count: 1 // Include count field
                    }
                }
            ]);
            console.log("productcount", productCountInDeliveredOrders)
            res.render("admin/dashboard", { topSellingProducts, categoryWiseRevenue, admin: true, chartLabels, chartData, sales, totalrevenue, type, header, totalSales, label })

        }
        if (req.params.sale === "total") {

            const nonCanceledOrders = await Order.find({ status: { $eq: 'delivered' } });
            console.log(nonCanceledOrders, "revenue dsh")
            // Calculate total price
            let total = 0;
            nonCanceledOrders.forEach(order => {
                total += order.totalPrice;
            });
            const totalrevenue = ((total * 30) / 100)
            console.log(totalrevenue, "totalRevenue")
            ////////////////////////////////////
            // *************************find total sales****************

            const totalProductsCount = await Order.aggregate([
                {
                    $match: { status: { $eq: "delivered" } } // Match orders with status not equal to "Canceled"
                },
                {
                    $project: {
                        productsCount: {
                            $size: {
                                $filter: {
                                    input: "$products",
                                    as: "product",
                                    cond: { $ne: ["$$product.status", "delivered"] } // Exclude products with status "Canceled"
                                }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalProductsCount: { $sum: "$productsCount" } // Sum up the products count for all orders
                    }
                },
                {
                    $project: {
                        totalProductsCount: 1
                    }
                }
            ]);

            // total category result         

            const sales = totalProductsCount[0].totalProductsCount
            const totalSales = JSON.stringify([totalrevenue])
            const label = JSON.stringify(["totalrevenue"])
            console.log("label", label, "totalsales", totalSales)
            const type = "Total"

            // totalProductsCount.length > 0 ? totalProductsCount[0].totalProductsCount : 0;

            // *******************count Total users**************
            const totalUsers = await Users.countDocuments({});


            req.session.Users = totalUsers
            req.session.sales = sales
            req.session.totalSales = totalSales
            const header = "Total Sales"
            const categoryWiseRevenue = await Order.aggregate([
                {
                    $match: { status: { $eq: "delivered" } } // Match orders with status "delivered"
                },
                {
                    $unwind: "$products" // Unwind the products array
                },
                {
                    $group: {
                        _id: "$products.product.category", // Group by product category
                        totalAmount: { $sum: "$totalPrice" } // Calculate total amount for each category
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id field
                        category: "$_id", // Rename _id field as category
                        totalAmount: 1 // Include totalAmount field
                    }
                },
                {
                    $sort: {
                        totalAmount: -1 // Sort in descending order of totalAmount
                    }
                }
            ]);

            var pieChartLabels = [];
            var pieChartData = [];

            // Iterate over the revenue data to extract labels and data
            categoryWiseRevenue.forEach(item => {
                pieChartLabels.push(item.category);
                pieChartData.push(item.totalAmount);
            });
            var chartLabels = JSON.stringify(pieChartLabels)
            var chartData = JSON.stringify(pieChartData)

            res.render('admin/dashboard', { topSellingProducts, categoryWiseRevenue, admin: true, header, chartData, chartLabels, totalrevenue, totalUsers, sales, totalSales, type, label });

        }
    }

    catch (error) {
        console.log("Error in this dashboard controller")
    }
}
// custom date

const customDate = async (req, res) => {
    try {
        //   const today=req.body.date
        const customDate = new Date(req.body.date).toDateString()
        const Orderdata = await Order.findOne({ orderedAt: customDate })

        if (Orderdata) {


            const nonCanceledOrders = await Order.find({ orderedAt: customDate, status: { $ne: 'Canceled' } });
            // const nonCanceledOrders = await Order.find({ orderedAt: customDate});
            console.log("noncanceled ordera", nonCanceledOrders)
            // Calculate total price
            let total = 0;
            nonCanceledOrders.forEach(order => {
                total += order.totalPrice;
            });
            const totalrevenue = ((total * 30) / 100)


            ////////////////////////////////////
            // *************************find total sales****************

            const totalProductsCount = await Order.aggregate([
                {
                    $match: { status: { $ne: "Canceled" }, orderedAt: customDate } // Match orders with status not equal to "Canceled"
                },
                {
                    $project: {
                        productsCount: {
                            $size: {
                                $filter: {
                                    input: "$products",
                                    as: "product",
                                    cond: { $ne: ["$$product.status", "Canceled"] } // Exclude products with status "Canceled"
                                }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalProductsCount: { $sum: "$productsCount" } // Sum up the products count for all orders
                    }
                },
                {
                    $project: {
                        totalProductsCount: 1
                    }
                }
            ]);

            const sales = totalProductsCount[0].totalProductsCount
            const totalSales = JSON.stringify([totalrevenue])
            const label = JSON.stringify(["totalrevenue"])
            const type = "Total"

            // totalProductsCount.length > 0 ? totalProductsCount[0].totalProductsCount : 0;

            // *******************count Total users**************
            const totalUsers = await Users.countDocuments({ orderedAt: customDate });

            req.session.Users = totalUsers
            req.session.sales = sales
            req.session.totalSales = totalSales
            const header = "Custom Date Sales"

            const categoryWiseRevenue = await Order.aggregate([
                {
                    $match: { status: { $eq: "delivered" }, orderedAt: customDate } // Match orders with status "delivered"
                },
                {
                    $unwind: "$products" // Unwind the products array
                },
                {
                    $group: {
                        _id: "$products.product.category", // Group by product category
                        totalAmount: { $sum: "$totalPrice" } // Calculate total amount for each category
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id field
                        category: "$_id", // Rename _id field as category
                        totalAmount: 1 // Include totalAmount field
                    }
                },
                {
                    $sort: {
                        totalAmount: -1 // Sort in descending order of totalAmount
                    }
                }
            ]);
            var pieChartLabels = [];
            var pieChartData = [];

            categoryWiseRevenue.forEach(item => {
                pieChartLabels.push(item.category);
                pieChartData.push(item.totalAmount);
            });
            var chartLabels = JSON.stringify(pieChartLabels)
            var chartData = JSON.stringify(pieChartData)

            res.render('admin/dashboard', { categoryWiseRevenue, chartData, chartLabels, admin: true, header, totalUsers, sales, totalrevenue, totalSales, type, label });
        }
        else {
            const header = "Custom Date Sales"
            const message = "No sales are in specific Date"
            const totalUsers = await Users.countDocuments({ orderedAt: customDate });
            res.render("admin/dashboard", { admin: true, totalUsers })
        }

    }
    catch (error) {
        console.log("Error in customdate route in dashboard controiller")
    }
}

//get  Sales report page

const salesReportDashboard = async (req, res) => {
    try {
        console.log("sales report");
        const data = await Order.find({ status: { $eq: "delivered" } }).lean()
        req.session.totaldata = data
        const header = "Total"
        res.render("admin/sales-report", { admin: true, data, header });
    } catch (error) {
        console.error("Error in salesreport route in dashboard controller:", error);
        res.render("users/404")
    }
};

//get sales report  
const getSalesReport = async (req, res) => {
    try {
        // Daily sales report
        if (req.params.report == "daily") {
            console.log("daily")
            const today = new Date().toDateString();
            const check = await Order.findOne({ orderedAt: today, status: "delivered" }).lean()

            if (check) {
                const data = await Order.find({ orderedAt: today, status: "delivered" }).lean()
                console.log("data", data)
                const reportdata = await Order.aggregate([
                    {
                        $match: {
                            orderedAt: today
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalDiscount: { $sum: "$discount" },
                            totalSalesCount: { $sum: 1 },
                            totalOrderedAmount: { $sum: "$totalPrice" },
                            totalCouponDeduction: { $sum: "$coupondiscount" },
                            deliveredOrdersCount: {
                                $sum: {
                                    $cond: [{ $eq: ["$status", "delivered"] }, 1, 0]
                                }
                            }
                        }
                    }
                ])
                const overalldata = reportdata[0]
                const overallDiscount = overalldata.totalDiscount
                const overallSalesCount = overalldata.totalSalesCount
                const overallOrderedAmount = overalldata.totalOrderedAmount
                const couponDeductionAmount = overalldata.totalCouponDeduction

                req.session.dailyOveralldata = overalldata
                req.session.dailydata = data
                req.session.overallDiscount = overallDiscount
                req.session.overallOrderedAmount = overallOrderedAmount
                req.session.overallSalesCount = overallSalesCount
                req.session.couponDeductionAmount = couponDeductionAmount


                const header = "Daily"
                res.render("admin/sales-report", {
                    admin: true, data, overallDiscount,
                    overallOrderedAmount, overallSalesCount, header, couponDeductionAmount
                });
            }
            else {
                const header = "Daily data is not exist"
                res.render("admin/sales-report", { header, admin: true })
            }
        }

        // monthly sales
        else if (req.params.report == "monthly") {
            const reportdata = await Order.aggregate([
                {
                    $group: {
                        _id: { $month: { $toDate: "$orderedAt" } },
                        totalDiscount: { $sum: "$discount" },
                        totalSalesCount: { $sum: 1 },
                        totalOrderedAmount: { $sum: "$totalPrice" },
                        totalCouponDeduction: { $sum: "$coupondiscount" },
                        deliveredOrdersCount: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "delivered"] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$_id", 1] }, then: "January" },
                                    { case: { $eq: ["$_id", 2] }, then: "February" },
                                    { case: { $eq: ["$_id", 3] }, then: "March" },
                                    { case: { $eq: ["$_id", 4] }, then: "April" },
                                    { case: { $eq: ["$_id", 5] }, then: "May" },
                                    { case: { $eq: ["$_id", 6] }, then: "June" },
                                    { case: { $eq: ["$_id", 7] }, then: "July" },
                                    { case: { $eq: ["$_id", 8] }, then: "August" },
                                    { case: { $eq: ["$_id", 9] }, then: "September" },
                                    { case: { $eq: ["$_id", 10] }, then: "October" },
                                    { case: { $eq: ["$_id", 11] }, then: "November" },
                                    { case: { $eq: ["$_id", 12] }, then: "December" },
                                ],
                                default: "Invalid Month",
                            },
                        },
                        totalDiscount: 1,
                        totalSalesCount: 1,
                        totalOrderedAmount: 1,
                        totalCouponDeduction: 1,
                        deliveredOrdersCount: 1
                    }
                }
            ]);

            const overalldata = reportdata
            console.log(reportdata, "ovlldata")

            const header = "Monthly"


            const monthlydata = await Order.aggregate([
                {
                    $match: {
                        status: "delivered" // Filter orders by status
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: { $toDate: "$orderedAt" } },
                            year: { $year: { $toDate: "$orderedAt" } }
                        },
                        orders: {
                            $push: {
                                _id: "$_id",
                                userId: "$userId",
                                orderedAt: "$orderedAt",
                                totalPrice: "$totalPrice",
                                discount: "$discount",
                                payment: "$payment",
                                status: "$status"
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$_id.month", 1] }, then: "January" },
                                    { case: { $eq: ["$_id.month", 2] }, then: "February" },
                                    { case: { $eq: ["$_id.month", 3] }, then: "March" },
                                    { case: { $eq: ["$_id.month", 4] }, then: "April" },
                                    { case: { $eq: ["$_id.month", 5] }, then: "May" },
                                    { case: { $eq: ["$_id.month", 6] }, then: "June" },
                                    { case: { $eq: ["$_id.month", 7] }, then: "July" },
                                    { case: { $eq: ["$_id.month", 8] }, then: "August" },
                                    { case: { $eq: ["$_id.month", 9] }, then: "September" },
                                    { case: { $eq: ["$_id.month", 10] }, then: "October" },
                                    { case: { $eq: ["$_id.month", 11] }, then: "November" },
                                    { case: { $eq: ["$_id.month", 12] }, then: "December" },
                                ],
                                default: "Invalid Month",
                            },
                        },
                        year: "$_id.year",
                        orders: 1
                    }
                }
            ]);
            req.session.monthlydata = monthlydata
            req.session.monthlyOveralldata = overalldata
            console.log("data monthly", monthlydata)

            res.render("admin/sales-report", {
                admin: true, header, overalldata, monthlydata
            });
        }


        else if (req.params.report == "weekly") {

            const overalldata = await Order.aggregate([
                {
                    $match: {
                        status: "delivered" // Filter orders by status
                    }
                },
                {
                    $group: {
                        _id: { $week: { $toDate: "$orderedAt" } }, // Group by week
                        totalDiscount: { $sum: "$discount" },
                        totalSalesCount: { $sum: 1 },
                        totalOrderedAmount: { $sum: "$totalPrice" },
                        totalCouponDeduction: { $sum: "$coupondiscount" },
                        deliveredOrdersCount: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "delivered"] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id from the result
                        week: "$_id", // Rename _id to week
                        totalDiscount: 1,
                        totalSalesCount: 1,
                        totalOrderedAmount: 1,
                        totalCouponDeduction: 1,
                        deliveredOrdersCount: 1
                    }
                }
            ]);

            const weeklydata = await Order.aggregate([
                {
                    $match: {
                        status: "delivered" // Filter orders by status
                    }
                },
                {
                    $group: {
                        _id: { $week: { $toDate: "$orderedAt" } },
                        orders: {
                            $push: {
                                _id: "$_id",
                                userId: "$userId",
                                orderedAt: "$orderedAt",
                                totalPrice: "$totalPrice",
                                discount: "$discount",
                                payment: "$payment",
                                status: "$status"
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id from the result
                        week: "$_id",
                        orders: 1
                    }
                }
            ]);

            console.log("Weekly orders", weeklydata);

            const header = "Weekly"
            const th = "Week"
            req.session.weeklyOveralldata = overalldata
            req.session.weeklydata = weeklydata
            res.render("admin/sales-report", { admin: true, th, overalldata, header, weeklydata, header })

        }
        else if (req.params.report == "yearly") {
            const overalldata = await Order.aggregate([
                {
                    $group: {
                        _id: { $year: { $toDate: "$orderedAt" } }, // Group by week
                        totalDiscount: { $sum: "$discount" },
                        totalSalesCount: { $sum: 1 },
                        totalOrderedAmount: { $sum: "$totalPrice" },
                        totalCouponDeduction: { $sum: "$coupondiscount" },
                        deliveredOrdersCount: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "delivered"] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        year: "$_id",
                        totalDiscount: 1,
                        totalSalesCount: 1,
                        totalOrderedAmount: 1,
                        totalCouponDeduction: 1,
                        deliveredOrdersCount: 1
                    }
                }
            ]);
            console.log("yearlyoverall", overalldata)
            const yearlydata = await Order.aggregate([
                {
                    $match: {
                        status: "delivered" // Filter orders by status
                    }
                },
                {
                    $group: {
                        _id: { $year: { $toDate: "$orderedAt" } },
                        orders: {
                            $push: {
                                _id: "$_id",
                                userId: "$userId",
                                orderedAt: "$orderedAt",
                                totalPrice: "$totalPrice",
                                discount: "$discount",
                                payment: "$payment",
                                status: "$status"
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id from the result
                        year: "$_id",
                        orders: 1
                    }
                }
            ]);
            console.log("yeraly data", yearlydata)
            const header = "Yearly"
            req.session.yearldata = yearlydata
            req.session.yearlyOveralldata = overalldata
            res.render("admin/sales-report", { overalldata, yearlydata, header, admin: true })
        }

    }
    catch (error) {
        console.log("Error get sales Route in dashboard controller")
        res.render("users/404")
    }
}

// custom date

const customDateReport = async (req, res) => {
    try {
        console.log("req.body.satrtdate", req.body.startdate)
        console.log("req.body.enddate", req.body.enddate)
        req.session.startDate = req.body.startaate
        req.session.endDate = req.body.enddate
        const startDate = new Date(req.body.startdate);
        const endDate = new Date(req.body.enddate);

        console.log("Start Date:", startDate);
        console.log("End Date:", endDate);


        const overalldata = await Order.aggregate([
            {
                $addFields: {
                    orderedAtDate: { $toDate: "$orderedAt" } // Convert orderedAt from string to date
                }
            },
            {
                $match: {
                    orderedAtDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    _id: `${req.body.startdate},${req.body.enddate}`,
                    totalDiscount: { $sum: "$discount" },
                    totalSalesCount: { $sum: 1 },
                    totalOrderedAmount: { $sum: "$totalPrice" },
                    totalCouponDeduction: { $sum: "$coupondiscount" },
                    deliveredOrdersCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "delivered"] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    totalDiscount: 1,
                    totalSalesCount: 1,
                    totalOrderedAmount: 1,
                    totalCouponDeduction: 1,
                    deliveredOrdersCount: 1
                }
            }
        ]);


        const customdata = await Order.aggregate([
            {
                $match: {
                    status: "delivered" // Filter orders by status
                }
            },
            {
                $addFields: {
                    orderedAtDate: { $toDate: "$orderedAt" } // Convert orderedAt from string to date
                }
            },
            {
                $match: {
                    orderedAtDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: { $week: { $toDate: "$orderedAt" } },
                    orders: {
                        $push: {
                            _id: "$_id",
                            userId: "$userId",
                            orderedAt: "$orderedAt",
                            totalPrice: "$totalPrice",
                            discount: "$discount",
                            payment: "$payment",
                            status: "$status"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id from the result
                    week: "$_id",
                    orders: 1
                }
            }
        ]);
        console.log("customdata", customdata)
        req.session.customdateoveralldata = overalldata
        const header = `Overall Sales upto ${req.body.startdate} to ${req.body.enddate} `
        console.log("overall data in cusomdate", overalldata)
        res.render("admin/sales-report", { admin: true, header, overalldata, customdata })

    }
    catch (error) {
        console.log("Error in customDate repor route  dashboard controller")
        res.render("users/404")
    }

}
// download sales report
const downloadSalesReport = async (req, res) => {
    try {
        // daaily

        if (req.params.period == "Daily") {
            console.log("paramas monthly", req.params.period)
            const dailydata = req.session.dailyOveralldata


            const data = dailydata

            const jsons2csvParser = new Parser()
            const csv = jsons2csvParser.parse(data)

            console.log("csv", csv)

            const filePath = 'data.csv';

            // Write CSV data to a file
            fs.writeFile(filePath, csv, (err) => {
                if (err) {
                    console.error('Error writing CSV file:', err);
                } else {
                    console.log('CSV file saved successfully.');
                }
            });

            res.attachment("data.csv")
            res.status(200).send(csv)
        }

        // weekly report
        else if (req.params.period == "Weekly") {
            console.log("paramas monthly", req.params.period)
            const weeklydata = req.session.weeklyOveralldata
            const overalldata = req.session.monthlyOveralldata

            const data = weeklydata

            const jsons2csvParser = new Parser()
            const csv = jsons2csvParser.parse(data)

            console.log("csv", csv)

            const filePath = 'data.csv';

            // Write CSV data to a file
            fs.writeFile(filePath, csv, (err) => {
                if (err) {
                    console.error('Error writing CSV file:', err);
                } else {
                    console.log('CSV file saved successfully.');
                }
            });

            res.attachment("data.csv")
            res.status(200).send(csv)
        }

        else if (req.params.period == "Total") {
            console.log("paramas monthly", req.params.period)
            const totaldata = req.session.totaldata


            const data = totaldata

            const jsons2csvParser = new Parser()
            const csv = jsons2csvParser.parse(data)

            console.log("csv", csv)

            const filePath = 'data.csv';

            // Write CSV data to a file
            fs.writeFile(filePath, csv, (err) => {
                if (err) {
                    console.error('Error writing CSV file:', err);
                } else {
                    console.log('CSV file saved successfully.');
                }
            });

            res.attachment("data.csv")
            res.status(200).send(csv)
        }

        // monthly
        else if (req.params.period == "Monthly") {

            console.log("paramas monthly", req.params.period)
            const monthlydata = req.session.monthlyOveralldata
            const overalldata = req.session.monthlyOveralldata

            const data = monthlydata

            const jsons2csvParser = new Parser()
            const csv = jsons2csvParser.parse(data)

            console.log("csv", csv)

            const filePath = 'data.csv';

            // Write CSV data to a file
            fs.writeFile(filePath, csv, (err) => {
                if (err) {
                    console.error('Error writing CSV file:', err);
                } else {
                    console.log('CSV file saved successfully.');
                }
            });

            res.attachment("data.csv")
            res.status(200).send(csv)
        }

        // yeraly
        else if (req.params.period == "Yearly") {
            console.log("paramas monthly", req.params.period)
            const yearldata = req.session.yearlyOveralldata
            const overalldata = req.session.monthlyOveralldata

            const data = yearldata

            const jsons2csvParser = new Parser()
            const csv = jsons2csvParser.parse(data)

            console.log("csv", csv)

            const filePath = 'data.csv';

            // Write CSV data to a file
            fs.writeFile(filePath, csv, (err) => {
                if (err) {
                    console.error('Error writing CSV file:', err);
                } else {
                    console.log('CSV file saved successfully.');
                }
            });

            res.attachment("data.csv")
            res.status(200).send(csv)
        }

        else {
            console.log("paramas customdate", req.params.period)
            const customdatereport = req.session.customdateoveralldata


            const data = customdatereport

            const jsons2csvParser = new Parser()
            const csv = jsons2csvParser.parse(data)

            console.log("csv", csv)

            const filePath = 'data.csv';

            // Write CSV data to a file
            fs.writeFile(filePath, csv, (err) => {
                if (err) {
                    console.error('Error writing CSV file:', err);
                } else {
                    console.log('CSV file saved successfully.');
                }
            });

            res.attachment("data.csv")
            res.status(200).send(csv)
        }
    }




    // Define your JSON data

    catch (error) {
        console.log("Error in download sales report")
        res.render("users/400")
    }
}

// sales report pdf


const downloadSalesReportPdf = async (req, res) => {
    try {
        console.log(req.params);

        if (req.params.period === "Monthly") {
            monthlyOveralldata = req.session.monthlyOveralldata
            console.log("pdf", monthlyOveralldata)
            let table = []

            for (let i of monthlyOveralldata) {
                let row = [];


                row.push(i.totalDiscount);
                row.push(i.totalSalesCount);
                row.push(i.totalOrderedAmount);
                row.push(i.totalCouponDeduction);

                row.push(i.month);
                table.push(row)
            }

            console.log("table", table)
            const { jsPDF } = require('jspdf')
            require('jspdf-autotable')

            const doc = new jsPDF()
            doc.autoTable({
                head: [['Discount', 'Sales', 'Sales Amount', 'coupon deduction', 'month']],
                body: table,
            })
            doc.save('table.pdf')
            console.log('./table.pdf generated')

            res.download('table.pdf')
        }
        // daily sales
        else if (req.params.period == "Daily") {
            dailyOveralldata = req.session.dailyOveralldata
            console.log("pdf", dailyOveralldata)
            let table = []

            for (let i of dailyOveralldata) {
                let row = [];


                row.push(i.totalDiscount);
                row.push(i.totalSalesCount);
                row.push(i.totalOrderedAmount);
                row.push(i.totalCouponDeduction);

                row.push(i.month);
                table.push(row)
            }

            console.log("table", table)
            console.log("table", table)
            const { jsPDF } = require('jspdf')
            require('jspdf-autotable')

            const doc = new jsPDF()
            doc.autoTable({
                head: [['Discount', 'Sales', 'Sales Amount', 'coupon deduction', 'month']],
                body: table,
            })
            doc.save('table.pdf')
            console.log('./table.pdf generated')

            res.download('table.pdf')
        }


        // total
        else if (req.params.period == "Total") {
            const totaldata = req.session.totaldata
            console.log("pdf", totaldata)
            let table = []

            for (let i of totaldata) {
                let row = [];


                row.push(i._id);
                row.push(i.userId);
                row.push(i.payment);
                row.push(i.totalPrice);
                row.push(i.status);

                row.push(i.discount);
                row.push(i.orderedAt);
                row.push(i.coupondiscount);
                table.push(row)
            }
            console.log("table", table)
            const { jsPDF } = require('jspdf')
            require('jspdf-autotable')

            const doc = new jsPDF()
            doc.autoTable({
                head: [['Transactiion No', 'User', 'Payment', 'Total Amount', 'Status', 'Discount', 'Date', 'coupon Discount']],
                body: table,
            })
            doc.save('table.pdf')
            console.log('./table.pdf generated')

            res.download('table.pdf')
        }
        // yearly
        else if (req.params.period == "Yearly") {
            yearlyOveralldata = req.session.yearlyOveralldata
            console.log("pdf", yearlyOveralldata)
            let table = []

            for (let i of yearlyOveralldata) {
                let row = [];


                row.push(i.totalDiscount);
                row.push(i.totalSalesCount);
                row.push(i.totalOrderedAmount);
                row.push(i.totalCouponDeduction);

                row.push(i.year);
                table.push(row)
            }
            console.log("table", table)
            const { jsPDF } = require('jspdf')
            require('jspdf-autotable')

            const doc = new jsPDF()
            doc.autoTable({
                head: [['Discount', 'Sales', 'Sales Amount', 'coupon deduction', 'Year']],
                body: table,
            })
            doc.save('table.pdf')
            console.log('./table.pdf generated')

            res.download('table.pdf')
        }

        // Weekly 
        else if (req.params.period == "Weekly") {
            weeklyOveralldata = req.session.weeklyOveralldata
            console.log("pdf", weeklyOveralldata)
            let table = []

            for (let i of weeklyOveralldata) {
                let row = [];


                row.push(i.totalDiscount);
                row.push(i.totalSalesCount);
                row.push(i.totalOrderedAmount);
                row.push(i.totalCouponDeduction);

                row.push(i.week);
                table.push(row)
            }

            console.log("table", table)
            console.log("table", table)
            const { jsPDF } = require('jspdf')
            require('jspdf-autotable')

            const doc = new jsPDF()
            doc.autoTable({
                head: [['Discount', 'Sales', 'Sales Amount', 'coupon deduction', 'Weekly']],
                body: table,
            })
            doc.save('table.pdf')
            console.log('./table.pdf generated')

            res.download('table.pdf')
        }


        else {
            customdateOverallData = req.session.customdateoveralldata
            console.log("pdf", customdateOverallData)
            let table = []

            for (let i of customdateOverallData) {
                let row = [];


                row.push(i.totalDiscount);
                row.push(i.totalSalesCount);
                row.push(i.totalOrderedAmount);
                row.push(i.totalCouponDeduction);

                row.push(i.year);
                table.push(row)
            }

            console.log("table", table)
            console.log("table", table)
            const { jsPDF } = require('jspdf')
            require('jspdf-autotable')

            const doc = new jsPDF()
            doc.autoTable({
                head: [['Discount', 'Sales', 'Sales Amount', 'coupon deduction', 'customdate']],
                body: table,
            })
            doc.save('table.pdf')
            console.log('./table.pdf generated')

            res.download('table.pdf')
        }
    }

    catch (error) {
        console.log("Error in downloading sales report PDF in dashboard controller:", error);
    }
}




module.exports = {
    getDashboard, getSales, customDate,
    salesReportDashboard, getSalesReport,
    customDateReport, downloadSalesReport,
    downloadSalesReportPdf
}
