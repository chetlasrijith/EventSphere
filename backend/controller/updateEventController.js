import organizer from "../models/organizerModel.js";
import eventModel from "../models/eventModel.js";
import notification from "../models/organizerNotificationModel.js";

import mongoose from 'mongoose'

export const simpleUpdate = async (req, res) => {
    try{
        const eventId = req.params.eventId;
        const userId = req.user._id;
        // in simple update many things come into the picture
        // ---> 1) services
        const {speakers,services,sponsers} = req.body;
        const {roar} = req.body;
        // const {images,banner} = req.body;
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ error: "Invalid eventId format" });
          }
        const event =await eventModel.findById(eventId);
        if(!event){
            return res.status(404).json({notFound: `Event not found`});
        }
        const orga =await organizer.findById(userId);
        if(!orga){
            return res.status(404).json({notFound: `Organizer not found`});
        }
        if(speakers){
            const mergedSpeakers = [...new Set([...speakers,...event.speakers])];
            event.speakers=mergedSpeakers;
        }
        if(services){
            const mergedServices = [...new Set([...services,...event.services])];
            event.services=mergedServices;
        }
        if(sponsers){
            const mergedSponsers = [...new Set([...sponsers,...event.sponsers])];
            event.sponsers=mergedSponsers;
        }
        if(roar){
            event.roar=roar;
        }
        // if(images){
        //     Array.prototype.push.apply(event.images, images);
        // }
        // if(banner){
        //     event.banner = banner;
        // }
        await event.save();
        const subject = `Updates Made to Your Event: ${eventname}`;
        const message = `Hello, \n\nWe wanted to let you know that updates have been successfully applied to your event: "${eventname}".\n\nFeel free to review the changes and ensure everything is set as intended. If you need further adjustments, you can make them anytime through your dashboard.\n\nThank you for choosing our platform to manage your events!\n\nBest regards, \n[EventSphere]`;
        const notify = new notification({
            to:userId,
            from:'evelent',
            fromType:'EventSphere',
            subject:subject,
            message:message,
        });
        notify.save();
        return res.status(200).json({success:`Event updated successfully`});
    }catch(err){
        console.log(`Error occured at simple update event`);
        return res.status(500).json({message: `Internal error occured - ${err.message}`});
    }
}
export const criticalUpdate = async (req, res) => {
    try{
        const eventId = req.params.eventId;
        const userId = req.user._id;
        const {startDate, endDate,venue,address,price,maxAttendees} = req.body;
        const { street, city, state, postalCode, country } = address;
        const event = await eventModel.findById(eventId);
        if(!event){
            return res.status(404).json({Notfound:"event not found"});
        }
        const org = organizer.findById(userId);
        if(!org){
            return res.status(404).json({Notfound:"organizer not found"});
        }
        if(startDate&&endDate){
            const differenceInMs = endDate - startDate;
            const differenceInHours = differenceInMs / (1000 * 60 * 60);
            if(differenceInHours>3){
                // Make the cancelation policy applicable fot 100% refund
            }
            else{
                event.startDate=startDate;
                event.endDate=endDate;
                event.roar=`The event is delayed for ${differenceInHours} sorry for inconvience`;
            }
        }
        if(venue&&address){
            // Make the cancelation policy applicable fot 100% refund
            event.venue=venue;
            event.address=address;
        }
        if(maxAttendees){
            if(maxAttendees>event.maxAttendees){
                event.maxAttendees=maxAttendees;
            }
            else{
                // becareful mail transefer for inconvinience
            }
        }
        const subject = `Critical Updates Applied to Your Event: ${eventName}`;
        const message = `Dear Organizer, \n\nWe regret to inform you that critical updates have been applied to your event: "${eventName}". These changes were necessary but may affect the planned format of the event. \n\nWe understand this may cause inconvenience, and we assure you that we are here to assist in minimizing the impact. Additionally, attendees will have the option to request a 100% refund if they find the changes unsuitable.\n\nPlease review the updates and reach out to our support team if you require assistance or would like to discuss the next steps. We sincerely appreciate your understanding and cooperation in this matter. \n\nThank you for your continued trust in our platform.\n\nBest regards, \n[EventSphere]`;
        const notify = new notification({
            to:userId,
            from:'evelent',
            fromType:'EventSphere',
            subject:subject,
            message:message,
        });
        notify.save();
    }catch(err){
        console.log(`Error occured at critical update event`);
        return res.status(500).json({message: `Internal error occured - ${err.message}`});
    }
}