'use strict';

import { Router } from 'express';
import { register, login, getProfile, updateProfile } from './auth.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

export default router;