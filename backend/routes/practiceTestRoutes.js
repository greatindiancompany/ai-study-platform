import express from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/auth.js';
import { requireUserOrServerSecret } from '../middleware/requireUserOrServerSecret.js';
import { studyUploadFileFilter } from '../utils/uploadFilter.js';
import {
  createQuestionBank,
  generateQuestions,
  createPracticeTest,
  submitTestAttempt,
  getPracticeTests,
  getPracticeTestById
} from '../controllers/practiceTestController.js';

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: studyUploadFileFilter
});

router.post('/banks', authenticateUser, createQuestionBank);
router.post('/generate', requireUserOrServerSecret, upload.single('file'), generateQuestions);
router.post('/tests', authenticateUser, createPracticeTest);
router.post('/tests/:id/submit', authenticateUser, submitTestAttempt);
router.get('/tests', authenticateUser, getPracticeTests);
router.get('/tests/:id', authenticateUser, getPracticeTestById);

export default router;
