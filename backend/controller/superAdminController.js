import organizerModel from '../models/organizerModel.js'
import adminModel from '../models/adminModel.js'
import eventModel from '../models/eventModel.js'
import whiteListSchema from '../models/whiteListSchema.js'
import organizernotificationModel from '../models/organizerNotificationModel.js'
import adminNotificationModel from '../models/adminNotificationModel.js'

export const approveEvent = async (req, res) => {

    const admin = req.user._id;
    if(!admin){
        return res.status(401).json({unauthorized:`Unaauthorized access to the admin page`})
    }
    const {eventId} = req.params;
    if(!eventId){
        return res.status(404).json({notFound:`Event not found`})
    }
    const event = await eventModel.findById(eventId).select('-password');
    if(!event){
        return res.status(404).json({notFound:`Event not found`})
    }
    const organizerId = event.organizer;
    if(!organizerId){
        return res.status(404).json({notFound:`Organizer not found`})
    }
    event.status='approved';
    event.approvedBy = admin._id;
    await event.save();
    const approvalSubject = `Your Event Request for "${event.eventname}" Has Been Approved`;
    const orga =await organizerModel.findById(organizerId).select('-password');
    const approvalMessage = `
                            Dear ${orga.username},
                            We are pleased to inform you that your event request for "${event.eventname}" on ${event.startDate} has been approved. Thank you for your thoughtful proposal and effort in organizing this event.
                            Please feel free to reach out to us at website if you need any assistance or have additional details to share as you prepare for the event.
                            We look forward to its success and appreciate your dedication.
                            Best regards,  
                            ${admin.name}  
                            superAdmin  
                            EventSphere
                            `;
    const notify =new organizernotificationModel({
        to:organizerId,
        from:'admin',
        fromType:'Admin',
        subject:approvalSubject,
        message:approvalMessage,
    })
    await notify.save();
    return res.status(200).json({success:"Your event request is approved"});
}

export const cancelEvent =async (req, res) => {
    const admin = req.user._id;
    if(!admin){
        return res.status(401).json({unauthorized:`Unaauthorized access to the admin page`})
    }
    const {eventId} = req.params;
    if(!eventId){
        return res.status(404).json({notFound:`Event not found`})
    }
    const event = await eventModel.findById(eventId).select('-password');
    if(!event){
        return res.status(404).json({notFound:`Event not found`})
    }
    event.status='cancled';
    event.canceledBy=admin._id;
    await event.save();
    const {reason} = req.body;
    const cancelSubject="";
    const cancelMessage = "";
    const orga = await orgaModel.findById(organizerId).select('-password');
    if(!orga){
        return res.status(404).json({notFound:`Organizer not found`})
    }
    if(reason=='policy based'){
        cancelSubject = `Response to Your Event Proposal for "${orga.eventname}"`;
        cancelMessage = `Dear ${orga.username},

        Thank you for your interest in organizing "${orga.eventname}" with us. Unfortunately, we are unable to approve your request due to ${reason}.
        
        We truly appreciate your enthusiasm and dedication, and we hope to collaborate with you in the future. If you’d like to discuss this further or explore alternative options, please don’t hesitate to contact us.
        
        Thank you for your understanding and cooperation.
        
        Best regards,  
        ${admin.name}  
        superAdmin  
        EventSphere
        `;
    }
    else if(reason=='Lack of resources'){
        cancelSubject = `Notice Regarding Your Event Request for "${orga.eventname}"`;
        cancelMessage =`Dear ${orga.username},

        We appreciate your submission for "${event.ventname}" scheduled for ${event.startDate}. Unfortunately, due to current limitations in resources and capacity, we are unable to approve your request at this time.

        We apologize for any inconvenience this may cause and encourage you to consider resubmitting your request for a future date. Should you need assistance or wish to discuss this further, please contact us at website.

    Thank you for your understanding, and we look forward to supporting your initiatives in the future.

    Warm regards,  
    ${admin.name}  
    superAdmin  
    EventSphere
    `;
    }
    else if(reason=='personalized Decline'){
        cancelSubject=`Decision on Your Event Proposal for "${event.eventname}"`;
        cancelMessage=`Dear ${orga.userame},
                       Thank you for your effort and creativity in planning "${event.eventname}". We have reviewed your proposal thoroughly, but unfortunately, we are unable to approve the event due to ${reason}.
                        We sincerely appreciate the thought and effort you’ve put into this proposal and hope to work with you on other opportunities in the future. If there are ways we can assist with rescheduling or adapting the event for a later date, please let us know.
                        Thank you for your dedication and understanding.
                        Best regards,  
                    ${admin.name}  
                    superAdmin 
                    EventSphere
                    `;
    }
    else
    {
        cancelSubject = `Update on Your Event Request for "${orga.eventname}"`;
        cancelMessage = `Dear ${orga.username},

        Thank you for submitting your event request for "${orga.eventname}" on ${orga.startDate}. After careful review, we regret to inform you that we are unable to approve your event at this time due to ${reason}.
        
        We greatly value your efforts and encourage you to submit a new request if adjustments can be made to align with our requirements. Feel free to reach out to us at website if you have any questions or need assistance.
        
        Thank you for your understanding.
        
        Best regards,  
        ${admin.name},  
        superAdmin,
        EventSphere
        `;
    }
    const notify = new organizernotificationModel({
        to:organizerId,
        from:'admin',
        fromType: 'Admin',
        subject:cancelSubject,
        message:cancelMessage,
    })
    notify.save();
    return res.status(200).json({success:"Your event is cancled"});
}

