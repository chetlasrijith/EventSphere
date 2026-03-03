import bcrypt from "bcrypt";

import organizer from "../models/organizerModel.js";
import event from "../models/eventModel.js"
import organizerNotification from "../models/organizerNotificationModel.js";
import adminNotification from "../models/adminNotificationModel.js"
import streamifier from "streamifier";

import {v2 as cloudinary} from 'cloudinary';
import organizerNotificationModel from "../models/organizerNotificationModel.js";
import attendeeNotificationModel from "../models/attendeeNotificationModel.js";
import attendeeModel from "../models/attendeeModel.js";

export const updateOrganizer = async (req, res) => {
    try {
        const { username, email, password, mobileNumber, address, experience, acheivments, about } = req.body;
        const userId = req.user._id;
        let user = await organizer.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Organizer not found" });
        }
        if (password && password.length < 6) {
            return res.status(400).json({ message: "Password length should be at least 6 characters" });
        }
        let hashPassword;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashPassword = await bcrypt.hash(password, salt);
        }
        user.username = username || user.username;
        user.email = email || user.email;
        user.mobileNumber = mobileNumber || user.mobileNumber;
        user.address = address || user.address;
        user.experience = experience || user.experience;
        user.acheivments = acheivments || user.acheivments;
        user.about = about || user.about;
        if (hashPassword) {
            user.password = hashPassword;
        }
        user = await user.save();
        user.password = null;
        return res.status(200).json(user);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: `Internal error - ${err.message}` });
    }
};
export const updateProfileImage = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }
  
      // Fetch the current profile image URL from the database
      const currentOrganizer = await organizer.findById(req.user.id);
      if (!currentOrganizer) {
        return res.status(404).json({ error: "Organizer not found" });
      }
  
      const currentImageUrl = currentOrganizer.profileImg;
      if (currentImageUrl) {
        // Extract public ID from Cloudinary URL
        const publicId = currentImageUrl.split("/").pop().split(".")[0];
  
        // Delete previous image from Cloudinary
        await cloudinary.uploader.destroy(`profile_images/${publicId}`);
      }
  
      // Upload the new image to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "profile_images" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
          }
  
          try {
            // Update profile image in database
            const updatedOrganizer = await organizer.findByIdAndUpdate(
              req.user.id,
              { profileImg: result.secure_url },
              { new: true }
            );
  
            res.json({ success: true, profileImg: updatedOrganizer.profileImg });
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
export const updateEventBanner = async (req, res) => {
    try {
        if (!req.file) {
          return res.status(400).json({ error: "No image uploaded" });
        }
        // Fetch the current profile image URL from the database
        const currentOrganizer = await organizer.findById(req.user.id);
        if (!currentOrganizer) {
          return res.status(404).json({ error: "Organizer not found" });
        }
        const currentImageUrl = currentOrganizer.banner;
        if (currentImageUrl) {
          // Extract public ID from Cloudinary URL
          const publicId = currentImageUrl.split("/").pop().split(".")[0];
    
          // Delete previous image from Cloudinary
          await cloudinary.uploader.destroy(`banner_images/${publicId}`);
        }
    
        // Upload the new image to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "banner_images" },
          async (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error);
              return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
            }
    
            try {
              // Update profile image in database
              const {eventId}=req.body;
              const updatedEvent = await event.findByIdAndUpdate(
                eventId,
                { banner: result.secure_url },
                { new: true }
              );
    
              res.json({ success: true, banner: updatedEvent.banner });
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
}
export const updateCoverImage = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }
  
      // Fetch the current cover image URL from the database
      const currentOrganizer = await organizer.findById(req.user.id);
      if (!currentOrganizer) {
        return res.status(404).json({ error: "Organizer not found" });
      }
  
      const currentCoverImageUrl = currentOrganizer.coverImage;
      if (currentCoverImageUrl) {
        // Extract public ID from Cloudinary URL
        const publicId = currentCoverImageUrl.split("/").pop().split(".")[0];
  
        // Delete previous cover image from Cloudinary
        await cloudinary.uploader.destroy(`cover_images/${publicId}`);
      }
  
      // Upload the new cover image to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "cover_images" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
          }
  
          try {
            // Update cover image in the database
            const updatedOrganizer = await organizer.findByIdAndUpdate(
              req.user.id,
              { coverImage: result.secure_url },
              { new: true }
            );
  
            res.json({ success: true, coverImage: updatedOrganizer.coverImage });
          } catch (err) {
            console.error("Database Update Error:", err);
            res.status(500).json({ error: "Failed to update cover image" });
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
export const createEvent = async (req,res)=>{
    const {eventname,category,startDate,endDate,venue,address,eventType,ticketsRequired,price,maxAttendees} = req.body;
    const {speakers,services,sponsers} = req.body;
    const { street, city, state, postalCode, country } = address;


    const organizerId = req.user._id;

    try{
        let org = organizer.findById(organizerId);
        if(!org){
            return res.status(404).json({message:"User not found"});
        }
        if(!eventname){
            return res.status(404).json({message:"eventname is mandatory"});
        }
        if(!category){
            return res.status(404).json({message:"categoty is mandatory"});
        }
        if(!startDate){
            return res.status(404).json({message:"event start date is mandatory"});
        }
        if(!street){
            return res.status(404).json({message:"event street should be provided"});
        }
        if(!city){
            return res.status(404).json({message:"event  city should be provided"});
        }
        if(!postalCode){
            return res.status(404).json({message:"event postal code should be provided"});
        }
        if(!state){
            return res.status(404).json({message:"event state should  be provided"});
        }
        if(!country){
            return res.status(404).json({message:"event country should be provided"});
        }
        if(!ticketsRequired){
            return res.status(404).json({message:"Mention event is ticket oriented (or) not"});
        }
        if(!price){
            return res.status(404).json({message:"Mention the fair for entry"});
        }
        if(!maxAttendees){
            return res.status(404).json({message:"Enter the maximum number of attendees for the event"});
        }
        if(!speakers){
            return res.status(404).json({message:"Mention speakers for the event(promotional purpose)"});
        }
        if(!sponsers){
            return res.status(404).json({message:"Enter the sponsers list of the event(promotional purpose)"});
        }

        const newevent =new event({
            eventname,
            category,
            startDate,
            endDate,
            venue,
            address,
            eventType,
            ticketsRequired,
            price,
            maxAttendees,
            speakers,
            services,
            sponsers,
            banner:"",
        })
        newevent.organizer=organizerId;
        await newevent.save();
        // await org.events.push(newevent._id.toString());
        const subject = `${eventname} - created successfully`;
        const message = "Your event has been successfully created! 🎉 Attendees can now view and register for your event. Thank you for using our platform to bring your event to life!";
        const notifyOrganizer =new organizerNotification({
            to:organizerId,
            from:'EventSphere',
            fromType:'EventSphere',
            subject:subject,
            message:message,
        })
        await notifyOrganizer.save();
        return res.status(200).json({success:"Successful"});
        
    }catch(err){
        console.log(`Error occured at createevent controller`);
        return res.status(500).json({error:`Internal error has occured - ${err}`});
    }
};
export const eventList =async (req, res) => {
    try{
        const userId = req.user._id;
        if(!userId){
            return res.status(404).json({notFound:"User not found"});
        }
        const events = await event.find({ organizer: userId });
        return res.status(200).json({"events":events});
    }catch(err){
        console.log(`Error occured at eventList Controller -${err}`);
        return res.status(500).json({error:`Internal error has occured - ${err}`});
    }
};
export const getEvent = async (req, res) =>{
    try{
        const eventId = req.params.eventId;
        const eventDetails = await event.findById(eventId);
        if(!eventDetails){
            return res.status(404).json({error:"event not found"});
        }
        return res.json(eventDetails);
    }catch(err){
        console.log(`Error occured at getEvent Controller -${err}`);
        return res.status(500).json({error:`Internal error has occured - ${err}`});
    }
};
export const getMe = async (req, res) => {
    try{

        const userId = req.user._id;
        if(!userId){
            return res.status(404).json({notFound:"User not found"});
        }
        const user  = await organizer.findById(userId).select('-password');
        if(!user){
            return res.status(404).json({notFound:"User not found"})
        }
        return res.status(200).json({user});

    }catch(err){
        console.log(`Error has occured at organizer get me functions`);
        return res.status(500).json({error:`Internal error has occured -${err}`})
    }
}
export const getName = async (req, res) => {
    try{

        const userId = req.user._id;
        if(!userId){
            return res.status(404).json({notFound:"User not found"});
        }
        const user  = await organizer.findById(userId).select('-password');
        if(!user){
            return res.status(404).json({notFound:"User not found"})
        }
        return res.status(200).json({organizerName:user.username});

    }catch(err){
        console.log(`Error has occured at organizer get me functions`);
        return res.status(500).json({error:`Internal error has occured -${err}`})
    }
}
export const getNotifications = async (req, res) => {
    try {
        const notifications = await organizerNotificationModel
          .find() // Filter notifications where 'to' is 'Admin'
          .sort({ createdAt: -1 }) // Sort by latest
          .lean();
        const formattedNotifications = notifications.map((notification) => ({
          id: notification._id,
          from: notification.from?.name || "Unknown",
          fromType: notification.fromType,
          subject: notification.subject,
          message: notification.message,
          profileImage:"",
          time: "2 hours ago", // You can enhance this by calculating the exact time using a date library
        }));
        res.status(200).json(formattedNotifications);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
      }
}
export const MessageAdmin = async (req, res) => {
    try{
        const {subject,message} = req.body;
        const organizerId = req.user._id;
        const orga = await organizer.findById(organizerId);
        if(!orga){
            return res.status(400).json({notFound:"organizer not found"});
        }
        const notify = new adminNotification({
            to:"Admin",
            from:organizerId,
            fromType:'Organizer',
            subject,
            message
        })
        await notify.save();
        return res.status(200).json({sent:"Message sent to the Admin"});
    }catch(err){
        console.log(`Error occured at writeMessageToAdmin - ${err}`);
        return res.status(500).json({err:"Internal error occured"});
    }
}
export const getNotification = async(req, res) => {
  try {
      const { notificationId} = req.params;
      if (!notificationId) {
        return res.status(400).json({ error: "Notification ID is required" });
      }
      const notification = await organizerNotificationModel
        .findById(notificationId)
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
export const updateToAttendee = async (req,res)=>{
  try {
    const { title, message } = req.body;

    // Find all attendees
    const attendees = await attendeeModel.find({});
    if (!attendees.length) {
      return res.status(404).json({ notFound: "No attendees found" });
    }

    // Create notifications for all attendees
    const notifications = attendees.map((attendee) => ({
      to: attendee._id,
      from: req.user._id,          // Assuming the sender is the logged-in admin
      fromType: "Organizer",
      subject: title,
      message: message
    }));

    await attendeeNotificationModel.insertMany(notifications);

    return res.status(200).json({ success: "Successfully sent the message to all attendees" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}