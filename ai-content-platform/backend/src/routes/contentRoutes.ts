import { Router } from 'express';
import { generateContent, getDocuments } from '../controllers/contentController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// All content routes are protected
router.use(authMiddleware);

// POST /api/content/generate
router.post('/generate', generateContent);

// GET /api/content
router.get('/', getDocuments);

export default router;
