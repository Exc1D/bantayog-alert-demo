import imageCompression from 'browser-image-compression';
import { IMAGE_COMPRESSION_OPTIONS } from './constants';
import { captureException } from './sentry';

export async function compressImage(file) {
  try {
    const compressed = await imageCompression(file, IMAGE_COMPRESSION_OPTIONS);
    return compressed;
  } catch (error) {
    captureException(error, { tags: { component: 'imageCompression' } });
    return file;
  }
}

export async function compressMultipleImages(files) {
  const compressed = await Promise.all(Array.from(files).map((file) => compressImage(file)));
  return compressed;
}

export async function createThumbnail(file) {
  try {
    return await imageCompression(file, {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 300,
      useWebWorker: true,
    });
  } catch (error) {
    captureException(error, { tags: { component: 'createThumbnail' } });
    return file;
  }
}

export function validateImage(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  const maxSize = 10 * 1024 * 1024; // 10MB before compression

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid image type. Use JPEG, PNG, or WebP.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image too large. Maximum 10MB.' };
  }

  return { valid: true, error: null };
}

/**
 * Validates image file by checking magic bytes against declared MIME type.
 * Rejects polyglot files where file extension or MIME type doesn't match actual content.
 *
 * @param {File} file - The image file to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateMagicBytes(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ valid: false, error: 'No file provided' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      const bytes = new Uint8Array(buffer);

      // Magic byte signatures for supported image types
      const signatures = {
        'image/jpeg': {
          expected: [0xff, 0xd8, 0xff],
          offset: 0,
          mask: [0xff, 0xff, 0xff],
        },
        'image/png': {
          expected: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
          offset: 0,
          mask: [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
        },
        'image/gif': {
          expected: [0x47, 0x49, 0x46, 0x38], // "GIF8"
          offset: 0,
          mask: [0xff, 0xff, 0xff, 0xff],
        },
        'image/webp': {
          // RIFF header at offset 0, "WEBP" at offset 8
          expected: [0x52, 0x49, 0x46, 0x46], // "RIFF"
          offset: 0,
          mask: [0xff, 0xff, 0xff, 0xff],
          secondExpected: [0x57, 0x45, 0x42, 0x50], // "WEBP"
          secondOffset: 8,
          secondMask: [0xff, 0xff, 0xff, 0xff],
        },
      };

      const sig = signatures[file.type];
      if (!sig) {
        resolve({ valid: false, error: `Unsupported MIME type: ${file.type}` });
        return;
      }

      // Check first signature
      let match = true;
      for (let i = 0; i < sig.expected.length; i++) {
        const actual = bytes[sig.offset + i];
        const expected = sig.expected[i];
        const mask = sig.mask[i];
        if ((actual & mask) !== (expected & mask)) {
          match = false;
          break;
        }
      }

      // For WebP, also check second signature at offset 8
      if (match && sig.secondExpected) {
        for (let i = 0; i < sig.secondExpected.length; i++) {
          const actual = bytes[sig.secondOffset + i];
          const expected = sig.secondExpected[i];
          const mask = sig.secondMask[i];
          if ((actual & mask) !== (expected & mask)) {
            match = false;
            break;
          }
        }
      }

      if (match) {
        resolve({ valid: true, error: null });
      } else {
        resolve({
          valid: false,
          error: `Magic bytes do not match declared type ${file.type}. File may be corrupted or misnamed.`,
        });
      }
    };
    reader.onerror = () => {
      resolve({ valid: false, error: 'Failed to read file for validation' });
    };

    // Read first 12 bytes (enough for all signatures including WebP's second check)
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

/**
 * Re-encodes an image via canvas to strip all embedded metadata, scripts, and polyglot payloads.
 * Uses createImageBitmap (not Image element) to avoid XSS vectors during decode.
 *
 * @param {File} file - The original image file
 * @param {{ type?: string, quality?: number }} [options]
 * @param {string} [options.type='image/jpeg'] - Output MIME type
 * @param {number} [options.quality=0.85] - Quality for JPEG/WebP (0-1)
 * @returns {Promise<Blob>} Re-encoded image blob
 */
export async function reencodeImageClean(file, options = {}) {
  const { type = 'image/jpeg', quality = 0.85 } = options;

  // Use createImageBitmap to decode the image (avoids Image element XSS vectors)
  const bitmap = await createImageBitmap(file);

  // Create canvas matching image dimensions
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw image onto canvas (strips all metadata, EXIF, ICC profiles, etc.)
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  // Export as clean blob - this is the critical step that strips embedded scripts
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      type,
      quality
    );
  });
}

export function validateMedia(file) {
  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

  const isImage = validImageTypes.includes(file.type);
  const isVideo = validVideoTypes.includes(file.type);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'Unsupported file type. Use JPEG, PNG, WebP, MP4, MOV, or WebM.',
    };
  }

  if (isImage && file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'Image too large. Maximum 10MB.' };
  }

  if (isVideo && file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'Video too large. Maximum 50MB.' };
  }

  return { valid: true, error: null };
}
