var express = require('express');
const helpers = require('handlebars-helpers');
// const { Client } = require('twilio/lib/twiml/VoiceResponse');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var config=require('../config/otp')
var productHelper = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers');
const async = require('hbs/lib/async');
const paypal =require('paypal-rest-sdk');
const { response } = require('express');
const { validateExpressRequest } = require('twilio/lib/webhooks/webhooks');
const { redirect } = require('express/lib/response');
const { payment } = require('paypal-rest-sdk');
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
   productHelpers.getAllProducts().then((product)=>{
    res.render('index', { user: true,product,loged, Error: req.session.Error,cartCount});
   })
   req.session.Error = false
  }else{
    productHelpers.getAllProducts().then((product)=>{
      res.render('index',{user:true,product})

    })
    

  }  
  
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
 router.get('/add-to-cart/:id',verifylogin,async(req,res)=>{
   
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
  let products=await productHelpers. getCartProductList(req.body.userId)
  let GrandTotal=await productHelpers.getTotalAmount(req.body.userId)
  let total=GrandTotal+120
  productHelpers.placeOrder(req.body,products,total).then((orderId)=>{
    console.log(orderId); 
    req.session.orderid=orderId 

    let conform={ID:orderId,codSuccess:'COD'}
    console.log("jasbcasxcbhxzchbhzclvxcbx");
    console.log(req.body);
    if(req.body['paymentmethod']=='COD'){
      console.log('6565656565656565')
      console.log(conform.codSuccess)
      
      res.json(conform) 

    }else if(req.body['paymentmethod']=='Online Pyament'){
      productHelpers.generateRazorpay(orderId,total).then((response)=>{
        console.log(response);
        response.codSuccess='razorpay'
        response.ID=orderId
        res.json(response)

      })

    }else{
      productHelpers.generatePaypal(orderId,total).then((payment)=>{
        console.log(response);
        response.ID=orderId
        res.json(payment)
      })
    }
    
  
  })
  console.log(req.body);

  
 
})
router.get('/success',async (req, res) => {
  let total=await productHelpers.getTotal(req.session.orderid)
  console.log(total.Amount);
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",

            "total":total.Amount
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        res.redirect('/order-success');
    }
});
});
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
  res.render('view-order-products',{user:req.session.user,user:true,loged,products})
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
router.get('/cancelOrder/:id',(req,res)=>{
  productHelpers.cancelOrderList(req.params.id).then((cancel)=>{
    res.redirect('/orders')

  })

})

router.get('/admin/ordersList',(req,res)=>{

  productHelpers.getAllOrders().then((orderss)=>{
  res.render('adminpanal/ordersList',{admin:true,orderss})
  console.log("ggggggggggggggggggg");
}) 

})
router.get('/wishlist',verifylogin,async(req, res) => {
  let loged = req.session.user
  console.log("sdasdfuksgdusdfgufdguidfiffsdf55555555555555555555555555555555555555");
  let product=await productHelpers.getWishList(req.session.user._id)
  console.log(product);
  res.render('whishlist', { user: true, loged,product})
})
router.get('/add-to-wishlist/:id',verifylogin,(req,res)=>{
  productHelpers.addToWhishlist(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/wishlist')
  })
 
})
router.post("/remove-from-Wishlist",(req,res)=>{
  console.log(req.body);
  console.log('dsdd'+req.body.wishList+" gg "+req.body.product);
  productHelpers.removeFromWishList(req.body).then((response)=>{
    res.json(response)
    console.log("workinkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
  }) 
})
router.post('/verify-Payment',(req,res)=>{
  console.log("pppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp");
  productHelpers.verifyPayment(req.body).then(()=>{
    console.log(req.body);
    productHelpers.chagePayementStatus(req.body['order[receipt]']).then(()=>{
      console.log("Payment successfull");
      res.json({status:true})
    })

  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})
  })
}) 
router.get ('admin/ordersList',verifylogin,async(req,res)=>{
  let loged = req.session.user
  let orders=await productHelpers.getUserOrders(req.session.user._id)
  
  
  res.render('adminpanal/ordersList',{user:req.session.user,user:true,loged,orders})
  
    // res.redirect('/login')
  
  
}) 
router.get('/cancelsOrder/:id',(req,res)=>{
  productHelpers.cancelOrderList(req.params.id).then((cancel)=>{
    res.redirect('/admin/ordersList')

  })
})
  


module.exports = router;