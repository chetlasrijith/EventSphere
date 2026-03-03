import express from 'express';

import {adminSignup,adminLogin,adminLogout} from '../controller/adminAuthController.js';

const router = express.Router();

router.post('/signup',adminSignup);
router.post('/login',adminLogin);
router.get('/logout',adminLogout);
export default router;