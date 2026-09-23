import express from 'express';
import {
  generateNotes,
  getNotesHistory,
  getNote,
  updateNote,
  deleteNote
} from '../controllers/cornellNotesController.js';
import { authenticateUser } from '../middleware/auth.js';
import { requireUserOrServerSecret } from '../middleware/requireUserOrServerSecret.js';

const router = express.Router();

// Generate Cornell notes (user or server secret; guests cannot spend provider quota)
router.post('/generate', requireUserOrServerSecret, generateNotes);

// Authenticated routes - notes management
router.get('/history', authenticateUser, getNotesHistory);
router.get('/:id', authenticateUser, getNote);
router.put('/:id', authenticateUser, updateNote);
router.delete('/:id', authenticateUser, deleteNote);

export default router;
