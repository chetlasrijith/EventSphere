import organizerModel from "../models/organizerModel.js";
import adminModel from "../models/adminModel.js";
import artistModel from "../models/artistModel.js";
import eventModel from "../models/eventModel.js";
import organizernotificationModel from "../models/organizerNotificationModel.js";
import adminNotificationModel from "../models/adminNotificationModel.js";
import streamifier from "streamifier";
import { cv2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import attendeeNotificationModel from "../models/attendeeNotificationModel.js";
import attendeeModel from "../models/attendeeModel.js";

export const listApprovePedingEvents = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await adminModel.findById(adminId);

    if (!admin) {
      return res
        .status(401)
        .json({ Unauthorized: `Unauthorized access to the admin page` });
    }
    const { search = "", page = 1, limit = 10 } = req.query;
    const query = {
      ...(search && { username: { $regex: search, $options: "i" } }),
      status: "pending",
    };
    const pendingEvents = await eventModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const totalMatches = await eventModel.countDocuments(query);
    return res.json({
      events: pendingEvents,
      total: totalMatches,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching events." });
  }
};

export const listApprovedEvents = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await adminModel.findById(adminId);

    if (!admin) {
      return res
        .status(401)
        .json({ Unauthorized: `Unauthorized access to the admin page` });
    }

    const currentDate = new Date();
    
    // Update status to completed for events whose endDate is less than currentDate
    await eventModel.updateMany(
      { endDate: { $lt: currentDate }, status: { $ne: "completed" } },
      { $set: { status: "completed" } }
    );

    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      ...(search && { username: { $regex: search, $options: "i" } }),
      status: "approved",
    };

    const approvedEvents = await eventModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalMatches = await eventModel.countDocuments(query);

    return res.json({
      events: approvedEvents,
      total: totalMatches,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching events." });
  }
};


export const listCancledEvents = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await adminModel.findById(adminId);

    if (!admin) {
      return res
        .status(401)
        .json({ Unauthorized: `Unauthorized access to the admin page` });
    }

    const { search = "", page = 1, limit = 10 } = req.query;
    const query = {
      ...(search && { username: { $regex: search, $options: "i" } }),
      status: "cancled",
    };
    const canceledEvents = await eventModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const totalMatches = await eventModel.countDocuments(query);
    return res.json({
      events: canceledEvents,
      total: totalMatches,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching events." });
  }
};

export const listCompletedEvents = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await adminModel.findById(adminId);

    if (!admin) {
      return res
        .status(401)
        .json({ Unauthorized: `Unauthorized access to the admin page` });
    }

    const currentDate = new Date();
    
    // Update status to completed for events whose endDate is less than currentDate
    await eventModel.updateMany(
      { endDate: { $lt: currentDate }, status: { $ne: "completed" } },
      { $set: { status: "completed" } }
    );

    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      ...(search && { username: { $regex: search, $options: "i" } }),
      status: "completed",
    };

    const completedEvents = await eventModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalMatches = await eventModel.countDocuments(query);

    return res.json({
      events: completedEvents,
      total: totalMatches,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching events." });
  }
};


