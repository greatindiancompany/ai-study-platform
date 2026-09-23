import path from 'path';

const ALLOWED = new Map([
  ['.txt', new Set(['text/plain'])],
  ['.doc', new Set(['application/msword'])],
  ['.docx', new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document'])],
]);

export function isAllowedStudyUpload(file) {
  const ext = path.extname(file?.originalname || '').toLowerCase();
  const mimes = ALLOWED.get(ext);
  return !!mimes && mimes.has(file?.mimetype);
}

export function studyUploadFileFilter(req, file, cb) {
  if (isAllowedStudyUpload(file)) {
    cb(null, true);
    return;
  }
  const error = new Error('Only TXT, DOC, and DOCX files are allowed');
  error.status = 400;
  cb(error);
}
