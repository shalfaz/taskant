import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { asyncHandler, validate } from '../middleware/validate';
import { getUploadValidationError, uploadAsset, type UploadPurpose } from '../services/cloudinary';
import type { AuthRequest } from '../types/index';

const router = Router();
const maxEncodedSize = Math.ceil((5 * 1024 * 1024 * 4) / 3) + 256;

router.post(
  '/',
  authenticate,
  [
    body('purpose').isIn(['profile-photo', 'task-attachment']),
    body('mimeType').isString(),
    body('data').isString().notEmpty(),
  ],
  validate,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = req.body.data as string;
    const mimeType = req.body.mimeType as string;
    const purpose = req.body.purpose as UploadPurpose;

    if (data.length > maxEncodedSize) {
      res.status(413).json({ message: 'Files must be 5 MB or smaller.' });
      return;
    }

    const dataUri = /^data:([^;,]+);base64,([A-Za-z\d+/]+={0,2})$/.exec(data);
    const encoded = dataUri ? dataUri[2] : data;
    if (!/^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{2}==|[A-Za-z\d+/]{3}=)?$/.test(encoded)) {
      res.status(400).json({ message: 'File data must be valid base64.' });
      return;
    }
    if (dataUri && dataUri[1] !== mimeType) {
      res.status(400).json({ message: 'File content type does not match the declared type.' });
      return;
    }

    const file = Buffer.from(encoded, 'base64');
    const validationError = getUploadValidationError(purpose, mimeType, file);
    if (validationError) {
      res.status(file.length > 5 * 1024 * 1024 ? 413 : 400).json({ message: validationError });
      return;
    }

    try {
      const asset = await uploadAsset(file, purpose);
      res.status(201).json({
        asset: {
          url: asset.secure_url,
          publicId: asset.public_id,
          format: asset.format,
          bytes: asset.bytes,
        },
      });
    } catch {
      res.status(503).json({ message: 'File upload service is unavailable.' });
    }
  })
);

export default router;
