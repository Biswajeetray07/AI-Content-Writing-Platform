import { Router } from 'express';
import { register, login, me } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// POST /auth/register
router.post('/register', register);

// POST /auth/login
router.post('/login', login);

// GET /auth/me (protected)
router.get('/me', authMiddleware, me);

export default router;
