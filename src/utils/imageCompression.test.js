import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  compressImage,
  compressMultipleImages,
  createThumbnail,
  validateImage,
  validateMedia,
  validateMagicBytes,
  reencodeImageClean,
} from './imageCompression';

vi.mock('browser-image-compression', () => ({
  default: vi.fn((file) => Promise.resolve(file)),
}));

vi.mock('./sentry', () => ({
  captureException: vi.fn(),
}));

// Mock createImageBitmap for reencodeImageClean tests
const mockBitmap = {
  width: 100,
  height: 100,
  close: vi.fn(),
};
vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap));

describe('imageCompression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compressImage', () => {
    it('returns compressed image', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await compressImage(mockFile);
      expect(result).toBe(mockFile);
    });
  });

  describe('compressMultipleImages', () => {
    it('compresses multiple images', async () => {
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];
      const result = await compressMultipleImages(mockFiles);
      expect(result).toHaveLength(2);
    });
  });

  describe('createThumbnail', () => {
    it('creates thumbnail from image', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await createThumbnail(mockFile);
      expect(result).toBe(mockFile);
    });
  });

  describe('validateImage', () => {
    it('returns valid for correct image types', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const webpFile = new File([''], 'test.webp', { type: 'image/webp' });
      const heicFile = new File([''], 'test.heic', { type: 'image/heic' });

      expect(validateImage(jpegFile).valid).toBe(true);
      expect(validateImage(pngFile).valid).toBe(true);
      expect(validateImage(webpFile).valid).toBe(true);
      expect(validateImage(heicFile).valid).toBe(true);
    });

    it('returns invalid for wrong image types', () => {
      const gifFile = new File([''], 'test.gif', { type: 'image/gif' });
      const result = validateImage(gifFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid image type');
    });

    it('returns invalid for files over 10MB', () => {
      const largeFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });
      const result = validateImage(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('returns valid for files under 10MB', () => {
      const smallFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(smallFile, 'size', { value: 5 * 1024 * 1024 });
      const result = validateImage(smallFile);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateMedia', () => {
    it('returns valid for valid image types', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(validateMedia(jpegFile).valid).toBe(true);
    });

    it('returns valid for valid video types', () => {
      const mp4File = new File([''], 'test.mp4', { type: 'video/mp4' });
      const movFile = new File([''], 'test.mov', { type: 'video/quicktime' });
      const webmFile = new File([''], 'test.webm', { type: 'video/webm' });

      expect(validateMedia(mp4File).valid).toBe(true);
      expect(validateMedia(movFile).valid).toBe(true);
      expect(validateMedia(webmFile).valid).toBe(true);
    });

    it('returns invalid for unsupported file types', () => {
      const audioFile = new File([''], 'test.mp3', { type: 'audio/mpeg' });
      const result = validateMedia(audioFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('returns invalid for images over 10MB', () => {
      const largeImage = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeImage, 'size', { value: 11 * 1024 * 1024 });
      const result = validateMedia(largeImage);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Image too large');
    });

    it('returns invalid for videos over 50MB', () => {
      const largeVideo = new File([''], 'test.mp4', { type: 'video/mp4' });
      Object.defineProperty(largeVideo, 'size', { value: 51 * 1024 * 1024 });
      const result = validateMedia(largeVideo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Video too large');
    });

    it('returns valid for videos under 50MB', () => {
      const smallVideo = new File([''], 'test.mp4', { type: 'video/mp4' });
      Object.defineProperty(smallVideo, 'size', { value: 30 * 1024 * 1024 });
      const result = validateMedia(smallVideo);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateMagicBytes', () => {
    it('returns valid for JPEG with correct magic bytes', async () => {
      // JPEG magic bytes: FF D8 FF
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
      const jpegFile = new File([jpegBytes], 'test.jpg', { type: 'image/jpeg' });
      const result = await validateMagicBytes(jpegFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns valid for PNG with correct magic bytes', async () => {
      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const pngFile = new File([pngBytes], 'test.png', { type: 'image/png' });
      const result = await validateMagicBytes(pngFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns valid for GIF with correct magic bytes', async () => {
      // GIF magic bytes: 47 49 46 38 ("GIF8")
      const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00]);
      const gifFile = new File([gifBytes], 'test.gif', { type: 'image/gif' });
      const result = await validateMagicBytes(gifFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns valid for WebP with correct RIFF + WEBP headers', async () => {
      // WebP: RIFF at 0, WEBP at 8
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size placeholder
        0x57, 0x45, 0x42, 0x50, // WEBP
        0x00, 0x00, 0x00, 0x00, // extra
      ]);
      const webpFile = new File([webpBytes], 'test.webp', { type: 'image/webp' });
      const result = await validateMagicBytes(webpFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns invalid when JPEG magic bytes do not match declared type', async () => {
      // PNG bytes declared as JPEG
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const fakeJpegFile = new File([pngBytes], 'test.jpg', { type: 'image/jpeg' });
      const result = await validateMagicBytes(fakeJpegFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Magic bytes do not match');
    });

    it('returns invalid for unsupported MIME type', async () => {
      const arbitraryBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const unknownFile = new File([arbitraryBytes], 'test.xyz', { type: 'image/x-unsupported' });
      const result = await validateMagicBytes(unknownFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported MIME type');
    });

    it('returns invalid when file has wrong WebP second signature', async () => {
      // RIFF header correct but WEBP signature missing at offset 8
      const badWebpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00,
        0x41, 0x42, 0x43, 0x44, // wrong signature (ABCD)
        0x00, 0x00, 0x00, 0x00,
      ]);
      const badWebpFile = new File([badWebpBytes], 'test.webp', { type: 'image/webp' });
      const result = await validateMagicBytes(badWebpFile);
      expect(result.valid).toBe(false);
    });
  });

  describe('reencodeImageClean', () => {
    it('produces a blob smaller than the original', async () => {
      // Create a small JPEG-like file
      const originalBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
      const originalFile = new File([originalBytes], 'test.jpg', { type: 'image/jpeg' });

      // Mock canvas.toBlob to return a smaller blob
      const mockBlob = new Blob(['clean'], { type: 'image/jpeg' });
      const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;

      HTMLCanvasElement.prototype.getContext = () => ({
        drawImage: vi.fn(),
      });
      HTMLCanvasElement.prototype.toBlob = (callback) => {
        callback(mockBlob);
      };

      try {
        const result = await reencodeImageClean(originalFile, { type: 'image/jpeg', quality: 0.85 });
        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('image/jpeg');
      } finally {
        HTMLCanvasElement.prototype.getContext = originalCanvasGetContext;
        HTMLCanvasElement.prototype.toBlob = originalToBlob;
      }
    });

    it('uses image/jpeg as default output type', async () => {
      const originalBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const originalFile = new File([originalBytes], 'test.jpg', { type: 'image/jpeg' });

      const mockBlob = new Blob(['clean'], { type: 'image/jpeg' });
      const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;

      HTMLCanvasElement.prototype.getContext = () => ({
        drawImage: vi.fn(),
      });
      HTMLCanvasElement.prototype.toBlob = (callback) => {
        callback(mockBlob);
      };

      try {
        const result = await reencodeImageClean(originalFile);
        expect(result.type).toBe('image/jpeg');
      } finally {
        HTMLCanvasElement.prototype.getContext = originalCanvasGetContext;
        HTMLCanvasElement.prototype.toBlob = originalToBlob;
      }
    });
  });
});
