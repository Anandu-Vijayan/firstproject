var express = require('express');
const helpers = require('handlebars-helpers');
// const { Client } = require('twilio/lib/twiml/VoiceResponse');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var config=require('../config/otp')
var productHelper = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers');
const async = require('hbs/lib/async');
const { response } = require('express');
const { validateExpressRequest } = require('twilio/lib/webhooks/webhooks');
const { redirect } = require('express/lib/response');
const client = require("twilio")(config.accountSID, config.authToken);

const verifylogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login');
  }
};

/* GET home page. */
router.get('/',async function (req, res, next) {
  let loged = req.session.user
  let cartCount=null
  if(req.session.user){
   cartCount=await productHelpers.getCartCount(req.session.user._id)
  }  

  res.render('index', { user: true, loged, Error: req.session.Error,cartCount}); 
  req.session.Error = false
});

/*Login*/
router.get('/login', (req, res) => {

  if (req.session.user) {
    res.redirect('/')
  } else {

    res.render('login', { user: false, Error: req.session.Error })
    req.session.Error =  ""
  }

});
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (!response.loginn) {
      req.session.Error = "Sorry you are Blocked"
      res.redirect('/login')
    }
     else if (response.status) {
      req.session.user = response.user
      console.log(response.user);
      res.redirect('/')

    } else {

      req.session.Error = "Invalid Username or Password"
      res.redirect('/login')
      
    }
  
  

  })


})
/*Logout*/
router.get('/logout', (req, res) => {
  req.session.user = false
  console.log('distroy');
  res.redirect('/')
})


/*signup*/
router.get('/signup', (req, res) => {
  let Err = req.session.loginErr
  if (!req.session.user) {
    let err = true;
    res.render('signup', { user: false, Err})
    req.session.loginErr = false
  } else {
    res.redirect('/')
  }

});
router.get('/otp',(req,res)=>{
  if(req.session.user=true){
    res.redirect('/login')
  }else{
    var num=req.session.phone
    res.render('otp',{num,er:req.session.Er_otp})
    req.session.Er_otp=false
  }
  
  
})

router.post('/signup', (req, res) => {

  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);
    let number=req.body.phone_number
    req.session.userData=req.body
    req.session.phone=req.body.phone_number
    console.log(number);
    res.render('otp')
    client.verify.services(config.serviceSID).verifications.create({
      to:`+91${number}`,
      channel:"sms", 
    }).then((data)=>{
      console.log(data);
      console.log("line 40 data");

      res.redirect('/otp')
    })

   

  }).catch(() => {
    req.session.loginErr = "Entered user Existing"
    res.redirect('/signup')

  

  })





})
router.post('/otp',(req,res)=>{
  var otp=req.body.otp
  var number=req.session.phone

  client.verify.services(config.serviceSID).verificationChecks.create({
    to: `+91${number}`,
    code:otp,
  }).then((data)=>{
    console.log(data.status+"otp status???????");

    if(data.status=='approved'){
      userHelpers.doSignup(req.session.userData).then((response)=>{
        req.session.ok=true;
        res.redirect('/login')
      })
    }
    else{
      req.session.Er_otp='invalid otp'
      res.redirect('/otp')
    }
  })
  // userHelpers.doSignup(req.session.userData).then((response)=>{
  //   req.session.ok=true;
  //   res.redirect('/login')
  // })
})




router.get('/product',verifylogin, (req, res, next) => {
  let loged = req.session.user
  productHelpers.getAllProducts().then((product) => {
    res.render('product', { user: true, loged, product })
  })
})
router.get('/cart',verifylogin,async (req, res) => {
  let loged = req.session.user
  let products=await productHelpers.getCartProducts(req.session.user._id)
  console.log(req.session.user);
  let totalValue=await productHelpers.getTotalAmount(req.session.user._id)
  console.log(products); 
  let GrandTotal=totalValue+120
  res.render('cart',{ user: true, loged,user:req.session.user,products,GrandTotal,totalValue})
  
})
 router.get('/add-to-cart/:id',verifylogin,(req,res)=>{
   
  if(req.session.user){
   
   productHelpers.addToCart(req.params.id,req.session.user._id).then((response)=>{
    

    console.log("\nKKKKKKKKKK")
    res.redirect('/product')
   
   })
  }else{ 
    res.redirect('/')  
  } 
    
 })
 router.post('/change-product-quantity',(req,res,next)=>{
  
  console.log("helooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo");
   productHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await productHelpers.getTotalAmount(req.body.user)
    response.GrandTotal=response.total+120
    res.json(response) 
 console.log(req.body);
   }) 
 })
router.get('/about',verifylogin, (req, res) => { 
  let loged = req.session.user
  res.render('about', { user: true, loged })
})
router.get('/product-single/:id',verifylogin, (req, res) => {
  let loged = req.session.user
  productHelpers.getSingleProduct(req.params.id).then((product)=>{
    res.render('product-single', { user: true, loged,product})

  })
 
})
router.post("/remove-from-cart",(req,res)=>{
  console.log('dsdd'+req.body.cart+" gg "+req.body.product);
  productHelpers.removeFromCart(req.body).then((response)=>{
    res.json(response)
    console.log("workingggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg");
  }) 
})
router.get('/checkout',verifylogin,async (req, res) => { 
  let loged = req.session.user
  let total=await productHelpers.getTotalAmount(req.session.user._id)
  let GrandTotal=total+120
  res.render('checkout', { user: true, loged ,total,GrandTotal,user:req.session.user})
})
router.post('/checkout',async(req,res)=>{
  let products=await productHelpers.getCartProductList(req.body.userId)
  let GrandTotal=await productHelpers.getTotalAmount(req.body.userId)
  let total=GrandTotal+120
  productHelpers.placeOrder(req.body,products,total).then((response)=>{
    res.json({status:true})
  
  })
  console.log(req.body);

  
 
})
router.get ('/order-success',verifylogin,(req,res)=>{
  let loged = req.session.user
  
  res.render('order-success',{user:true,loged})
  
    // res.redirect('/login')
  
  
})

router.get ('/orders',verifylogin,async(req,res)=>{
  let loged = req.session.user
  let orders=await productHelpers.getUserOrders(req.session.user._id)
  
  res.render('orders',{user:req.session.user,user:true,loged,orders})
  
    // res.redirect('/login')
  
  
})
router.get('/view-order-products/:id',verifylogin,async(req,res)=>{
  let loged=req.session.user
  let products=await productHelpers.getOrderProducts(req.params.id)
  res.render('view-order-products',{user:req.session.user,user:true,loged})
})



router.get('/User',verifylogin, (req, res) => {
  let loged = req.session.user
  res.render('User', { user: true, loged })
})
router.get('/contact',verifylogin, (req, res) => {
  let loged = req.session.user
  res.render('contact', { user: true, loged })
})
router.get('/otp',(req,res)=>{
  res.render('otp')
})



module.exports = router;