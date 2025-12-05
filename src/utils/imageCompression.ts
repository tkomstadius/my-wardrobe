// Image compression utilities
// Reduces image size before saving to IndexedDB

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, where 1 is highest quality
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.85,
};

/**
 * Compress an image data URL
 * @param dataURL - Base64 data URL of the image
 * @param options - Compression options
 * @returns Compressed data URL
 */
export async function compressImage(
  dataURL: string,
  options: CompressionOptions = {},
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > opts.maxWidth || height > opts.maxHeight) {
          if (width > height) {
            width = opts.maxWidth;
            height = width / aspectRatio;
          } else {
            height = opts.maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use better image smoothing for quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG
        const compressedDataURL = canvas.toDataURL('image/jpeg', opts.quality);
        resolve(compressedDataURL);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataURL;
  });
}

/**
 * Get the size of a data URL in bytes
 * @param dataURL - Base64 data URL
 * @returns Size in bytes
 */
export function getDataURLSize(dataURL: string): number {
  // Remove data URL prefix to get pure base64
  const base64 = dataURL.split(',')[1];
  if (!base64) return 0;

  // Calculate size: base64 is ~4/3 of original binary size
  // Account for padding characters
  const padding = (base64.match(/=/g) || []).length;
  return (base64.length * 3) / 4 - padding;
}

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get compression stats for logging/debugging
 * @param originalDataURL - Original image data URL
 * @param compressedDataURL - Compressed image data URL
 * @returns Compression statistics
 */
export function getCompressionStats(originalDataURL: string, compressedDataURL: string) {
  const originalSize = getDataURLSize(originalDataURL);
  const compressedSize = getDataURLSize(compressedDataURL);
  const savedBytes = originalSize - compressedSize;
  const compressionRatio = ((savedBytes / originalSize) * 100).toFixed(1);

  return {
    originalSize,
    compressedSize,
    savedBytes,
    compressionRatio: `${compressionRatio}%`,
    originalFormatted: formatBytes(originalSize),
    compressedFormatted: formatBytes(compressedSize),
    savedFormatted: formatBytes(savedBytes),
  };
}
