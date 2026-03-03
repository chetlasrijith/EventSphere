import express from 'express';

import {listApprovePedingEvents,listApprovedEvents,listCancledEvents,listCompletedEvents,listOrganizers,deleteOrganizer, writeMessageToOrganizer,addArtist,getName,getMe, getEvent,getOrganizer,getNotifications,getNotification,MessageOrganizer,updateToAttendee} from '../controller/adminController.js'
import { approveEvent,cancelEvent,approveAdmin,rejectAdmin}  from '../controller/superAdminController.js';

import adminProtectRoute from '../middleware/adminProtectRoute.js';
import superadminProtectRoute from '../middleware/superAdminProtectRoute.js';

const router = express.Router();

router.post('/:organizerId/message',adminProtectRoute,writeMessageToOrganizer);
router.post('/add-artist',adminProtectRoute,addArtist);
router.get('/approve-pending-events',adminProtectRoute,listApprovePedingEvents);
router.get('/approved-events',adminProtectRoute,listApprovedEvents);
router.get('/canceled-events',adminProtectRoute,listCancledEvents);
router.get('/completed-events',adminProtectRoute,listCompletedEvents);
router.get('/list-organizers',adminProtectRoute,listOrganizers);
router.get('/getEvent/:eventId',adminProtectRoute,getEvent)
router.get('/getOrganizer/:organizerId',adminProtectRoute,getOrganizer);
router.get('/getName',adminProtectRoute,getName);
router.get('/getMe',adminProtectRoute,getMe);
router.get('/notifications',adminProtectRoute,getNotifications);
router.get('/notification/:notificationId',adminProtectRoute,getNotification);
router.post('/message-organizer',adminProtectRoute,MessageOrganizer)
router.post('/update-to-attendee',adminProtectRoute,updateToAttendee);
router.delete('/deleteOrganizer',adminProtectRoute,deleteOrganizer);
router.post('/:eventId/ApproveEvent',adminProtectRoute,approveEvent);
router.post('/:eventId/CancelEvent',adminProtectRoute, cancelEvent);
router.put('/:adminId/approveAdmin',superadminProtectRoute,approveAdmin);
router.put('/:adminId/rejectAdmin', superadminProtectRoute,rejectAdmin);
export default router;
