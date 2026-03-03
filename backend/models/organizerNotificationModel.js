import mongoose from 'mongoose';


const notificationSchema = new mongoose.Schema({

to:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Organizer',
},
from:{
    type: mongoose.Schema.Types.Mixed,
    required: true,
},
fromType:{
    type: String,
    required: true,
    enum: ['Organizer', 'Attendee', 'Admin', 'EventSphere']
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

export default mongoose.model('OrganizerNotification', notificationSchema);
