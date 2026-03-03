import express from "express";

import { attendeeLogin,attendeeSignup,attendeeLogout } from "../controller/attendeeAuthController";
const router=express.Router();
router.post('/signup',attendeeSignup);
router.post('/login',attendeeLogin);
router.get('/logout',attendeeLogout);

export default router;