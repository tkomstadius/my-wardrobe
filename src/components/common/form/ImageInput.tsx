import { CameraIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { useImageUpload } from "../../../hooks/useImageUpload";
import styles from "./ImageInput.module.css";
import { useEffect } from "react";
import { IMAGE_URL_NAME, ORIGINAL_IMAGE_URL_NAME } from "./constants";
import { Spinner } from "@radix-ui/themes";

type ImageInputProps = {
  originalImageUrl?: string;
};

export function ImageInput({ originalImageUrl }: ImageInputProps) {
  const { imagePreview, setImagePreview, handleImageUpload, isUploading } =
    useImageUpload();

  useEffect(() => {
    if (originalImageUrl) {
      setImagePreview(originalImageUrl);
    }
  }, [originalImageUrl, setImagePreview]);

  return (
    <div className={styles.container}>
      {isUploading && <Spinner size="3" className={styles.spinner} />}
      {imagePreview ? (
        <img
          src={imagePreview}
          alt="Image preview"
          className={styles.preview}
        />
      ) : (
        <div className={styles.placeholder}>
          {!isUploading && <p>No image selected</p>}
        </div>
      )}

      <label htmlFor="image-upload" className={styles.button}>
        {imagePreview ? (
          <Pencil1Icon width={24} height={24} />
        ) : (
          <CameraIcon width={24} height={24} />
        )}
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className={styles.fileInput}
      />

      <input type="hidden" name={IMAGE_URL_NAME} value={imagePreview || ""} />
      <input
        type="hidden"
        name={ORIGINAL_IMAGE_URL_NAME}
        value={originalImageUrl}
      />
    </div>
  );
}
