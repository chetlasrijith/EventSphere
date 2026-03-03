import Attendee from "../models/attendeeModel.js";
import EventRegistration from "../models/eventRegistrationModel.js";
import bcrypt from "bcrypt";
import Event from '../models/eventModel.js';
import Ticket from '../models/ticketModel.js'
import mongoose from "mongoose";
import {v2 as cloudinary} from 'cloudinary';
import streamifier from "streamifier";
import attendeeNotficationModel from '../models/attendeeNotificationModel.js';


export const updateProfileImage = async (req, res) => {
    try {
      if (!req.file) {

        return res.status(400).json({ error: "No image uploaded" });
      }
  
      // Fetch the current profile image URL from the database
      const currentAttendee = await Attendee.findById(req.user._id);
      if (!currentAttendee) {
        return res.status(404).json({ error: "Attendee not found" });
      }
      const currentImageUrl = currentAttendee.profileImg;
      if (currentImageUrl) {
        // Extract public ID from Cloudinary URL
        const publicId = currentImageUrl.split("/").pop().split(".")[0];
  
        // Delete previous image from Cloudinary
        await cloudinary.uploader.destroy(`profile_images/${publicId}`);
      }
    //   Upload the new image to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "profile_images" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
          }
  
          try {
            // Update profile image in database
            const updatedAttendee = await Attendee.findByIdAndUpdate(
              req.user._id,
              {profileImg: result.secure_url },
              { new: true }
            );
  
            res.json({ success: true, profileImg: updatedAttendee.profileImg });
          } catch (err) {
            console.error("Database Update Error:", err);
            res.status(500).json({ error: "Failed to update profile image" });
          }
        }
      );
  
      // Pipe the uploaded image file (buffer) to Cloudinary
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } catch (err) {
      console.error("Internal Server Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

export const eventRegistration = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const attendeeId = req.user._id;
        // Create a new event registration
        const eventDetails = await Event.findById(eventId);
        if(eventDetails.currentAttendees==eventDetails.maxAttendees){
            return res.status(400).json({completed:"All the bookings are completd"});
        }
        const registration = new EventRegistration({
            event:eventId,
            attendee: attendeeId
        });
        await registration.save();
        // Update the attendee's registered events list
        const attendee = await Attendee.findById(attendeeId);
        if (!attendee) {
            return res.status(404).json({ message: "Attendee not found" });
        }
        attendee.registeredEvents.push(eventId);
        await attendee.save();
        const currentAttendee = eventDetails.currentAttendees;
        eventDetails.currentAttendees=currentAttendee+1;
        eventDetails.save();
        res.status(201).json({
            message: "Successfully registered for the event",
            registration,
            eventDetails
        });
    } catch (err) {
        console.error("Error registering for event:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getName = async (req, res) => {
    try{
        const userId = req.user._id;
        if(!userId){
            return res.status(404).json({notFound:"User not found"});
        }
        const user  = await Attendee.findById(userId).select('-password');
        if(!user){
            return res.status(404).json({notFound:"User not found"})
        }
        return res.status(200).json({attendeeName:user.username});
    }catch(err){
        console.log(`Error has occured at organizer get me functions`);
        return res.status(500).json({error:`Internal error has occured -${err}`})
    }
}
export const getMe = async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(404).json({ message: "User ID not found" });
        }

        const user = await Attendee.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (err) {
        console.error("Error in getMe function:", err);
        res.status(500).json({ error: `Internal server error - ${err.message}` });
    }
};

export const updateAttendee = async (req, res) => {
    try {
        const { userName, email, mobileNumber } = req.body;
        const userId = req.user._id;
        const profileImg = req.file?.path; // Assuming file upload middleware adds the file path to req.file

        let user = await Attendee.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Attendee not found" });
        }

        // Update other fields
        user.userName = userName || user.userName;
        user.email = email || user.email;
        user.mobileNumber = mobileNumber || user.mobileNumber;
        user.profileImg = profileImg || user.profileImg;

        // Save updated user
        user = await user.save();
        res.status(200).json({
            message: "Profile updated successfully",
            user,
        });
    } catch (err) {
        console.error("Error updating attendee profile:", err);
        res.status(500).json({ error: `Internal server error - ${err.message} `});
    }
};

export const createTicket = async (req, res) => {
    try {
        const { eventId, bookingId, secretCode, qrCodeValue} = req.body;
        const attendeeId=req.user._id;
        const eventExists = await Event.findById(eventId);
        if (!eventExists) {
            return res.status(404).json({ message: "Event not found" });
        }
        const attendeeExists = await Attendee.findById(attendeeId);
        if (!attendeeExists) {
            return res.status(404).json({ message: "Attendee not found" });
        }
        const ticket = new Ticket({ eventId, bookingId, secretCode, qrCodeValue, attendeeId });
        await ticket.save();
        
        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate("eventId").populate("attendeeId");
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const eventList =async (req, res) => {
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
};

export const myEventList = async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(404).json({ notFound: "User not found" });
        }

        if (!req.user || !req.user.registeredEvents || req.user.registeredEvents.length === 0) {
            return res.status(200).json({ events: [] }); 
        }
        const eventIds = req.user.registeredEvents.map(id => new mongoose.Types.ObjectId(id));
        const events = await Event.find({ _id: { $in: eventIds } });

        return res.status(200).json({ events });
    } catch (err) {
        console.log(`Error occurred at myEventList Controller - ${err}`);
        return res.status(500).json({ error: `Internal error has occurred - ${err}` });
    }
};

export const getEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;

        const eventDetails = await Event.findById(eventId);
        if (!eventDetails) {
            return res.status(404).json({ error: "Event not found" });
        }
        const isRegistered=req.user.registeredEvents.includes(eventId);
        return res.json({ ...eventDetails.toObject(), isRegistered });
    } catch (err) {
        console.error(`Error occurred at getEvent Controller - ${err}`);
        return res.status(500).json({ error: `Internal error has occurred - ${err}` });
    }
};

export const search=async (req,res)=>{
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ error: "Query parameter is required" });
    
        const events = await Event.find({
          $or: [
            { eventName: { $regex: query, $options: "i" } }, // Case-insensitive search
            { category: { $regex: query, $options: "i" } },
            { speakers: { $regex: query, $options: "i" } },
          ],
        });
    
        res.json(events);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
}
export const attendeeNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
  
    const notifications = await attendeeNotficationModel
      .find({ to: userId }) // Filter notifications where 'to' is the logged-in user's ID
      .sort({ createdAt: -1 }) // Sort by latest
      .lean();
  
    const formattedNotifications = notifications.map((notification) => ({
      id: notification._id,
      from: notification.from?.name || "Unknown",
      fromType: notification.fromType,
      subject: notification.subject,
      message: notification.message,
      profileImage: "",
      time: "2 hours ago", // You can enhance this by calculating the exact time using a date library
    }));
  
    res.status(200).json(formattedNotifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
  
 };

 export const attendeeNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
  
    if (!notificationId) {
      return res.status(400).json({ error: "Notification ID is required" });
    }
  
    const notification = await  attendeeNotficationModel
      .findOne({ _id: notificationId, to: userId }) // Check if 'to' matches the logged-in user's ID
      .lean();
  
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
  
    const formattedNotification = {
      id: notification._id,
      from: notification.from?.name || "Unknown",
      fromType: notification.fromType,
      subject: notification.subject,
      message: notification.message,
      profileImage: notification.from?.profileImage || " ",
      time: "2 hours ago", 
    };
  
    res.status(200).json(formattedNotification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
  
 }