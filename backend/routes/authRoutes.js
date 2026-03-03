import express  from 'express';

import organizerAuthRouter from './organizerAuthRouter.js'
import adminAuthRouter from './adminAuthRoutes.js'
import attendeeAuthRouter from './attendeeAuthRouter.js'

const router = express.Router();

router.use('/organizer',organizerAuthRouter);
router.use('/admin',adminAuthRouter);
router.use('/attendee',attendeeAuthRouter);

export default router;