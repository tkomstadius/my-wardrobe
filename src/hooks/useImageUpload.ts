import { useState } from "react";
import { compressImage } from "../utils/imageCompression";
import { removeImageBackground } from "../utils/backgroundRemoval";
import { getImageEmbedding } from "../utils/aiEmbedding";
import { ENABLE_BACKGROUND_REMOVAL } from "../utils/config";
import {
  setPendingEmbedding,
  clearPendingEmbedding,
} from "../utils/pendingEmbedding";

interface UseImageUploadOptions {
  onError?: (error: string) => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { onError } = options;
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    clearPendingEmbedding();

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const originalDataURL = reader.result as string;

          // Step 1: Remove background first on original high-quality image
          let backgroundRemovedDataURL = originalDataURL;
          if (ENABLE_BACKGROUND_REMOVAL) {
            try {
              backgroundRemovedDataURL =
                await removeImageBackground(originalDataURL);
            } catch (bgError) {
              console.warn(
                "Background removal failed, using original image:",
                bgError
              );
              // Fall back to original image without background removal
            }
          }

          // Step 2: Calculate embedding on background-removed high-quality image
          try {
            const newEmbedding = await getImageEmbedding(
              backgroundRemovedDataURL
            );
            setPendingEmbedding(newEmbedding);
          } catch (embeddingError) {
            console.warn("Embedding calculation failed:", embeddingError);
            // Continue without embedding - user can generate later in Settings
          }

          // Step 3: Compress the background-removed image for storage
          const compressedDataURL = await compressImage(
            backgroundRemovedDataURL
          );

          setImagePreview(compressedDataURL);
        } catch (error) {
          console.error("Failed to process image:", error);
          const errorMessage =
            "Failed to process image. Please try another file.";
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
        const errorMessage = "Failed to read image file.";
        if (onError) {
          onError(errorMessage);
        } else {
          alert(errorMessage);
        }
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to read file:", error);
      const errorMessage = "Failed to read image file.";
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setImagePreview("");
    clearPendingEmbedding();
  };

  return {
    imagePreview,
    setImagePreview,
    handleImageUpload,
    clearImage,
    isUploading,
  };
}

