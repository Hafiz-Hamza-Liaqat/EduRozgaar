import { Router } from 'express';
import * as formPublic from '../controllers/formPublicController.js';
import { formSubmissionLimiter, uploadLimiter } from '../middleware/rateLimit.js';
import { uploadFormFileMw, uploadFormSubmitFilesMw } from '../middleware/formUpload.js';

export const formsRouter = Router();

formsRouter.get('/forms/id/:id', formPublic.getPublicFormById);
formsRouter.get('/forms/:slug', formPublic.getPublicForm);

formsRouter.post('/forms/:slug/submit', formSubmissionLimiter, (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    return uploadFormSubmitFilesMw(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
      next();
    });
  }
  next();
}, formPublic.submitForm);

formsRouter.post('/forms/:slug/upload', formSubmissionLimiter, uploadLimiter, (req, res, next) => {
  uploadFormFileMw(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
    next();
  });
}, formPublic.uploadFormFieldFile);
