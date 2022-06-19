const { promise, reject } = require('bcrypt/promises');
const { response } = require('express');
const async = require('hbs/lib/async');
const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_LzENomul3uevEZ',
    key_secret: 'XR8HpjEDW4U4yk01pct2rnkA',
});
var db = require('../config/connection')
var collection = require('../config/users')
var objectId = require('mongodb').ObjectId
module.exports = {
    addProduct: (product, callback) => {
        console.log(product);
        product.Price = parseInt(product.Price);
        // product.Stock=ParseInt(product.Stock);
        product.status = true;
        db.get().collection('products').insertOne(product).then((data) => {

            console.log(data);
            callback(true)


        })
    }, getAllProducts: () => {
        console.log("dfsfd");
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
            console.log(product);
        })
    },
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(productId) }).then((response) => {
                resolve(response)
            })

        })
    },
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) }).then((product) => {
                console.log(product);
                resolve(product)
            })
        })
    },
    updateProduct: (productId, productDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(productId) }, {
                    $set: {
                        Name: productDetails.Name,
                        catogaerys: productDetails.catogaerys,
                        Price: productDetails.Price,
                        Stock: productDetails.Stock,
                        Discription: productDetails.Discription

                    }
                }).then((response) => {
                    resolve()

                })
        })

    }, getAllUsers: () => {
        console.log("edsd");
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
            console.log(users);
        })

    }, addCatogaery: (catogaerys, callback) => {
        console.log(catogaerys);
        db.get().collection('catogaery').insertOne(catogaerys).then((data) => {
            console.log(data);
            callback(true)


        })
    }, getAllCatogaery: () => {
        console.log("007");
        return new Promise(async (resolve, reject) => {
            let catogaerys = await db.get().collection(collection.CATOGAERY_COLLECTION).find().toArray()
            resolve(catogaerys)
            // console.log(catogaerys);
        })
    },
    deleteCatogaery: (catId) => {
        console.log(catId);
        return new Promise((resolve, reject) => {

            db.get().collection(collection.CATOGAERY_COLLECTION).deleteOne({ _id: objectId(catId) }).then((response) => {
                resolve(response)
            })
        })

    },
    getCatogaerysDetails: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATOGAERY_COLLECTION).findOne({ _id: objectId(catId) }).then((catogaerys) => {
                resolve(catogaerys)
            })
        })
    },
    updatCatogaerys: (catId, catDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATOGAERY_COLLECTION)
                .updateOne({ _id: objectId(catId) }, {
                    $set: {
                        Name: catDetails.Name,
                        Catogaery: catDetails.Catogaery,
                    }
                }).then((response) => {
                    resolve()

                })
        })
    },
    Instock: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(id) }, { $set: { status: true, status: false } }).then((Instock) => {
                resolve(Instock)
                console.log(Instock);
            })

        })
    },
    outofStock: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(id) }, { $set: { status: false, status: true } }).then((outofStock) => {
                resolve(outofStock)
                console.log(outofStock);
            })

        })

    },
    getSingleProduct: (id) => {
        return new Promise((res, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) }).then((data) => {
                res(data)
            })
        })
    },
    addToCart: (productId, userId) => {
        let proObj = {
            item: objectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == productId)
                console.log(proExist);
                console.log('kukukkkkkkkkk666666666666666666666666');
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(productId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()

                    })

                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: proObj }
                        }


                    ).then((data) => {
                        resolve(data);
                    })
                }

            } else {
                console.log('OOIUUUUUU');
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((data) => {
                    resolve(data)

                })
            }

        })
    },
    getCartProducts: (userId) => {
        // console.log("Commi11111111111111111111111111111111111111111111111111");
        // console.log(userId);
        return new Promise(async (resolve, reject) => {
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
                        quantity: '$products.quantity',
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }
                    }
                }
            ]).toArray()
            // console.log(cartItems);
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
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
                        }

                    ).then((response) => {
                        resolve({ status: true })

                    })
            }
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
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$product.quantity', '$product.Price'] } }
                    }

                }

            ]).toArray()
            console.log(total);
            resolve(total)
        })

    },
    removeFromCart: (details) => {
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
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.Price'] } }


                    }
                }
            ]).toArray()
            if (total[0]) {
                resolve(total[0].total)

            } else {
                resolve(0)
            }


        })
    },
    placeOrder: (order, product, total) => {
        return new Promise((resolve, reject) => {
            console.log(total, product, order);
            console.log("kakakakkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkksdsadasdaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
            let status = order.paymentmethod === 'COD' ? 'Placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    Name: order.Name,
                    Address: order.Place,
                    Street: order.Street,
                    City: order.City,
                    Pincode: order.Pincode,
                    Mobile: order.Mobile,
                    Email: order.Email,
                },
                userId: objectId(order.userId),
                PaymentMethod: order.paymentmethod,
                products: product,
                Amount: total,
                status: status,

            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(response)
            })

        })

    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            console.log(cart);
            resolve(cart.products)
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
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
            console.log(orderItems);
            resolve(orderItems)

        })
    },
    cancelOrderList: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION ).updateOne({ _id: objectId(id) }, { $set: { status: false } }).then((cancel) => {
                resolve(cancel)
                console.log(cancel);
            })

        })
    },
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            console.log("jjjjjjjjjjjjj");
            let orderss = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            console.log(orderss);
            resolve(orderss)
        })
    },
    addToWhishlist: (productId, userId) => {
        let proObj = {
            item: objectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.WISH_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == productId)
                console.log(proExist);
                console.log('kukukkkkkkkkk666666666666666666666666');
                if (proExist != -1) {
                    db.get().collection(collection.WISH_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(productId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()

                    })

                } else {
                    db.get().collection(collection.WISH_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: proObj }
                        }


                    ).then((data) => {
                        resolve(data);
                    })
                }

            } else {
                console.log('OOIUUUUUU');
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.WISH_COLLECTION).insertOne(cartObj).then((data) => {
                    resolve(data)

                })
            }

        })
    },
    getWishList: (userId) => {
        // console.log("Commi11111111111111111111111111111111111111111111111111");
        // console.log(userId);
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.WISH_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }
                    }
                }
            ]).toArray()
            // console.log(cartItems);
            resolve(cartItems)
        })
    },
    removeFromWishList: (details) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.WISH_COLLECTION)
                .updateOne({ _id: objectId(details.wishList) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
        })
    },
    generateRazorpay: (orderId, total) => {
        console.log(orderId);
        return new Promise((resolve, reject) => {
            var options = {
                amount: total,
                currency: "INR",
                receipt: "order" + orderId.insertedId
            };
            instance.orders.create(options, function (err, order) {
                console.log("New Orders :", order);
                resolve(order)
            })


        })
        
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto =require('crypto');
            let hmac =crypto.createHmac('sha256','XR8HpjEDW4U4yk01pct2rnkA')

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }


        })
    },
    chagePayementStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'Placed'
                }
            }
            ).then(()=>{
                resolve( )
            })
        })
    },
    deleteOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).deleteOne({ _id: objectId(orderId) }).then((response) => {
                resolve(response)
            })

        })
    },

}