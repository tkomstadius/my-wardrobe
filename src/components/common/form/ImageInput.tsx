import { useEffect, useId } from 'react';
import { IoCameraOutline, IoPencilOutline } from 'react-icons/io5';
import { useImageUpload } from '../../../hooks/useImageUpload';
import { Spinner } from '../ui/Spinner';
import { IMAGE_URL_NAME, ORIGINAL_IMAGE_URL_NAME } from './constants';
import styles from './ImageInput.module.css';

type ImageInputProps = {
  originalImageUrl?: string;
};

export function ImageInput({ originalImageUrl }: ImageInputProps) {
  const { imagePreview, setImagePreview, handleImageUpload, isUploading } = useImageUpload();
  const inputId = useId();

  useEffect(() => {
    if (originalImageUrl) {
      setImagePreview(originalImageUrl);
    }
  }, [originalImageUrl, setImagePreview]);

  return (
    <label
      htmlFor={inputId}
      className={`${styles.container} ${!imagePreview ? styles.clickable : ''}`}
    >
      {isUploading && <Spinner size="3" className={styles.spinner} />}
      {imagePreview ? (
        <>
          <img src={imagePreview} alt="Upload preview" className={styles.preview} />
          <div className={styles.editButton}>
            <IoPencilOutline size={20} />
            <span className={styles.changeLabel}>Change photo</span>
          </div>
        </>
      ) : (
        <div className={styles.placeholder}>
          {!isUploading && (
            <div className={styles.placeholderContent}>
              <IoCameraOutline size={48} className={styles.placeholderIcon} />
              <span className={styles.placeholderText}>Add photo</span>
              <span className={styles.placeholderSubtext}>Tap to take or choose</span>
            </div>
          )}
        </div>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className={styles.fileInput}
      />

      <input type="hidden" name={IMAGE_URL_NAME} value={imagePreview || ''} />
      <input type="hidden" name={ORIGINAL_IMAGE_URL_NAME} value={originalImageUrl} />
    </label>
  );
}
