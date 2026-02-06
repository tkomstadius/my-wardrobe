import { useState } from 'react';
import { removeImageBackground } from '../utils/backgroundRemoval';
import { ENABLE_BACKGROUND_REMOVAL } from '../utils/config';
import { compressImage } from '../utils/imageCompression';

interface UseImageUploadOptions {
  onError?: (error: string) => void;
  skipBackgroundRemoval?: boolean;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { onError, skipBackgroundRemoval = false } = options;
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const originalDataURL = reader.result as string;
          // Step 1: Compress the image first
          const compressedDataURL = await compressImage(originalDataURL);

          let processedDataURL = compressedDataURL;

          // Step 2: Remove background after compression (optional)
          if (ENABLE_BACKGROUND_REMOVAL && !skipBackgroundRemoval) {
            try {
              processedDataURL = await removeImageBackground(compressedDataURL);
            } catch (bgError) {
              console.warn('Background removal failed, using compressed image:', bgError);
              // Fall back to compressed image without background removal
            }
          }

          setImagePreview(processedDataURL);
        } catch (error) {
          console.error('Failed to process image:', error);
          const errorMessage = 'Failed to process image. Please try another file.';
          if (onError) {
            onError(errorMessage);
          } else {
            alert(errorMessage);
          }
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        const errorMessage = 'Failed to read image file.';
        if (onError) {
          onError(errorMessage);
        } else {
          alert(errorMessage);
        }
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to read file:', error);
      const errorMessage = 'Failed to read image file.';
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setImagePreview('');
  };

  return {
    imagePreview,
    setImagePreview,
    handleImageUpload,
    clearImage,
    isUploading,
  };
}
