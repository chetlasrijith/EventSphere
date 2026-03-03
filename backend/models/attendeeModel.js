import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,  
        required: true
    },
    mobileNumber: {
        type: String
    },
    profileImg:{
        type: String,
        default:"",
    },
    registeredEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventRegistration'
    }],
}, { timestamps: true });

// Check if the model already exists before defining it
const Attendee = mongoose.models.attendees || mongoose.model('attendees', attendeeSchema);

export default Attendee;
