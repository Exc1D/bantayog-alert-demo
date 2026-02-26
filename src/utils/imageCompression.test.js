import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  compressImage,
  compressMultipleImages,
  createThumbnail,
  validateImage,
  validateMedia,
} from './imageCompression';

vi.mock('browser-image-compression', () => ({
  default: vi.fn((file) => Promise.resolve(file)),
}));

vi.mock('./sentry', () => ({
  captureException: vi.fn(),
}));

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
});
