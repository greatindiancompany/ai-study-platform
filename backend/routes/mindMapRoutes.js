import express from 'express';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';
import { requireUserOrServerSecret } from '../middleware/requireUserOrServerSecret.js';
import { generateMindMap, getMindMaps, getMindMapById, updateMindMap, deleteMindMap } from '../controllers/mindMapController.js';

const router = express.Router();

router.post('/generate', requireUserOrServerSecret, generateMindMap);
router.get('/', authenticateUser, getMindMaps);
router.get('/:id', optionalAuth, getMindMapById);
router.put('/:id', authenticateUser, updateMindMap);
router.delete('/:id', authenticateUser, deleteMindMap);

export default router;
