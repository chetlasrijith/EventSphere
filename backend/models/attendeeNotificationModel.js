import mongoose from 'mongoose';


const notificationSchema = new mongoose.Schema({

to:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'attendees',
},
from:{
    type: mongoose.Schema.Types.Mixed,
    required: true,
},
fromType:{
    type: String,
    required: true,
    enum: ['Organizer', 'Admin', 'EventSphere']
},
subject:{
    type:String,
    required: true,
    maxLenght:50
},
message:{
    type:String,
    required: true,
}
});

export default mongoose.model('AttendeeNotification', notificationSchema);
