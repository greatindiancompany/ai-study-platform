import express from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/auth.js';
import { requireUserOrServerSecret } from '../middleware/requireUserOrServerSecret.js';
import { studyUploadFileFilter } from '../utils/uploadFilter.js';
import {
  generateSummary,
  getSummaryHistory,
  getSummaryById,
  deleteSummary
} from '../controllers/summarizerController.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: studyUploadFileFilter
});

// Generate summary. Auth or server secret runs before the upload is stored.
router.post('/generate', requireUserOrServerSecret, upload.single('file'), generateSummary);

// Get summary history (requires authentication)
router.get('/history', authenticateUser, getSummaryHistory);

// Get specific summary by ID
router.get('/:id', authenticateUser, getSummaryById);

// Delete summary (requires authentication)
router.delete('/:id', authenticateUser, deleteSummary);

export default router;
