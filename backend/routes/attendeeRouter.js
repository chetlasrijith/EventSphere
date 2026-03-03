import express from 'express';
import protectRoute from '../middleware/attendeeProtectRoute.js';
import { createTicket, eventList, eventRegistration, getEvent, getMe, getName, myEventList, search, updateAttendee, updateProfileImage,attendeeNotifications,attendeeNotification } from '../controller/attendeeController.js';
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();
router.post('/events/:eventId/register', protectRoute, eventRegistration);
router.post('/storeticket', protectRoute, createTicket);
router.get('/profile', protectRoute, getMe);
router.get('/getName', protectRoute, getName);
router.get('/event-list', protectRoute, eventList);
router.get('/myevent-list', protectRoute, myEventList);
router.get(`/getevent/:eventId`, protectRoute, getEvent);
router.put('/profileImageUpdate', protectRoute, upload.single('profileImg'), updateProfileImage);
router.put('/profileUpdate', protectRoute, updateAttendee);
router.get('/search', protectRoute, search);
router.get('/notifications',protectRoute,attendeeNotifications);
router.get('/notification/:notificationId', protectRoute,attendeeNotification);

export default router;
