import mongoose from 'mongoose';


const connectMongoDb = async () =>{
    try{
        const conn  = await mongoose.connect("mongodb://127.0.0.1:27017/eventManager");
        console.log("Connected to MongoDB")
    }catch(err){
        console.log(`Error has occured ${err.message}`);
        process.exit(1);
    }
}
export default connectMongoDb;