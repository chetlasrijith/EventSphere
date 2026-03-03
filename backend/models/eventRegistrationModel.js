import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
    event:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'event'
    },
    attendee:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendee'
    },
}, { timestamps: true });

const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);
export default EventRegistration;