export const approveAdmin = async(req, res) => {
    const SuperAdminId = req.user._id;
    if(!SuperAdminId){
        return res.status(401).json({unauthorized:`Unauthorized access to the admin page`})
    }
    const SuperAdmin = await adminModel.findById(adminId);
    const isSuperAdmin =await whiteListSchema.findOne({email:SuperAdmin.email});
    if(!isSuperAdmin){
        return res.status(401).json({unauthorized:`Admin has no access to approve another admin`})
    }
    try{
        const {adminId} = req.params;
        const admin = await adminModel.findById(userId).select('-password');
        if(!admin){
            return res.status(404).json({notFound:'User not found'});
        }
        admin.status = 'approved',
        admin.approvedBy=SuperAdminId;
        admin.save();
        const subject = "Approval Notification: Admin Access Granted";
        const message = `
                        Dear ${admin.name},

                        We are pleased to inform you that your request for admin access has been approved by the Super Admin of EventSphere Pvt. Ltd. You now have full access to the admin panel and its functionalities.

                        Please ensure that you utilize your admin privileges responsibly and in accordance with the company’s policies.

                        If you have any questions or need assistance, feel free to reach out to our support team.

                        Welcome aboard as an Admin!

                        Best regards,  
                        ${SuperAdmin.name}  
                        Super Admin  
                        EventSphere Pvt. Ltd.
                        `;
        const notifyAdmin = new adminNotificationModel({
            from:SuperAdminId,
            to:adminId,
            fromType:'Admoin',
            subject,
            message
        })
        await notifyAdmin.save();
        return res.status(200).json({success:"approved as an admin"});
    }
    catch(err){
        console.log(`Error has occured at superAdminController function`);
        return res.status(500).json({err:`Internal error has occured - ${err}`});
    }
}

export const rejectAdmin = async(req, res) => {
    const SuperAdminId = req.user._id;
    if(!SuperAdminId){
        return res.status(401).json({unauthorized:`Unauthorized access to the admin page`})
    }
    const SuperAdmin = await adminModel.findById(adminId);
    const isSuperAdmin =await whiteListSchema.findOne({email:SuperAdmin.email});
    if(!isSuperAdmin){
        return res.status(401).json({unauthorized:`Admin has no access to approve another admin`})
    }
    try{
        const {adminId} = req.params;
        const admin = await adminModel.findById(userId).select('-password');
        if(!admin){
            return res.status(404).json({notFound:'User not found'});
        }
        admin.status = 'approved',
        admin.approvedBy=SuperAdminId;
        admin.save();
        const subject = "Notification: Admin Access Request Rejected";
        const message = `
                        Dear ${admin.name},
                        We regret to inform you that your request for admin access has been reviewed and rejected by the Super Admin of EventSphere Pvt. Ltd.
                        This decision was made after careful consideration of the current requirements and policies. We encourage you to reach out if you have any questions or need clarification regarding this decision.
                        Thank you for your understanding, and we appreciate your continued contributions to EventSphere Pvt. Ltd.
                        Best regards,  
                        ${SuperAdmin.name} 
                        Super Admin  
                        EventSphere Pvt. Ltd.
                        `;
        const notifyAdmin = new adminNotification({
            to:adminId,
            from:SuperAdminId,
            fromType:'Admin',
            subject,
            message
        })
        await notifyAdmin.save();
        return res.status(200).json({success:"rejected as an admin"});
    }
    catch(err){
        console.log(`Error has occured at superAdminController function`);
        return res.status(500).json({err:`Internal error has occured`});
    }
}