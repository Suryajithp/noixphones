const db = require('../config/connection')
const collection = require('../config/collections')
const client = require('twilio')('AC9b6a70c3478717968ed7ae564fc586d3', '68cbd483a10a0946b6f0e1936cf6b0f3');
const bcrypt = require('bcrypt');
const paypal = require('paypal-rest-sdk')
const objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
const instance = new Razorpay({
    key_id: 'rzp_test_FJMfZBIIcZtpSj',
    key_secret: 'AeqFV8yAAYFlZb2O8wYjKHGP',
});
const { response } = require('../app');
const { error } = require('node:console');
paypal.configure({
    'mode': 'sandbox',
    'client_id': 'AT9L70UckCZCdxX1iC5wVxhKSzf2YGdmZmjgnc-teO7hcqFzgdJpwz7QhOweSdo3HXPWwTb-ofRoZAEf',
    'client_secret': 'EDbN-5ZbZROrlYau5Ki6sEegcKU-RY0EW4iG4TX_BRng5xNP6U6hNGzw-zkEVjZDAS--P9asVPsf5djP'
});

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let email = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email });
            if (email) {
                console.log('same email');
                response.status = true
                resolve(response)

            } else {
                userData.Password = await bcrypt.hash(userData.Password, 10)
                userData.action = true
                client.verify.v2.services(collection.serviceID)
                    .verifications
                    .create({ to: '+91' + userData.Mobile, channel: 'sms' })
                    .then(verification => console.log(verification.status));
                console.log('no same email');
                resolve({ status: false, userData })
            }


        })
    },

    signupOtp: (userData, userDetails) => {
        return new Promise((resolve, reject) => {
            let response = {}
            client.verify.services(collection.serviceID)
                .verificationChecks
                .create({
                    to: `+91${userDetails.Mobile}`,
                    code: userData.otp
                })
                .then((verification_check) => {
                    console.log(verification_check.status);
                    if (verification_check.status == 'approved') {
                        db.get().collection(collection.USER_COLLECTION).insertOne(userDetails).then((data) => {
                            resolve(userDetails)
                        })
                    } else {
                        response.err = 'otp is invalid';
                        console.log(response);
                        resolve(response)
                    }
                }) 
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        if (!user.action) {
                            console.log("Blocked")
                            resolve({ action: false, status: true })
                        } else {
                            console.log("login success")
                            response.user = user
                            response.status = true
                            resolve(response)
                        }
                    } else {
                        console.log("login faild");
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("login faild");
                resolve({ status: false })
            }
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {

                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                }
                else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {


                                $push: { products: proObj }


                            }).then((response) => {
                                resolve()
                            })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)
        })
    },
    getCartcount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }).then((response) => {
                            resolve({ status: true })
                        })
            }
        })

    },
    removeCartProduct: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
        })
    },
    addToWishlist: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let userWishlist = await db.get().collection(collection.WISH_COLLECTION).findOne({ user: objectId(userId) })
            if (userWishlist) {

                let proExist = userWishlist.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.WISH_COLLECTION)
                        .updateOne({ _id: objectId(userWishlist._id) },
                            {
                                $pull: { products: { item: objectId(proId) } }
                            }).then((response) => {
                                response.remove = true
                                resolve(response)
                            })
                }
                else {
                    db.get().collection(collection.WISH_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {


                                $push: { products: proObj }


                            }).then((response) => {
                                response.status = true
                                resolve()
                            })
                }

            } else {
                let wishlistObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.WISH_COLLECTION).insertOne(wishlistObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let wishlistItems = await db.get().collection(collection.WISH_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item'

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            console.log(wishlistItems);
            resolve(wishlistItems)
        })
    },
    removeWishlistProduct: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISH_COLLECTION)
                .updateOne({ _id: objectId(details.wishlist) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } }
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        })
    },
    placeOrder: (order, products, total) => {
        console.log(products);
        return new Promise(async (resolve, reject) => {
            let status = order['payment-method'] === 'COD' || 'wallet' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: objectId(order.address),
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: parseInt(total),
                status: status,
                date: new Date()
            }
            if (order['payment-method'] == 'wallet') {
                let userWallet = await db.get().collection(collection.WALLET_COLLECTION).findOne({ user: objectId(order.userId) })
                console.log(userWallet.totalWalletAmount);
                db.get().collection(collection.WALLET_COLLECTION).updateOne({ user: objectId(order.userId) }, { $set: { totalWalletAmount: userWallet.totalWalletAmount - total } })
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(async (response) => {
                let stocks = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(order.userId) }
                    },
                    {
                        $unwind: '$products'
                    },

                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity',

                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            stock: '$product.stock',
                            quantity: 1,
                            stockDisplay: { $subtract: ['$stock', '$quantity'] }
                        },

                    },
                    {
                        $unwind: '$stock'
                    },
                    {
                        $project: {
                            stockDisplay: { $subtract: [{ $toInt: '$stock' }, '$quantity'] }
                        }
                    }
                ]).toArray()



                let proId = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            product: '$products.item',
                            // quantity:'$products.quantity'
                        }
                    }
                ]).toArray()

                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId[0].product) }, { $set: { stock: stocks[0].stockDisplay } })
                console.log(stocks);
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                console.log(response.insertedId);
                resolve(response.insertedId)
            })
        })
    },
    getCartProductsList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            console.log(cart);
            resolve(cart.products)
        })
    },
    getOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: objectId(userId) }).sort({ 'date': -1 }).toArray()
            resolve(orders)
        })
    },

    getUserOders: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        paymentMethod: '$paymentMethod',
                        status: '$status',
                        deliveryDetails: '$deliveryDetails',
                        date: '$date',
                        totalAmount: '$totalAmount'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        status: 1, date: 1, totalAmount: 1, paymentMethod: 1, item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            console.log(orderItems);
            resolve(orderItems)
        })
    },
    getUserAddress: (addId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(addId) }
                },
                {
                    $project: {
                        _id: 0,
                        item: '$deliveryDetails'
                    }
                },
                {
                    $lookup: {
                        from: collection.ADDRESS_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'address'
                    }
                },
                {
                    $project: {
                        address: { $arrayElemAt: ['$address', 0] }
                    }
                }
            ]).toArray()
            console.log(address);
            console.log('comon');
            resolve(address)
        })
    },
    generateRazorpay: (orderId, total) => {
        console.log(orderId);
        return new Promise((resolve, reject) => {
            instance.orders.create({
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            }).then((data) => {
                resolve(data)
            })
        })
    },
    generatePaypal: (orderId, total) => {
        return new Promise((resolve, reject) => {
            const newPayment = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/success",
                    "cancel_url": "http://localhost:3000/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "galaxy",
                            "sku": "001",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": total
                    },
                    "description": "The best team for ever."
                }]
            };
            paypal.payment.create(newPayment, function (err, payment) {
                if (err) {
                    console.log('errr');
                    throw error;
                } else {
                    console.log("create Payment")
                    resolve(payment)

                }
            });
        })
    },
    addAddress: (addId) => {
        return new Promise((resolve, reject) => {
            console.log(addId);
            let addressObj = {
                    Name: addId.Name,
                    mobile: addId.Mobile,
                    address: addId.address,
                    district: addId.district,
                    pincode: addId.pincode,
                userId: objectId(addId.userId),
            }

            db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addressObj).then((response) => {
                resolve()
            })
        })
    },
    getAllAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION)
                .find({ userId: objectId(userId) }).toArray()
            console.log(address);
            resolve(address)
        })
    },
    getAddress:(addId)=>{
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION)
                .findOne({ _id: objectId(addId) })
            console.log(address);
            resolve(address)
        })
    },
    changeAddress:(details,addId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: objectId(addId) },
            {
                $set:{
                    Name: details.Name,
                    mobile: details.Mobile,
                    address: details.address,
                    district: details.district,
                    pincode: details.pincode
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    deleteAddress: (addId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({ _id: objectId(addId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId)})
            console.log(user);
            resolve(user)
        })
    },
    editUser: (proId, userDetals) => {
        return new Promise(async(resolve, reject) => {
            let user= await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(proId) })
            let userExit= await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userDetals.Email})
            let response={}
            if(user.Email==userDetals.Email){
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(proId) }, {
                    $set: {
                        Name: userDetals.Name,
                        Email: userDetals.Email,
                        Mobile: userDetals.Mobile
                    }
                }).then((response) => {
                    resolve(response)
                })
            }else if(userExit){
                response.err=true
                resolve(response)

            }else{
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(proId) }, {
                    $set: {
                        Name: userDetals.Name,
                        Email: userDetals.Email,
                        Mobile: userDetals.Mobile
                    }
                }).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    doChangepass: (userData) => {
        return new Promise((resolve, reject) => {
            client.verify.v2.services(collection.serviceID)
                .verifications
                .create({ to: '+91' + userData.Mobile, channel: 'sms' })
                .then(verification => console.log(verification.status));
            console.log('no same email');
            resolve(userData)
        })
    },
    verifyOtp: (userData, userDetails) => {
        return new Promise((resolve, reject) => {
            let response = {}
            client.verify.services(collection.serviceID)
                .verificationChecks
                .create({
                    to: `+91${userDetails.Mobile}`,
                    code: userData.otp
                })
                .then((verification_check) => {
                    console.log(verification_check.status);
                    if (verification_check.status == 'approved') {
                        resolve(userDetails)
                    } else {
                        response.err = 'otp is invalid';
                        console.log(response);
                        resolve(response)
                    }
                })
        })
    },
    changePassword: (userData, userId) => {
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {

                $set: {

                    Password: userData.Password

                }
            }).then((data) => {
                console.log(userData);
                console.log("success");
                resolve(userData)
            })
        })
    },
    verifyPayment: (details) => {
        return new Promise(async (resolve, reject) => {
            const {
                createHmac
            } = await import('node:crypto');
            let hmac = createHmac('sha256', 'AeqFV8yAAYFlZb2O8wYjKHGP');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    applyCupon: (data, userId) => {
        console.log(data);
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let cupon = await db.get().collection(collection.CUPON_COLLECTION).findOne({ offerCode: data.offerCode })
            let response = {}
            if (cupon) {
                console.log(cupon);
                let curentdate = new Date()
                let date = new Date(cupon.expaire)
                console.log(date);
                console.log(curentdate);
                if (curentdate <= date) {
                    if (cupon.user.includes(userId)) {
                        response.userErr = 'coupon code already used'
                        resolve(response)
                    } else {
                        db.get().collection(collection.CUPON_COLLECTION).updateOne({ offerCode: data.offerCode },
                            {
                                $push: { user: (userId) }
                            }).then(() => {
                                let discountPrice = data.total * cupon.offerPercent / 100
                                let offerPrice = data.total - discountPrice
                                response.user = true
                                response.total = parseInt(offerPrice)
                                resolve(response)
                            })
                    }
                } else {
                    response.cuponErr = 'coupon expired'
                    resolve(response)
                }
            } else {
                response.cuponErr = 'invalid coupon'
                resolve(response)
            }
        })
    },
    retrunOrder: (orderId, userId) => {
        console.log(orderId);
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    status: 'returned'
                }
            })
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $project: {
                        _id: 0,
                        totalAmount: "$totalAmount"
                    }
                }
            ]).toArray()
            let walletObj = {
                user: objectId(userId),
                totalWalletAmount: orderItems[0].totalAmount

            }
            let userWallet = await db.get().collection(collection.WALLET_COLLECTION).findOne({ user: objectId(userId) })
            if (userWallet) {
                let totAmount = userWallet.totalWalletAmount + orderItems[0].totalAmount
                db.get().collection(collection.WALLET_COLLECTION)
                    .updateOne({ user: objectId(userId) },
                        {
                            $set: {
                                totalWalletAmount: totAmount
                            }
                        }).then(() => {
                            resolve()
                        })
            } else {
                db.get().collection(collection.WALLET_COLLECTION).insertOne(walletObj).then((response) => {
                    resolve(response)
                })
            }

        })
    },
    getWallet: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wallet = await db.get().collection(collection.WALLET_COLLECTION)
                .find({ user: objectId(userId) }).toArray()
            resolve(wallet)
        })
    }
}