export const listOrganizers = async (req, res) => {
  try {
    const adminId = req.user._id;
    if (!adminId) {
      return res.status(402).json({ error: "Invalid admin id" });
    }

    const admin = await adminModel.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    let { search = "", page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers
    page = Math.max(Number(page), 1);
    limit = Math.max(Number(limit), 1);

    const query = search ? { username: { $regex: search, $options: "i" } } : {};

    // Fetch unique organizers in sorted order
    const organizersList = await organizerModel
      .find(query)
      .sort({ _id: 1 }) // Ensures consistent unique order
      .skip((page - 1) * limit)
      .limit(limit);

    const totalMatches = await organizerModel.countDocuments(query);

    return res.status(200).json({
      organizers: organizersList,
      currentPage: page,
      totalPages: Math.ceil(totalMatches / limit),
      totalMatches,
    });
  } catch (error) {
    console.error("Error occurred in list organizers:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteOrganizer = async (req, res) => {
  const adminId = req.user._id;
  if (!adminId) {
    return res.status(402).json({ invalid: "Invalid admin id" });
  }

  const admin = await adminModel.findById(adminId);
  if (!admin) {
    return res.status(404).json({ notFound: "Admin not found" });
  }
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ provide: "provide valid user name" });
    }
    const organizer = await organizerModel.find(username).populate("-password");
    const organizerId = organizer._id;
    await organizernotificationModel.deleteMany({ to: organizerId });
    await eventModel.deleteMany({ organizer: organizerId });
    await organizerModel.deleteOne(username);
    return res
      .status(200)
      .json({ success: `No longer ${username} is an organizer` });
  } catch (err) {
    console.log(`Error has occured at delete organizers`);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const writeMessageToOrganizer = async (req, res) => {
  const { subject, message } = req.body;
  try {
    const organizerId = req.params.organizerId;
    const organizer = await organizerModel.findById(organizerId);
    if (!organizer) {
      return res.status(400).json({ notFound: "organizer was not found" });
    }
    const adminId = req.user_id;
    const admin = await adminModel.findById(adminId).select("-password");
    if (!admin) {
      return res.status(400).json({ notFound: "admin was not found" });
    }
    const notify = new organizernotificationModel({
      to: organizer.organizerId,
      from: adminId,
      subject,
      message,
    });
    await notify.save();
    return res.status(200).json({ sent: "Notification sent successfully" });
  } catch (err) {
    console.log(`Error has occured at write message to organizer - ${err}`);
    return res.status(500).json({ Err: `Internal error has occured` });
  }
};

export const addArtist = async (req, res) => {
  const { artistName, genre, bio, birthdate, socialLinks } = req.body;
  try {
    if (!artistName || !genre || !bio || !birthdate || !socialLinks) {
      return res.status(400).json({ badRequest: "Provide all the fields" });
    }
    const newArtist = new artistModel({
      artistName,
      genre,
      bio,
      birthDate: birthdate,
      socialLinks,
    });
    await newArtist.save();
    return res.status(200).json({ Added: "Artist added successfully" });
  } catch (err) {
    console.log(`Error has occured at addArtist - ${err}`);
    return res.status(500).json({ Err: `Internal error has occured` });
  }
};
export const getName = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(404).json({ notFound: "User not found" });
    }
    const user = await adminModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ notFound: "User not found" });
    }
    return res.status(200).json({ adminName: user.username });
  } catch (err) {
    console.log(`Error has occured at organizer get me functions`);
    return res
      .status(500)
      .json({ error: `Internal error has occured -${err}` });
  }
};
export const getMe = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(404).json({ notFound: "User not found" });
    }
    const user = await adminModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ notFound: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.log(`Error has occured at organizer get me functions`);
    return res
      .status(500)
      .json({ error: `Internal error has occured -${err}` });
  }
};
export const getEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Fetch event details
    const event = await eventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Fetch organizer detail // Exclude password for security

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      return res.status(400).json({ error: "Invalid Organizer ID" });
    }
    const organizer = await organizerModel.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }
    return res.status(200).json(organizer);
  } catch (error) {
    console.error("Error fetching organizer details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getNotifications = async (req, res) => {
  try {
    const notifications = await adminNotificationModel
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
};
export const getNotification = async (req, res) => {
  try {
    const { notificationId} = req.params;
    if (!notificationId) {
      return res.status(400).json({ error: "Notification ID is required" });
    }
    const notification = await adminNotificationModel
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
};
export const MessageOrganizer = async (req, res) => {
  try{
    const {username} = req.body;
    const {subject,message} = req.body
    const organizer = await organizerModel.findOne({ username}); 
    if(!organizer ){
      return res.status(404).json({notFound:"organizer notfound"});
    }
    const notify=new organizernotificationModel({
      to:organizer._id,
      from:"Admin",
      subject:subject,
      message:message,
      fromType:"Admin",
    })
    notify.save();
    return res.status(200).json({success:"Successfully sent the message to the admin"});
  }catch(err){
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
export const updateToAttendee = async (req, res) => {
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
      fromType: "Admin",
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
// export const addArtistImage = async (req, res) => {
//     try {
//         if (!req.file) {
//           return res.status(400).json({ error: "No image uploaded" });
//         }

//         // Fetch the current profile image URL from the database
//         const currentAdmin = await adminModel.findById(req.user.id);
//         if (!currentAdmin) {
//           return res.status(404).json({ error: "Organizer not found" });
//         }

//         const currentImageUrl = currentAdmin.profileImg;
//         if (currentImageUrl) {
//           // Extract public ID from Cloudinary URL
//           const publicId = currentImageUrl.split("/").pop().split(".")[0];

//           // Delete previous image from Cloudinary
//           await cloudinary.uploader.destroy(`profile_images/${publicId}`);
//         }

//         // Upload the new image to Cloudinary
//         const uploadStream = cloudinary.uploader.upload_stream(
//           { folder: "profile_images" },
//           async (error, result) => {
//             if (error) {
//               console.error("Cloudinary Upload Error:", error);
//               return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
//             }

//             try {
//               // Update profile image in database
//               const updatedOrganizer = await artistModel.findByIdAndUpdate(
//                 req.user.id,
//                 { profileImg: result.secure_url },
//                 { new: true }
//               );

//               res.json({ success: true, profileImg: updatedOrganizer.profileImg });
//             } catch (err) {
//               console.error("Database Update Error:", err);
//               res.status(500).json({ error: "Failed to update profile image" });
//             }
//           }
//         );

//         // Pipe the uploaded image file (buffer) to Cloudinary
//         streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
// }
