var db = require('../config/connection')
var collection = require('../config/collections')
const { ObjectId } = require('mongodb')
const { response } = require('express')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
module.exports = {


    getAlluser: (prodId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(user)
        })
    },
    getAllProducts: (prodId) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })
    },
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                resolve(response)
            })
        })
    },
    blockUser: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(prodId) }, {
                $set: {
                    action: false
                }
            }).then(() => {
                resolve(response)
            })
        })
    },
    unblockUser: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(prodId) }, {
                $set: {
                    action: true
                }
            }).then(() => {
                resolve(response)
            })
        })
    },
    getProductDetails: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((product) => {
                resolve(product)
            })
        })
    },
    doAdd: (product) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
                resolve(data.insertedId)
            })
        })
    },
    updateProduct: (proId, proDetals) => {
        return new Promise((resolve, reject) => {
            console.log(proDetals);
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {

                    Proname: proDetals.Proname,
                    description: proDetals.description,
                    price: proDetals.price,
                    offerprice: proDetals.offerprice,
                    storage: proDetals.storage,
                    color: proDetals.color,
                    ram: proDetals.ram,
                    stock: proDetals.stock,
                    cat: proDetals.cat,
                    brand: proDetals.brand,
                    image: proDetals.image

                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    addCategory: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(catId).then(() => {
                resolve()
            })
        })
    },
    getCategory: (prodId) => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },
    deleteCategory: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },
    cancelOrder: (orderId) => {
        console.log(orderId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    status: 'canceld'
                }
            }).then(() => {
                resolve(response)
            })
        })
    },
    
    addToBanner: (proId) => {
        let proObj = {
            item: objectId(proId)
        }
        return new Promise(async (resolve, reject) => {
            let banner = await db.get().collection(collection.BANNER_COLLECTION).findOne({ product: objectId(proId) })

            if (banner) {
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                    $set: {
                        banner: null
                    }
                }).then((response) => {
                    db.get().collection(collection.BANNER_COLLECTION).remove({ product: objectId(proId) })
                    resolve(response)
                })
            } else {
                db.get().collection(collection.BANNER_COLLECTION).insertOne({ product: objectId(proId) }, {
                    $push: { item: proObj }
                }).then((response) => {
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                        $set: {
                            banner: 'banner'
                        }
                    })
                    resolve(response)
                })
            }
        })
    },
    getAllBanner: () => {
        return new Promise(async (resolve, reject) => {

            let bannerItems = await db.get().collection(collection.BANNER_COLLECTION).aggregate([
                // {
                //     $match: { user: objectId(userId) }
                // },
                // {
                //     $unwind: '$product'
                // },
                // {
                //     $project: {
                //         // item: '$products.item',
                //         // quantity: '$products.quantity'

                //         product: 1
                //     }
                // },
                // console.log(product)
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'product',
                        foreignField: '_id',
                        as: 'banner'
                    }
                },
                {
                    $project: {
                        product: { $arrayElemAt: ['$banner', 0] }
                    }
                }
            ]).toArray()
            console.log(bannerItems);
            resolve(bannerItems)
        })

    },
    getCodTotal: () => {
        return new Promise(async (resolve, reject) => {
            let totalAmount = {}
            totalAmount.codTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { paymentMethod: "COD" }
                },
                {
                    $group: {
                        _id: 0,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            totalAmount.razorpayTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { paymentMethod: "razorpay" }
                },
                {
                    $group: {
                        _id: 0,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            totalAmount.paypalTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { paymentMethod: "paypal" }
                },
                {
                    $group: {
                        _id: 0,
                        totalAmount: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]).toArray()
            totalAmount.orders = await db.get().collection(collection.ORDER_COLLECTION).count()
            totalAmount.products = await db.get().collection(collection.PRODUCT_COLLECTION).count()
            totalAmount.users = await db.get().collection(collection.USER_COLLECTION).count()
            totalAmount.income = totalAmount.paypalTotal[0].totalAmount + totalAmount.razorpayTotal[0].totalAmount + totalAmount.codTotal[0].totalAmount
            console.log(totalAmount.income);
            resolve(totalAmount)
        })
    },
    changeOrderStatus: (details) => {
        return new Promise((resolve, reject) => {
            if (details.status == 1) {
                details.status = 'pending'
            } else if (details.status == 3) {
                details.status = 'canceld'
            } else if (details.status == 4) {
                details.status = 'deleverd'
            } else if (details.status == 5) {
                details.status = 'returned'
            } else {
                details.status = 'placed'
            }
            console.log(details.status);
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(details.order) },
                    {
                        $set: { status: details.status }
                    }
                ).then((response) => {
                    resolve({ changeStatus: true })
                })
        })
    },
    salesDaily: () => {

        return new Promise(async (resolve, reject) => {

            let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {

                    $unwind: '$products'

                },
                {
                    $project:
                    {
                        date: 1, totalAmount: 1, item: '$products.item', quantity: '$products.quantity'
                    }
                },
                {
                    $lookup:
                    {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },

                {
                    $unwind: '$products'
                },

                {
                    $project:
                    {
                        totalAmount: 1, date: 1, quantity: 1, product: '$products.Proname', Price: '$products.price'
                    }
                },

                {
                    $group: {
                        _id: { day: { $dayOfMonth: '$date' }, month: { $month: '$date' }, year: { $year: '$date' }, product: '$product', price: '$Price' },


                        total: { $sum: { $multiply: ['$totalAmount', '$quantity'] } }, quantity: { $count: {} }   
                    }
                },
                {
                    $sort: { '_id.day': 1 }
                }
            ]).toArray()
            resolve(data) 
        })
    },

    addCategoryOffer: (offerDetails) => {
        return new Promise(async(resolve, reject) => {
            let data = await db.get().collection(collection.OFFER_COLLECTION).findOne({ cat: offerDetails.cat })
            if (data) {
                db.get().collection(collection.OFFER_COLLECTION).updateOne({ cat: offerDetails.cat },
                    {
                        $set: { offer: offerDetails.offer }
                    }
                ).then((data) => {
                    resolve(data)
                })
            } else {
                db.get().collection(collection.OFFER_COLLECTION).insertOne(offerDetails).then((data) => {
                    resolve(data)
                })
            }
        })
    },
    getOffer:()=>{
        return new Promise(async (resolve, reject) => {
            let offer = await db.get().collection(collection.OFFER_COLLECTION).find().toArray()
            resolve(offer)
        })
    },
    applyOffer: (offerDetails) => {
        console.log(offerDetails.cat);
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collection.PRODUCT_COLLECTION).find({ cat: offerDetails.cat }).toArray()
            data.map(async (data) => {
                let actualPrice = data.offerprice
                let discountPrice = actualPrice * offerDetails.offer / 100
                let offerPrice = actualPrice - discountPrice
                await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ _id:data._id },
                    {
                        $set: { price: offerPrice }
                    }
                )
            })
            resolve()
        })
    },
    addCupon:(cuponData)=>{
        cuponData.user=[]
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CUPON_COLLECTION).insertOne(cuponData).then((data) => {
                resolve(data)
            })
        })
    }
}