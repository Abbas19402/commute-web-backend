

import express from 'express';
import { signup } from '../controllers/userController.ts';
import { login } from '../controllers/userController.ts';
import { logout } from '../controllers/userController.ts';
import { assign } from '../controllers/userController.ts';
import { getAllRides } from '../controllers/userController.ts';
const router = express.Router();

// Signup route
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/assign', assign);
router.get('/rides/:adminId', getAllRides);
export default router;