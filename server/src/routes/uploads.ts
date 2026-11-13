import { Router } from 'express';
import type { RequestHandler } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { asyncHandler, logDevelopmentDiagnostic, validate } from '../middleware/validate';
import {
  getUploadValidationError,
  uploadAsset,
  verifyCloudinaryConnection,
  type UploadPurpose,
} from '../services/cloudinary';
import type { AuthRequest } from '../types/index';

const router = Router();
const maxFileSize = 4 * 1024 * 1024;
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize, files: 1, fields: 1, parts: 2 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
      return;
    }
    callback(null, true);
  },
});
const parseImageUpload: RequestHandler = (req, res, next) => {
  imageUpload.single('file')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Images must be 4 MB or smaller.'
        : 'Upload one JPG, PNG, or WebP image at a time.';
      res.status(status).json({ message });
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
};

router.get('/health', authenticate, asyncHandler(async (_req, res) => {
  try {
    await verifyCloudinaryConnection();
    res.json({ status: 'ok', provider: 'Cloudinary' });
  } catch (error) {
    logDevelopmentDiagnostic(
      typeof res.locals.requestId === 'string' ? res.locals.requestId : 'cloudinary-health',
      'cloudinary.health',
      error
    );
    res.status(503).json({ status: 'error', message: 'Cloudinary is not configured or is unavailable.' });
  }
}));

router.post(
  '/',
  authenticate,
  parseImageUpload,
  [
    body('purpose').isIn(['profile-photo', 'task-attachment', 'store-listing', 'chat-attachment']),
  ],
  validate,
  asyncHandler(async (req: AuthRequest, res) => {
    const file = req.file;
    const purpose = req.body.purpose as UploadPurpose;

    if (!file) {
      res.status(400).json({ message: 'Choose an image to upload.' });
      return;
    }
    const validationError = getUploadValidationError(purpose, file.mimetype, file.buffer);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    try {
      const asset = await uploadAsset(file.buffer, purpose, req.user!.id);
      res.status(201).json({
        asset: {
          url: asset.secure_url,
          publicId: asset.public_id,
          format: asset.format,
          bytes: asset.bytes,
        },
      });
    } catch (error) {
      logDevelopmentDiagnostic(
        typeof res.locals.requestId === 'string' ? res.locals.requestId : 'cloudinary-upload',
        'cloudinary.upload',
        error
      );
      res.status(503).json({ message: 'Image upload service is not configured or is temporarily unavailable.' });
    }
  })
);

export default router;
