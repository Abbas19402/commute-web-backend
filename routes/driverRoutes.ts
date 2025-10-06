

import express from 'express';
import { signup } from '../controllers/DriverController.ts';
import { login } from '../controllers/DriverController.ts';
import { logout } from '../controllers/DriverController.ts';
import { getRide } from '../controllers/DriverController.ts';
const router = express.Router();

// Signup route
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/getride/:trackingId', getRide);
export default router;