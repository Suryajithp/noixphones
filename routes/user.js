const express = require('express');
// const { response } = require('../app');
const router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const paypal = require('paypal-rest-sdk')
const { response } = require('../app');
var userDetais;

let authenticateUser = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.render('user/login', { "loginerr": req.session.loginErr, loginerr2: req.session.loginErrb })
    req.session.loginErr = false
    req.session.loginErrb = false
  }
}
// let user = req.session.user
/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    let user1 = req.session.user
    let cartCount = 0
    let wishlist = 0
    if (user1) {
      cartCount = await userHelpers.getCartcount(user1._id)
      wishlist = await userHelpers.getWishlistProducts(user1._id)
    }
    let banner = await productHelpers.getAllBanner()

    productHelpers.getAllProducts().then((products) => {     
      if (wishlist >= 1) {
        for (let i = 0; i < wishlist.length; i++) {
          for (let j = 0; j < products.length; j++) {
            if (wishlist.products[i].item == products._id[j]) {
              products.wishlist = true
            }
          }
        }
      }
      res.render('index', { products, user: true, user1, cartCount, banner, wishlist })
    })
  } catch (error) {
    console.log(error);
  }
});
//////  LOGIN ------->>>>>
router.get('/login', authenticateUser, (req, res) => {
  try {
    res.redirect('/')
  } catch (error) {
    console.log(error);
  }

})
router.post('/login', (req, res) => {
  try {
    userHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
        if (!response.user) {
          req.session.loginErrb = true
          res.redirect('/login')
        } else {
          req.session.user = response.user
          req.session.loggedIn = true
          res.redirect('/')
        }
      } else {
        req.session.loginErr = true
        res.redirect('/login')
      }
    })
  } catch (error) {
    console.log(error);
  }

})
/////////  SIGNUP ------->>>>>>
router.get('/signup', (req, res) => {
  try {
    if (req.session.loggedIn) {
      res.redirect('/')
    } else {
      res.render('user/signup', { signerr: req.session.signErr, otpErr: req.session.otpErr })
      req.session.signErr = false
      req.session.otpErr = false
    }
  } catch (error) {
    console.log(error);
  }

})
router.post('/signup', (req, res) => {
  try {
    userHelpers.doSignup(req.body).then((response) => {
      if (response.status) {
        req.session.signErr = true
        res.redirect('/signup')
      } else {
        userDetais = response.userData
        res.render('user/verify-otp')
      }
    })
  } catch (error) {
    console.log(error);
  }

})
router.post('/verify-otp', (req, res) => {
  try {
    userHelpers.signupOtp(req.body, userDetais).then((response) => {
      if (response.err) {
        req.session.otpErr = response.err
        res.redirect('/signup')
      } else {
        req.session.user = response
        req.session.loggedIn = true
        res.redirect('/')
      }
    })
  } catch (error) {
    console.log(error);
  }

})
///////  SINGLE PRODUCT VIEW --->>>>>>
router.get('/view-single/:id', authenticateUser, async (req, res) => {
  try {
    let cartCount = await userHelpers.getCartcount(req.session.user._id)
    let product = await productHelpers.getProductDetails(req.params.id)
    res.render('user/view-single', { product, user: req.session.user, cartCount })
  } catch (error) {
    console.log(error);
  }
})
/////// WISHLIST -------->>>>>>> 
router.get('/wishlist', authenticateUser, async (req, res) => {
  try {
    let products = await userHelpers.getWishlistProducts(req.session.user._id)
    // let cartCount=await userHelpers.getCartcount(req.session.user._id)
    res.render('user/wishlist', { products, user: req.session.user })
  } catch (error) {
    console.log(error);
  }

})
router.get('/wishlist/:id', (req, res) => {
  try {
    userHelpers.addToWishlist(req.params.id, req.session.user._id).then((response) => {
      res.json(response)
    })
  } catch (error) {
    console.log(error);
  }

})
router.post('/remove-wishlist-product', authenticateUser, (req, res) => {
  try {
    userHelpers.removeWishlistProduct(req.body).then(async (response) => {
      res.json(response)
    })
  } catch (error) {
    console.log(error);
  }

})
///////   CART VIEW ----->>>>>>
router.get('/cart', authenticateUser, async (req, res) => {
  try {
    let products = await userHelpers.getCartProducts(req.session.user._id)
    let cartCount = await userHelpers.getCartcount(req.session.user._id)
    let total = 0
    console.log(cartCount);
    if (cartCount >= 1) {
      total = await userHelpers.getTotalAmount(req.session.user._id)
    }
    res.render('user/cart', { products, user: req.session.user, total, cartCount })
  } catch (error) {
    console.log(error);
  }

}) 
router.get('/cart/:id', (req, res) => {
  try {
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true })
    })
  } catch (error) {
    console.log(error);
  }

})
////////////    CHANGE VALUE ------>>>>>>>
router.post('/change-product-quantity', (req, res) => {
  try {
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await userHelpers.getTotalAmount(req.body.user)
      res.json(response)
    })
  } catch (error) {
    console.log(error);
  }

})
/////////  REMOVE PRODUCT CART  ------->>>>>>
router.post('/remove-product', authenticateUser, (req, res) => {
  try {
    userHelpers.removeCartProduct(req.body).then(async (response) => {
      res.json(response)
    })
  } catch (error) {
    console.log(error);
  }

})
/////////    CHECK OUT AND PLACE ORDER ----->>>>>>
router.get('/checkout', authenticateUser, async (req, res) => {
  try {
    let address = await userHelpers.getAllAddress(req.session.user._id)   // address
    // let total = await userHelpers.getTotalAmount(req.session.user._id)  // cart total
    let wallet = await userHelpers.getWallet(req.session.user._id)
    let products = await userHelpers.getCartProducts(req.session.user._id)
    let cartCount = await userHelpers.getCartcount(req.session.user._id)
    let total = 0
    if (products.length >= 1) {
      total = await userHelpers.getTotalAmount(req.session.user._id)
      res.render('user/checkout', { total, address, wallet, user: req.session.user._id,cartCount })
    }else{
      res.redirect('/cart')
    }
  } catch (error) {
    console.log(error);
  }

})
router.post('/checkout', async (req, res) => {
  try {
    let products = await userHelpers.getCartProductsList(req.body.userId)
    let totalPrice = req.body.total
    req.session.total = totalPrice
    userHelpers.placeOrder(req.body, products, req.session.total).then((orderId) => {
      /////     cash on delivery  ------>>>>>>>
      if (req.body['payment-method'] == 'COD') {
        res.json({ codSuccess: true })
        ////////       wllet payment ------>>>>>
      } else if (req.body['payment-method'] == 'wallet') {
        res.json({ walletSuccess: true })  
        ////////       paypal payment  -------->>>>>>> 
      } else if (req.body['payment-method'] == 'paypal') {
        userHelpers.generatePaypal(orderId, req.session.total).then((response) => {
          console.log(response);
          res.json(response)
        })
      } else {
        /////         razor pay ------>>>>>>>
        userHelpers.generateRazorpay(orderId, req.session.total).then((response) => {
          response.razorpay = true
          res.json(response)
        })
      }
    })
  } catch (error) {
    console.log(error);
  }

})
router.get('/success', async (req, res) => {
  try {
    console.log(req.session.total);
    const payerId = req.query.PayerID
    const paymentId = req.query.paymentId

    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
        "amount": {
          "currency": "USD",
          "total": req.session.total
        }
      }]
    }
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
        console.log(paymentId, execute_payment_json);
      } else {
        console.log("GET payment RESponce");
        console.log(JSON.stringify(payment));
        res.redirect('/order-success')
      }
    })
  } catch (error) {
    console.log(error);
  }

})
///////  ADDRESS ------->>>>>>>
router.get('/add-address/:id', authenticateUser, (req, res) => {
  try {
    let user = req.params.id
    res.render('user/add-address', { user })
  } catch (error) {
    console.log(error);
  }

})
router.post('/add-address', authenticateUser, (req, res) => {
  try {
    console.log(req.body)
    userHelpers.addAddress(req.body).then(() => {
      res.redirect('/checkout')
    })
  } catch (error) {
    console.log(error);
  }

})
//---------->>>
router.get('/order-success', authenticateUser, (req, res) => {
  try {
    res.render('user/order-success', { user: req.session.user })
  } catch (error) {
    console.log(error);
  }

})
///////  PROFILE  ----->>>>>>>
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    let user = await userHelpers.getUser(req.session.user._id)
    console.log(user);
    res.render('user/profile', { user })
  } catch (error) {
    console.log(error);
  }

})
///// ODERS LIST  --->>>>>>
router.get('/order-list', authenticateUser, async (req, res) => {
  try {
    let orders = await userHelpers.getOrders(req.session.user._id)
    console.log(orders);
    res.render('user/order-list', { user: req.session.user, orders })
  } catch (error) {
    console.log(error);
  }

})
///// DELETE ORDER ---->>>>>>
router.get('/cancel-order/:id', authenticateUser, (req, res) => {
  try {
    let orderId = req.params.id
    productHelpers.cancelOrder(orderId).then(() => {
      res.redirect('/order-list');
    })
  } catch (error) {
    console.log(error);
  }

})
////// RETURN ORDER  -------->>>>>>>
router.get('/return-order/:id', authenticateUser, (req, res) => {
  try {
    let orderId = req.params.id
    userHelpers.retrunOrder(orderId, req.session.user._id).then(() => {
      res.redirect('/order-list');
    })
  } catch (error) {
    console.log(error);
  }

})
////// VIEW ORDER PRODUCT -------->>>>>>>
router.get('/view-order-products/:id', authenticateUser, async (req, res) => {
  try {
    let orderId = req.params.id
    let products = await userHelpers.getUserOders(req.params.id)
    let address = await userHelpers.getUserAddress(req.params.id)
    res.render('user/view-order-products', { user: req.session.user, orderId, address, products })
  } catch (error) {
    console.log(error);
  }

})
router.post('/verify-payment', (req, res) => {
  try {
    userHelpers.verifyPayment(req.body).then(() => {
      userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
        console.log("payment success");
        res.json({ status: true })
      })
    }).catch((err) => {
      console.log(err);
      res.json({ status: false, errMsg: '' })
    })
  } catch (error) {
    console.log(error);
  }

})
///////   PRDUCT INVOICE ------>>>>>
router.get('/invoice/:id', authenticateUser, async (req, res) => {
  try {
    let orderId = req.params.id
    let details = await userHelpers.getUserOders(req.params.id)
    let address = await userHelpers.getUserAddress(req.params.id)
    console.log(details);
    console.log('hfkljdsa');
    res.render('user/view-invoice', { user: req.session.user, details, address, orderId });
  } catch (error) {
    console.log(error);
  }


})
//////    ADDRESS LIST  ---->>>>>
router.get('/address-list', authenticateUser, async (req, res) => {
  try {
    let address = await userHelpers.getAllAddress(req.session.user._id)
    console.log(address);
    res.render('user/address-list', { user: req.session.user, address })
  } catch (error) {
    console.log(error);
  }

})
/////  EDIT ADDRESS -------->>>>>>>>>
router.get('/address-edit/:id', authenticateUser, async (req, res) => {
  try {
    let address = await userHelpers.getAddress(req.params.id)
    console.log(address);
    res.render('user/address-edit', { user: req.session.user, address })
  } catch (error) {
    console.log(error);
  }

})
router.post('/address-edit/:id', authenticateUser, (req, res) => {
  try {
    let data = req.body
    let addressId = req.params.id
    userHelpers.changeAddress(data, addressId).then((response) => {
      if (response.err) {
        req.session.editErr = response.err
        res.redirect('/edit-user')
      } else {
        res.redirect('/profile')
      }

    })
  } catch (error) {
    console.log(error);
  }

})
////////  DELETE ADDRESS  --->>>>>
router.get('/delet-address/:id', authenticateUser, (req, res) => {
  try {
    let addressId = req.params.id
    userHelpers.deleteAddress(addressId).then(() => {
      res.redirect('/address-list');
    })
  } catch (error) {
    console.log(error);
  }

})
//////  EDIT PROFILE  ---->>>>>>
router.get('/edit-user', authenticateUser, (req, res) => {
  try {
    res.render('user/edit-user', { user: req.session.user, editErr: req.session.editErr })
  } catch (error) {
    console.log(error);
  }

})
router.post('/edit-user/:id', authenticateUser, (req, res) => {
  try {
    userHelpers.editUser(req.params.id, req.body).then((response) => {
      if (response.err) {
        req.session.editErr = response.err
        res.redirect('/edit-user')
      } else {
        res.redirect('/profile')
      }

    })
  } catch (error) {
    console.log(error);
  }

})
//////   CHANGE PASSWORD ------>>>>>>
router.get('/change-password', authenticateUser, (req, res) => {
  try {
    res.render('user/change-password', { user: req.session.user })
  } catch (error) {
    console.log(error);
  }

})
router.get('/otp-password', authenticateUser, (req, res) => {
  try {
    userHelpers.doChangepass(req.session.user).then((response) => {
      res.render('user/otp-password', { response })
    })
  } catch (error) {
    console.log(error);
  }

})
router.post('/otp-password', authenticateUser, (req, res) => {
  try {
    userHelpers.verifyOtp(req.body, req.session.user).then((response) => {
      if (response.err) {
        req.session.otpErr = response.err
        res.redirect('/otp-password')
      } else {
        req.session.user
        res.render('user/password-change')
      }
    })
  } catch (error) {
    console.log(error);
  }

})
router.post('/password-change', authenticateUser, (req, res) => {
  try {
    let userId = req.session.user._id
    console.log(userId);
    userHelpers.changePassword(req.body, userId).then((response) => {
      res.redirect('/profile')
    })
  } catch (error) {
    console.log(error);
  }

})

/////  CUPON APPLY  --------->>>>>>
router.post('/apply-cupon', authenticateUser, async (req, res) => {
  try {
    userHelpers.applyCupon(req.body, req.session.user._id).then((response) => {
      console.log(response);
      if (response.total) {
        req.session.total = parseInt(response.total)
      }
      res.json(response)
    })
  } catch (error) {
    console.log(error);
  }

})
////////  LOG OUT ------>>>>>>>
router.get('/logout', (req, res) => {
  try {
    req.session.loggedIn = null
    req.session.user = null
    res.redirect('/')
  } catch (error) {
    console.log(error);
  }
})
module.exports = router; 
