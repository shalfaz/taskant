import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

export type UploadPurpose = 'profile-photo' | 'task-attachment' | 'store-listing' | 'chat-attachment';
export interface CloudinaryAsset {
  url: string;
  publicId: string;
  format?: string;
  bytes?: number;
}

export function isOwnedCloudinaryAsset(
  value: unknown,
  ownerId: string,
  purpose: UploadPurpose
): value is CloudinaryAsset {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const asset = value as Record<string, unknown>;
  if (typeof asset.url !== 'string' || typeof asset.publicId !== 'string') return false;
  const prefix = `taskant/${purpose}/${ownerId}/`;
  if (!asset.publicId.startsWith(prefix) || asset.publicId.length <= prefix.length) return false;
  try {
    const url = new URL(asset.url);
    return url.protocol === 'https:' &&
      url.hostname === 'res.cloudinary.com' &&
      url.pathname.includes(asset.publicId);
  } catch {
    return false;
  }
}

const allowedMimeTypes: Record<UploadPurpose, string[]> = {
  'profile-photo': ['image/jpeg', 'image/png', 'image/webp'],
  'task-attachment': ['image/jpeg', 'image/png', 'image/webp'],
  'store-listing': ['image/jpeg', 'image/png', 'image/webp'],
  'chat-attachment': ['image/jpeg', 'image/png', 'image/webp'],
};

const maxFileSize = 4 * 1024 * 1024;
let configuredSignature = '';

export function getUploadValidationError(
  purpose: unknown,
  mimeType: unknown,
  file: Buffer
): string | undefined {
  if (
    purpose !== 'profile-photo' &&
    purpose !== 'task-attachment' &&
    purpose !== 'store-listing' &&
    purpose !== 'chat-attachment'
  ) {
    return 'Unsupported upload purpose.';
  }
  if (typeof mimeType !== 'string' || !allowedMimeTypes[purpose].includes(mimeType)) {
    return 'Unsupported file type for this upload purpose.';
  }
  if (!file.length) return 'The uploaded file is empty.';
  if (file.length > maxFileSize) return 'Files must be 4 MB or smaller.';

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

function getCloudinaryCredentials(): { cloudName: string; apiKey: string; apiSecret: string } {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary server credentials are not configured.');
  }
  return { cloudName, apiKey, apiSecret };
}

function configureCloudinary(): { cloudName: string; apiKey: string; apiSecret: string } {
  const credentials = getCloudinaryCredentials();
  const signature = `${credentials.cloudName}:${credentials.apiKey}:${credentials.apiSecret}`;
  if (configuredSignature !== signature) {
    cloudinary.config({
      cloud_name: credentials.cloudName,
      api_key: credentials.apiKey,
      api_secret: credentials.apiSecret,
      secure: true,
    });
    configuredSignature = signature;
  }
  return credentials;
}

export async function verifyCloudinaryConnection(): Promise<void> {
  configureCloudinary();
  const result = await cloudinary.api.ping();
  if (result.status !== 'ok') throw new Error('Cloudinary ping returned an unexpected status.');
}

export async function uploadAsset(
  file: Buffer,
  purpose: UploadPurpose,
  ownerId: string
): Promise<UploadApiResponse> {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `taskant/${purpose}/${ownerId}`,
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
