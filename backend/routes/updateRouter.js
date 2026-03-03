import express from 'express';

import protectRoute from '../middleware/organizerProtectRoute';
import { simpleUpdate,criticalUpdate } from '../controller/updateEventController';


const router = express.Router();

router.put('/simple/:eventId',protectRoute,simpleUpdate);
router.put('/critical/:eventId',protectRoute,criticalUpdate);

export default router;