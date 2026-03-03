import mongoose from "mongoose";

const organizerSchema =new mongoose.Schema({

    username:{
        type: String,
        required:true,
        unique: true,
    },
    password:{
        type: String,
        required:true,
    },
    mobileNumber:{
        type:String,
    },
    email:{
        type: String,
        required:true,
        unique: true
    },
    address: {
        street: { type: String, required: true }, 
        city: { type: String, required: true },   
        state: { type: String, required: true },  
        postalCode: { type: String, required: true }, 
        country: { type: String, required: true },
    },
    profileImg:{
        type:String,
        default:"",
    },
    coverImage:{
        type:String,
        default:"",
    },
    experience:[{
        organization:{ type:String, required:true},
        duration:{
            years:{
                type:Number, required:true,
                set: (value) => parseFloat(value),
                validate: {
                    validator: (value) => !isNaN(value),
                    message: 'Year must be a valid number'
                },
            },
            months:{
                type:Number, required:true,
                set: (value) => parseFloat(value),
                validate: {
                    validator: (value) => !isNaN(value),
                    message: 'month must be a valid number'
                },
            },
        }
    }], 
    eventCount:{
        type:Number,
        default:0
    },
    acheivments:[
        {
            type:String,
            maxlength:200,
            trim: true,
        }
    ],
    about:{
        type:String,
        maxlength:300,
        trim: true,
    },
    rating:{
        type:Number,
        default:0,
    },
    events:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'event',
    }],
},{timestamp:true})
organizerSchema.pre("save", function (next) {
    if (this.mobileNumber) {
        const mobileNumberRegex = /^[0-9]{10}$/; 
        if (!mobileNumberRegex.test(this.mobileNumber)) {
            const error = new Error("Invalid mobile number format. It should be a 10-digit number.");
            return next(error);
        }
    }
    next();
});
const organizer = mongoose.model('Organizer',organizerSchema);
export default organizer;