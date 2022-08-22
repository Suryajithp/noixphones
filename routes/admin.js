const express = require('express');
const { response } = require('../app');
const productHelpers = require('../helpers/product-helpers')
const router = express.Router();
const multer = require('multer');

let userName = "Admin"
let Pin = "12345"

let authenticate = (req,res,next)=>{
  if (req.session.users) {
    next()
  }
  else{
    res.render('admin/admin-login', { errout: req.session.err });
    req.session.err = false;
  }
}

/* GET users listing. */
router.get('/',authenticate, function (req, res, next) {
    res.redirect('/admin/dashboard');
})
///////    DASHBOARD  ------>>>>>>>
router.get('/dashboard',authenticate, (req, res) => {
  productHelpers.getCodTotal().then((Total) => {
    productHelpers.salesDaily().then((data)=>{
      res.render('admin/dashboard', { admin: true,Total,data});
    })

  })
})
//////   VIEW PRODUCT  ------>>>>>>>
router.get('/view-products',authenticate,(req, res, next) => {
    productHelpers.getAllProducts().then((products) => {
      res.render('admin/view-products', { admin: true, products });
    })
})
///////   VIEW USER ----->>>>>>
router.get('/view-users',authenticate, (req, res, next) => {
    productHelpers.getAlluser().then((products) => {
      res.render('admin/view-users', { admin: true, products });
    })
})
////   ADMIN LOGIN  ------->>>>>>>
router.post('/admin-login', (req, res) => {
  const { Email, Password } = req.body;
  if (userName === Email && Pin === Password) {
    req.session.check = true;
    req.session.users = {
      userName
    }
    res.redirect('/admin/dashboard')
  }
  else {
    req.session.err = "incorrect username or password"
    res.redirect('/admin')
  }
})
/////   DELETE PRODUCT ----->>>>>>
router.get('/delete-product/:id',authenticate,(req, res) => {
  let proId = req.params.id
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/view-products');
  })
})

//////   USER BLOCK ----->>>>>>
router.get('/block-user/:id',authenticate,(req, res) => {
  let proId = req.params.id
  productHelpers.blockUser(proId).then((response) => {
    req.session.user = null
    req.session.loggedIn = null
    res.redirect('/admin/view-users')
  })
})
/////   USER UNBLOCK ----->>>>>
router.get('/unblock-user/:id',authenticate,(req, res) => {
  let proId = req.params.id
  productHelpers.unblockUser(proId).then((response) => {
    res.redirect('/admin/view-users')
  })
})
//////  MULTER   --->>>>>
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('stehat')
    cb(null, "./public/product-images")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname)
  }
})

const upload = multer({ storage: fileStorageEngine })

/////   ADD PRODUCT --->>>>
router.get('/add-product',authenticate,function (req, res) {
  productHelpers.getCategory().then((category)=>{
    res.render('admin/add-product',{admin:true,category})
  })
})

router.post('/add-product',upload.array('image',4),(req,res)=>{
  var filenames = req.files.map(function(file){
    return file.filename;
  })
  req.body.image = filenames;
  console.log(req.body);
    productHelpers.doAdd(req.body).then(() => {
      res.redirect('/admin/view-products')
    })
})
/////   EDIT PRODUCT ----->>>>>>
router.get('/update-product/:id',authenticate,async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  productHelpers.getCategory().then((category)=>{
  res.render('admin/update-product', { product, admin: true,category});
  })
})
router.post('/update-product/:id',upload.array('image',4), async (req, res) => {
  if(!req.file){
    let product = await productHelpers.getProductDetails(req.params.id)

    req.body.image = product.image;
  }else{
    var filenames = req.files.map(function(file){
      return file.filename;
    })
    req.body.image = filenames;
  }
  console.log(req.body);
  productHelpers.updateProduct(req.params.id, req.body).then((response) => {
    res.redirect('/admin/view-products')
  })

})
/////// ADD CATEGORY  ----->>>>>>>>>>>
router.get('/add-category',authenticate,(req,res)=>{
  productHelpers.getCategory().then((category)=>{
    res.render('admin/add-category',{admin:true,category})
  })
})
router.post('/add-category',authenticate,(req,res)=>{
  productHelpers.addCategory(req.body).then(()=>{
    res.redirect('/admin/add-category')
  })
})
///// DELETE CATEGORY  ---->>>>>>
router.get('/delete-category/:id',authenticate,(req, res) => {
  let catId = req.params.id
  productHelpers.deleteCategory(catId).then(() => {
    res.redirect('/admin/add-category');
  })
})
/////// ORDER LIST ----->>>>>
router.get('/orders',authenticate,(req,res)=>{
  productHelpers.getAllOrders().then((response)=>{
    res.render('admin/orders',{admin:true,response})
  })
})
///// DELETE ORDER ---->>>>>>
// router.get('/status-order/:id',authenticate,(req, res) => {
//   let orderId = req.params.id
//   productHelpers.cancelOrder(orderId).then(() => {
//     res.redirect('/admin/orders');
//   })
// })
///////  BANNER MANNAGE  ----->>>>
router.get('/banner',authenticate,(req,res)=>{
  productHelpers.getAllBanner().then((products) => {
    res.render('admin/banner', { admin: true, products });
  })
})
router.get('/add-banner/:id',authenticate,(req, res) => {
  let proId = req.params.id
  console.log("yes")
  productHelpers.addToBanner(proId).then((response) => {
    res.redirect('/admin/view-products');
  })
})
//// CHANGE ORDER STATUS   ---->>>>
router.post('/change-orderstatus',authenticate,(req,res)=>{
  console.log(req.body);
productHelpers.changeOrderStatus(req.body).then(async(response)=>{
res.json(response)
})
})
////  CATEGORY OFFER ----->>>>>>
router.get('/category-offer',authenticate,async(req, res) => {
  let offer=await productHelpers.getOffer()
  productHelpers.getCategory().then((category)=>{
   res.render('admin/category-offer',{ admin: true,offer,category});
  })
})
router.post('/category-offer',authenticate,(req,res)=>{
  productHelpers.addCategoryOffer(req.body)
  console.log(req.body);
    productHelpers.applyOffer(req.body).then((response)=>{
    res.redirect('/admin/category-offer')
  })
})
//////  CUPON ------>>>>>>>
router.get('/cupon',authenticate,(req, res) => {
  // productHelpers.getCategory().then((category)=>{
   res.render('admin/cupon',{ admin: true});
  // })
})
router.post('/cupon',authenticate,(req,res)=>{
  productHelpers.addCupon(req.body).then(()=>{
    res.redirect('/admin/cupon')
  })
})
////// LOG OUT ----->>>>>>>
router.get('/logout', (req, res) => {
  req.session.users = null
  res.redirect('/admin')
})
module.exports = router;
