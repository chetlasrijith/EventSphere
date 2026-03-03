import express from 'express';

import {organizerSignup,organizerLogin,organizerLogout} from '../controller/organizerAuthController.js';

const router = express.Router();


router.post('/signup',organizerSignup);
router.post('/login',organizerLogin);
router.get('/logout',organizerLogout);

export default router;