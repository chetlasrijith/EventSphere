import mongoose, { mongo } from "mongoose";
import whiteList from "./whiteListSchema";
const adminSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['SuperAdmin', 'Admin'], default: 'Admin' },
    status:{ 
        type:String,
        enum:['approved', 'pending','rejected'],
        default:'pending'
    },
    approvedBy:{ 
        type:mongoose.Schema.Types.ObjectId,
        ref:'Admin',
    }
})
adminSchema.pre(("save"),function(next){
    if(this.role == 'SuperAdmin'){
        if(!whiteList.find(this.email)){
            throw next(new Error("you are unauthorized as a super admin enter a valid credentials"));
        }
        next();
    }
    if(this.role=='Admin'){
        if(!whiteList.find(this.email)){
            throw next(new Error("Only a super admin can give access to the admin"));
        }
    }
    next();
})

const admin = mongoose.model('Admin',adminSchema);

export default admin;