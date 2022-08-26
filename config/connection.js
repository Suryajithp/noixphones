const mongoClient=require('mongodb').MongoClient
const state={
    db:null
} 
module.exports.connect=function(done){
   const url='mongodb+srv://suryajith:Mongodb@noixphone.jbecpei.mongodb.net/?retryWrites=true&w=majority'
//    const url='mongodb://localhost:27017'
    const dbname='galexy'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
    })

    done()
}
 
module.exports.get=function(){
    return state.db
}
