import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Button, Callout, Select, TextField } from "@radix-ui/themes";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useWardrobe } from "../contexts/WardrobeContext";
import type { ItemCategory } from "../types/wardrobe";
import {
  compressImage,
  formatBytes,
  getCompressionStats,
  getDataURLSize,
} from "../utils/imageCompression";
import styles from "./AddItemPage.module.css";

export function AddItemPage() {
  const navigate = useNavigate();
  const { addItem } = useWardrobe();
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [compressionInfo, setCompressionInfo] = useState<string>("");
  const [formData, setFormData] = useState({
    type: "",
    color: "",
    brand: "",
    category: "tops" as ItemCategory,
  });

  const handleImageCapture = async () => {
    try {
      // Use the Media Capture API to access the camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // For now, we'll just show a placeholder
      // Full implementation will come later with proper camera capture
      for (const track of stream.getTracks()) {
        track.stop();
      }
      console.log("Camera access granted - full implementation coming");
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalDataURL = reader.result as string;
        const originalSize = getDataURLSize(originalDataURL);

        // Show original size
        console.log("📸 Original image:", formatBytes(originalSize));

        // Compress the image
        try {
          const compressedDataURL = await compressImage(originalDataURL);
          const stats = getCompressionStats(originalDataURL, compressedDataURL);

          // Log compression results
          console.log("✅ Compressed image:", {
            original: stats.originalFormatted,
            compressed: stats.compressedFormatted,
            saved: stats.savedFormatted,
            ratio: stats.compressionRatio,
          });

          // Show compression info to user
          setCompressionInfo(
            `Compressed: ${stats.originalFormatted} → ${stats.compressedFormatted} (saved ${stats.compressionRatio})`
          );

          setImagePreview(compressedDataURL);
        } catch (err) {
          console.error("Compression failed, using original:", err);
          setImagePreview(originalDataURL);
          setCompressionInfo("");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    // Validate form
    if (!imagePreview) {
      setError("Please add an image of the item");
      return;
    }

    if (!formData.type.trim()) {
      setError("Please enter the item type");
      return;
    }

    if (!formData.color.trim()) {
      setError("Please enter the item color");
      return;
    }

    try {
      setIsSubmitting(true);

      // Save item to context (which persists to IndexedDB)
      await addItem({
        imageUrl: imagePreview,
        type: formData.type.trim(),
        color: formData.color.trim(),
        brand: formData.brand.trim() || undefined,
        category: formData.category,
      });

      // Navigate back to home
      navigate("/");
    } catch (err) {
      console.error("Failed to save item:", err);
      setError("Failed to save item. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeftIcon />
        </Button>
        <h2 className={styles.title}>Add Item</h2>
        <div style={{ width: "32px" }} /> {/* Spacer for center alignment */}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && (
          <Callout.Root color="red" size="1">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {compressionInfo && (
          <Callout.Root color="green" size="1">
            <Callout.Text>{compressionInfo}</Callout.Text>
          </Callout.Root>
        )}

        <div className={styles.imageSection}>
          {imagePreview ? (
            <div className={styles.imagePreview}>
              <img
                src={imagePreview}
                alt="Item preview"
                className={styles.previewImage}
              />
            </div>
          ) : (
            <div className={styles.imagePlaceholder}>
              <p>No image selected</p>
            </div>
          )}

          <div className={styles.imageButtons}>
            <Button type="button" variant="soft" onClick={handleImageCapture}>
              Take Photo
            </Button>
            <Button type="button" variant="soft" asChild>
              <label>
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={styles.fileInput}
                />
              </label>
            </Button>
          </div>
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <span className={styles.label}>Type</span>
            <TextField.Root
              placeholder="e.g., T-shirt, Jeans"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Color</span>
            <TextField.Root
              placeholder="e.g., Blue, Black"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Brand (Optional)</span>
            <TextField.Root
              placeholder="e.g., Nike, Zara"
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Category</span>
            <Select.Root
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value as ItemCategory })
              }
            >
              <Select.Trigger placeholder="Select category" />
              <Select.Content>
                <Select.Item value="tops">Tops</Select.Item>
                <Select.Item value="bottoms">Bottoms</Select.Item>
                <Select.Item value="outerwear">Outerwear</Select.Item>
                <Select.Item value="accessories">Accessories</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
        </div>

        <Button
          type="submit"
          size="3"
          className={styles.saveButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Item"}
        </Button>
      </form>
    </div>
  );
}
