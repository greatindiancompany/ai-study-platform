import express from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/auth.js';
import { requireUserOrServerSecret } from '../middleware/requireUserOrServerSecret.js';
import { studyUploadFileFilter } from '../utils/uploadFilter.js';
import {
  generateStudyGuide,
  getStudyGuides,
  getStudyGuideById,
  updateStudyGuide,
  shareStudyGuide,
  deleteStudyGuide,
  getSharedStudyGuide
} from '../controllers/studyGuideController.js';

const router = express.Router();

// Configure multer for multiple file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Max 5 files
  },
  fileFilter: studyUploadFileFilter
});

// Generate study guide. Auth or server secret runs before uploads are stored.
router.post('/generate', requireUserOrServerSecret, upload.array('files', 5), generateStudyGuide);

// Get all study guides for user (requires authentication)
router.get('/', authenticateUser, getStudyGuides);

// Get specific study guide by ID
router.get('/:id', authenticateUser, getStudyGuideById);

// Update study guide (requires authentication)
router.put('/:id', authenticateUser, updateStudyGuide);

// Share study guide (requires authentication)
router.post('/:id/share', authenticateUser, shareStudyGuide);

// Delete study guide (requires authentication)
router.delete('/:id', authenticateUser, deleteStudyGuide);

// Get shared study guide by token (public)
router.get('/shared/:token', getSharedStudyGuide);

export default router;
