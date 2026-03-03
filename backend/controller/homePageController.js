import eventModel from '../models/eventModel.js';
import Attendee from '../models/attendeeModel.js';
export const getTopBanners = async (req,res)=>{
    try {
        const currentDate = new Date(); // Get the current date and time
        
        const events = await eventModel.find({ 
                startDate: { $gt: currentDate } ,
                status:"approved", // Start date greater than current date
            })
            .sort({ startDate: 1 }) // Sort by start date ascending (soonest first)
            .limit(5) // Get top 5 events
            .select('_id banner eventname startDate address.city') // Select required fields
            .lean(); // Get plain JS objects instead of Mongoose documents
        
        // Format the response
        const formattedEvents = events.map((event, index) => ({
            id: index + 1,
            image: event.banner,
            title: event.eventname,
            date: new Date(event.startDate).toISOString().split('T')[0], // Format date as YYYY-MM-DD
            location: event.address.city
        }));

        res.status(200).json(formattedEvents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }

}
export const getTopEvents = async (req, res) => {
    try {
        const currentDate = new Date(); // Get the current date and time
        
        const events = await eventModel.find({ 
                startDate: { $gt: currentDate } ,
                status:"approved", // Start date greater than current date
            })
            .sort({ startDate: 1 }) // Sort by start date ascending (soonest first)
            .limit(20) // Get top 20 events
            .select('_id eventname startDate address.city banner category services') // Select required fields
            .lean(); // Get plain JS objects instead of Mongoose documents
        
        // Format the response
        const formattedEvents = events.map((event) => ({
            id:event._id,
            title: event.eventname,
            date: new Date(event.startDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }), // Format date as "Month Day, Year"
            location: event.address.city,
            description: event.services || "Experience an unforgettable event.",
            banner: event.banner,
            category: event.category
        }));

        res.status(200).json(formattedEvents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}
export const getEventDetails=async (req, res) => {
    try {
           const eventId = req.params.eventId;
   
           const eventDetails = await eventModel.findById(eventId);
           if (!eventDetails) {
               return res.status(404).json({ error: "Event not found" });
           }
           let isRegistered=false;
           const User=await Attendee.findById(req?.user?._id);
           if(User){
               isRegistered=User.registeredEvents.includes(eventId);
           }
           return res.json({ ...eventDetails.toObject(),isRegistered});
       } catch (err) {
           console.error(`Error occurred at getEvent Controller - ${err}`);
           return res.status(500).json({ error: `Internal error has occurred - ${err}` });
       }
   
   }