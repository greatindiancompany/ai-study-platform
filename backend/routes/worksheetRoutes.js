import express from 'express';
import multer from 'multer';
import { requireUserOrServerSecret } from '../middleware/requireUserOrServerSecret.js';
import { studyUploadFileFilter } from '../utils/uploadFilter.js';
import { generateWorksheet } from '../controllers/worksheetController.js';

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: studyUploadFileFilter,
});

router.post('/generate', requireUserOrServerSecret, upload.single('file'), generateWorksheet);

export default router;

