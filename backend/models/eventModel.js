import mongoose from "mongoose";


const eventSchema = new mongoose.Schema({
    eventname:{
        type:String,
        required:true,
        unique:true,
    },
    organizer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Organizer'
    },
    category:{
        type:String,
        required:true,
    },
    startDate:{
        type:mongoose.Schema.Types.Date,
        required:true,
        validate: {
            validator: function (value) {
            return !isNaN(new Date(value).getTime());
        },
            message: "Invalid date format",
        },
    },
    endDate:{
        type:mongoose.Schema.Types.Date,
        required:true,
        validate: {
            validator: function (value) {
            return !isNaN(new Date(value).getTime()); 
            },
            message: "Invalid date format",
        },
    },
    duration:{
        type:Number,
    },
    venue:{
        type:String,
        required:true,
    },
    address: {
        street: { type: String, required: true }, 
        city: { type: String, required: true },   
        state: { type: String, required: true },  
        postalCode: { type: String, required: true }, 
        country: { type: String, required: true },
    },
    eventType:{
        type:String,
        enum:['public','private'],
        required:true,
        default:'public',
    },
    ticketsRequired:{
        type:Boolean,
        default:false,
        set: (value) => {
            if (typeof value === 'string') {
              return value.toLowerCase() === 'true'; 
            }
            return Boolean(value);
        }
    },
    price:{
        type:Number,
        default:0,
        set: (value) => parseFloat(value),
        validate: {
            validator: (value) => !isNaN(value),
            message: 'Ticket price must be a valid number.'
        },
    },
    maxAttendees:{
        type:Number,
        required:true,
        set: (value) => parseFloat(value),
        validate: {
            validator: (value) => !isNaN(value),
            message: 'Ticket price must be a valid number.'
        },
    },
    currentAttendees:{
        type:Number,
        default:0,
        set: (value) => parseFloat(value),
        validate: {
            validator: (value) => !isNaN(value),
            message: 'Ticket price must be a valid number.'
        },
    },
    // images:[{
    //     type:String,
    // }],
    banner:{
        type:String,
        default:"",
    },
    speakers:{
        type:String,
    },
    services:{
        type:String}
    ,
    sponsers:{
        type:String,
    },
    status:{
        type:String,
        enum:['pending','approved','cancled','completed'],
        default:"pending"
    },
    approvedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Admin'
    },
    canceledBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Admin'
    },
    roar:{
        type:String,
        default:"Event not started yet"
    },
    // attedees:[{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:'attendees'
    // }]
},{timestamps:true});
eventSchema.pre("save", function (next) {
    if (this.startTime >= this.endTime) {
      return next(new Error("Start time must be before end time"));
    }
    next();
});
const event = mongoose.model('event',eventSchema);
export default event