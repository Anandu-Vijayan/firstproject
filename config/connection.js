const mongoClient=require('mongodb').MongoClient
const state={
    db:null

}

module.exports.connect=function(done){
    const url='mongodb+srv://magicalspirits:13795891303@cluster0.mbaku.mongodb.net/?retryWrites=true&w=majority'
    
    const dbname='liquor'



    mongoClient.connect(url,(err,data)=>{
        if(err) done(err)
        state.db=data.db(dbname)
        done()
    })


}
module.exports.get=function(){
    return state.db
}