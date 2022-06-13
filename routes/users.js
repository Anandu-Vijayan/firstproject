var express = require('express');
const req = require('express/lib/request');
const { redirect } = require('express/lib/response');
const res = require('express/lib/response');
const async = require('hbs/lib/async');
const { getAllCatogaery } = require('../helpers/product-helpers');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  console.log(req.session.adminlog);
  if(!req.session.adminlog){
  res.render('adminpanal/login',);
}else{
  res.redirect('/admin/home')
}
});
adminCred={
  email:"admin@gmail.com",
  password:"12345"
}
router.get('/home',(req,res)=>{
  console.log(req.session.adminlog);
  if(req.session.adminlog==true){
  res.render('adminpanal/admin',{admin:true})
  }else{
    res.redirect('/admin',{adminErr:req.session.adminErr})
    res.session.adminErr=null
  }
})

router.post('/',(req,res)=>{
  if(req.body.email==adminCred.email && req.body.password == adminCred.password){
    req.session.adminlog=true
    res.redirect('/admin/home')
  }else{
    req.session.adminErr="Invalid username and password"
    res.redirect('/admin')
  }

})
router.get('/logout',(req,res)=>{
  req.session.adminlog=false
  res.redirect('/admin')
  
})
router.get('/table',(req,res)=>{
  productHelpers.getAllUsers().then((users)=>{
    res.render('adminpanal/table',{admin:true,users})

  })

  
})
router.get('/block-user/:id',(req,res)=>{
  userHelpers.blockUser(req.params.id).then((block)=>{
    res.redirect('/admin/table')

  })
  

})
router.get('/unblock-user/:id',(req,res)=>{
  userHelpers.unblockUser(req.params.id).then((unblock)=>{
    res.redirect('/admin/table')

  })

})
router.get('/add',(req,res)=>{
  if(req.session.adminlog){
    res.render('adminpanal/add',{admin:true})
  }else{
    res.redirect("/admin")
  }
  
})  
router.get('/ed',(req,res)=>{
  if(req.session.adminlog){
    productHelpers.getAllCatogaery().then((catogaerys)=>{
      res.render("adminpanal/ed",{admin:true,catogaerys})
    })
    
  }else{
    res.redirect("/admin")
  }
  
})
router.get('/addp',async (req,res)=>{
  if(req.session.adminlog){
    let catogaerys= await productHelpers.getAllCatogaery()
  res.render("adminpanal/addp",{admin:true, catogaerys})

  }else{
    res.redirect("/admin")
  }
})
router.get('/edp',(req,res,next)=>{
  if(req.session.adminlog){
  productHelpers.getAllProducts().then((product)=>{
    
    res.render("adminpanal/edp",{admin:true,product}) 
    

  })
}else{
  res.redirect("/admin")
}


  


})
router.post('/addp',(req,res)=>{
  if(req.session.adminlog){
   console.log(req.body.adminlog);
  //  console.log(req.files.Image);
  productHelpers.addProduct(req.body,(result)=>{
    res.redirect('/admin/addp')
   
    
  })
}else{
  res.redirect("/admin")
}

})
router.get('/edit-product/:id',async(req,res)=>{
  console.log("Connecting...");
  if(req.session.adminlog){
  let catogaerys= await productHelpers.getAllCatogaery()
  let product=await productHelpers.getProductDetails(req.params.id)
  res.render("adminpanal/edit-product",{admin:true,product,catogaerys})
  }else{
    res.redirect("/admin")
  }
})
router.post('/edit-product/:id',(req,res)=>{
  if(req.session.adminlog){
    
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/edp')
   
  })
  }else{
    res.redirect("/admin")
  }
})
router.get('/delete-product/:id',(req,res)=>{
  if(req.session.adminlog){
  let productId=req.params.id 
  console.log(productId);
  productHelpers.deleteProduct(productId).then((response)=>{
    res.redirect('/admin/edp')
  })
}else{
  res.redirect("/admin")
}

})
router.get('/action/:id',(req,res)=>{
})
router.post('/add',(req,res)=>{
  if(req.session.adminlog){
    console.log(req.body);
    // console.log(req.files.Image);
    productHelpers.addCatogaery(req.body,(result)=>{
      res.redirect("/admin/add")
    })
  

}else{
  res.redirect("/admin/add")
}
})
router.get("/edit-catogaerys/:id",async(req,res)=>{
  if(req.session.adminlog){
    let catogaerys=await productHelpers.getAllCatogaery(req.params.id)
    console.log(catogaerys);
  res.render('adminpanal/edit-catogaerys',{admin:true})
  }else{
    res.redirect("/admin/ed")
  }

})
router.get('/delete-catogaery/:id',(req,res)=>{
  if(req.session.adminlog){
    let catId=req.params.id 
    console.log(catId);
    productHelpers.deleteCatogaery(catId).then((response)=>{
      res.redirect("/admin/ed")
    })
  }

})
router.post("/edit-catogaerys/:id",(req,res)=>{
  productHelpers.updatCatogaerys(req.params.id,req.body).then(()=>{
    res.redirect("/admin/edit-catogaerys")
  })
})
router.get('/Instock/:id',(req,res)=>{
  productHelpers.Instock(req.params.id).then((Instock)=>{
    res.redirect('/admin/edp')

  })
  

})
router.get('/OutofStock/:id',(req,res)=>{
  productHelpers.outofStock(req.params.id).then((outofStock)=>{
    res.redirect('/admin/edp')

  })

})
module.exports = router;
