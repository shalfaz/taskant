import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

export type UploadPurpose = 'profile-photo' | 'task-attachment';

const allowedMimeTypes: Record<UploadPurpose, string[]> = {
  'profile-photo': ['image/jpeg', 'image/png', 'image/webp'],
  'task-attachment': ['image/jpeg', 'image/png', 'image/webp'],
};

const maxFileSize = 5 * 1024 * 1024;
let configured = false;

export function getUploadValidationError(
  purpose: unknown,
  mimeType: unknown,
  file: Buffer
): string | undefined {
  if (purpose !== 'profile-photo' && purpose !== 'task-attachment') {
    return 'Unsupported upload purpose.';
  }
  if (typeof mimeType !== 'string' || !allowedMimeTypes[purpose].includes(mimeType)) {
    return 'Unsupported file type for this upload purpose.';
  }
  if (!file.length) return 'The uploaded file is empty.';
  if (file.length > maxFileSize) return 'Files must be 5 MB or smaller.';

  const isJpeg = file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff;
  const isPng = file.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp =
    file.toString('ascii', 0, 4) === 'RIFF' &&
    file.toString('ascii', 8, 12) === 'WEBP';
  const matchesMimeType =
    (mimeType === 'image/jpeg' && isJpeg) ||
    (mimeType === 'image/png' && isPng) ||
    (mimeType === 'image/webp' && isWebp);

  return matchesMimeType ? undefined : 'File contents do not match the declared file type.';
}

function configureCloudinary(): void {
  if (configured) return;
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary server credentials are not configured.');
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  configured = true;
}

export async function uploadAsset(
  file: Buffer,
  purpose: UploadPurpose
): Promise<UploadApiResponse> {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `taskant/${purpose}`,
        resource_type: 'image',
        type: 'upload',
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(new Error('Cloudinary upload failed.'));
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary returned no upload result.'));
          return;
        }
        resolve(result);
      }
    );
    stream.end(file);
  });
}
