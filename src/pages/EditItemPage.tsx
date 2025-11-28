import { ArrowLeftIcon, TrashIcon } from "@radix-ui/react-icons";
import { AlertDialog, Button, Select, Text, TextField } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useWardrobe } from "../contexts/WardrobeContext";
import type { ItemCategory } from "../types/wardrobe";
import {
  compressImage,
  formatBytes,
  getCompressionStats,
  getDataURLSize,
} from "../utils/imageCompression";
import styles from "./EditItemPage.module.css";

export function EditItemPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getItemById, updateItem, deleteItem } = useWardrobe();

  const [formData, setFormData] = useState({
    type: "",
    color: "",
    brand: "",
    category: "tops" as ItemCategory,
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [error, setError] = useState("");
  const [compressionInfo, setCompressionInfo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [itemNotFound, setItemNotFound] = useState(false);

  // Load item data
  useEffect(() => {
    if (!id) {
      setItemNotFound(true);
      return;
    }

    const item = getItemById(id);
    if (!item) {
      setItemNotFound(true);
      return;
    }

    // Pre-fill form with existing data
    setFormData({
      type: item.type,
      color: item.color,
      brand: item.brand || "",
      category: item.category,
    });
    setImagePreview(item.imageUrl);
  }, [id, getItemById]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalDataURL = reader.result as string;
        const originalSize = getDataURLSize(originalDataURL);

        console.log(`📸 Original image: ${formatBytes(originalSize)}`);

        try {
          // Compress the image
          const compressedDataURL = await compressImage(originalDataURL);
          const stats = getCompressionStats(originalDataURL, compressedDataURL);

          console.log("✅ Compressed image:", stats);

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

    setIsSaving(true);

    try {
      await updateItem(id!, {
        imageUrl: imagePreview,
        type: formData.type.trim(),
        color: formData.color.trim(),
        brand: formData.brand.trim() || undefined,
        category: formData.category,
      });

      // Navigate back to category page
      navigate(`/category/${formData.category}`);
    } catch (err) {
      console.error("Failed to update item:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteItem(id);
      navigate("/"); // Navigate to home after delete
    } catch (err) {
      console.error("Failed to delete item:", err);
      setError("Failed to delete item. Please try again.");
    }
  };

  if (itemNotFound) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeftIcon />
            Back
          </Button>
        </div>
        <div className={styles.errorState}>
          <Text size="2" color="gray">
            Item not found
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeftIcon />
          Back
        </Button>
        <h2 className={styles.title}>Edit Item</h2>
        <div className={styles.spacer} />
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Image Upload Section */}
        <div className={styles.imageSection}>
          {imagePreview ? (
            <div className={styles.imagePreviewContainer}>
              <img
                src={imagePreview}
                alt="Item preview"
                className={styles.imagePreview}
              />
              <label
                htmlFor="image-upload"
                className={styles.changeImageButton}
              >
                <Button type="button" size="2">
                  Change Image
                </Button>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
              />
            </div>
          ) : (
            <div className={styles.uploadPlaceholder}>
              <label htmlFor="image-upload">
                <Button type="button" size="3">
                  Upload New Image
                </Button>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
              />
            </div>
          )}

          {compressionInfo && (
            <div className={styles.compressionBanner}>
              <Text size="1" color="green">
                {compressionInfo}
              </Text>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className={styles.fields}>
          <div className={styles.field}>
            <span className={styles.label}>Type *</span>
            <TextField.Root
              placeholder="e.g., T-shirt, Jeans, Sneakers"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              size="3"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Color *</span>
            <TextField.Root
              placeholder="e.g., Blue, Black, White"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              size="3"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Brand</span>
            <TextField.Root
              placeholder="e.g., Nike, Zara, H&M"
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
              size="3"
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
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="tops">Tops</Select.Item>
                <Select.Item value="bottoms">Bottoms</Select.Item>
                <Select.Item value="dresses">Dresses/Jumpsuits</Select.Item>
                <Select.Item value="outerwear">Outerwear</Select.Item>
                <Select.Item value="shoes">Shoes</Select.Item>
                <Select.Item value="accessories">Accessories</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <Text color="red" size="2">
              {error}
            </Text>
          </div>
        )}

        <div className={styles.actions}>
          <Button
            type="submit"
            size="3"
            disabled={isSaving}
            className={styles.saveButton}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>

          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button type="button" color="red" variant="soft" size="3">
                <TrashIcon />
                Delete
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content maxWidth="400px">
              <AlertDialog.Title>Delete Item</AlertDialog.Title>
              <AlertDialog.Description>
                Are you sure you want to delete this item? This action cannot be
                undone.
              </AlertDialog.Description>
              <div className={styles.dialogActions}>
                <AlertDialog.Cancel>
                  <Button
                    variant="soft"
                    color="gray"
                    className={styles.dialogButton}
                  >
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                  <Button
                    color="red"
                    onClick={handleDelete}
                    className={styles.dialogButton}
                  >
                    Delete
                  </Button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </div>
      </form>
    </div>
  );
}
