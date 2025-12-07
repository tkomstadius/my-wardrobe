import { useState } from "react";
import { compressImage } from "../utils/imageCompression";

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

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const originalDataURL = reader.result as string;
          const compressedDataURL = await compressImage(originalDataURL);
          setImagePreview(compressedDataURL);
        } catch (error) {
          console.error("Failed to process image:", error);
          const errorMessage = "Failed to process image. Please try another file.";
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
  };

  return {
    imagePreview,
    setImagePreview,
    handleImageUpload,
    clearImage,
    isUploading,
  };
}

