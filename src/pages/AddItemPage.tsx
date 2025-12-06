import { ArrowLeftIcon, CameraIcon } from "@radix-ui/react-icons";
import {
  Button,
  Callout,
  Checkbox,
  Flex,
  Select,
  Text,
  TextField,
} from "@radix-ui/themes";
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
import { CATEGORIES, CATEGORY_IDS } from "../utils/categories";
import styles from "./AddItemPage.module.css";

export function AddItemPage() {
  const navigate = useNavigate();
  const { addItem, getAllBrands } = useWardrobe();
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    notes: "",
    brand: "",
    category: "" as ItemCategory | "",
    price: "",
    isSecondHand: false,
    isDogCasual: false,
    isHandmade: false,
    purchaseDate: "",
    initialWearCount: "",
  });

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

          setImagePreview(compressedDataURL);
        } catch (err) {
          console.error("Compression failed, using original:", err);
          setImagePreview(originalDataURL);
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

    if (!formData.category) {
      setError("Please select a category");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save item to context (which persists to IndexedDB)
      await addItem({
        imageUrl: imagePreview,
        notes: formData.notes.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        category: formData.category,
        price: formData.price ? Number.parseFloat(formData.price) : undefined,
        isSecondHand: formData.isSecondHand,
        isDogCasual: formData.isDogCasual,
        isHandmade: formData.isHandmade,
        purchaseDate: formData.purchaseDate
          ? new Date(formData.purchaseDate)
          : undefined,
        initialWearCount: formData.initialWearCount
          ? Number.parseInt(formData.initialWearCount, 10)
          : undefined,
      });

      // Navigate to category page
      navigate(`/category/${formData.category}`);
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
        <div className={styles.spacer} />
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && (
          <Callout.Root color="red" size="1">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Item preview"
                className={styles.previewImage}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <p>No image selected</p>
              </div>
            )}

            <label htmlFor="image-upload" className={styles.cameraButton}>
              <CameraIcon width={24} height={24} />
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className={styles.fileInput}
            />
          </div>
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <span className={styles.label}>Brand (Optional)</span>
            <TextField.Root
              placeholder="e.g., Nike, Zara"
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
              list="brand-suggestions"
            />
            <datalist id="brand-suggestions">
              {getAllBrands().map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Category</span>
            <Select.Root
              value={formData.category || undefined}
              onValueChange={(value) => {
                // Ignore empty string changes (component initialization artifact)
                if (value && CATEGORY_IDS.includes(value as ItemCategory)) {
                  setFormData({ ...formData, category: value as ItemCategory });
                }
              }}
            >
              <Select.Trigger placeholder="Select category" />
              <Select.Content>
                {CATEGORIES.map((category) => (
                  <Select.Item key={category.id} value={category.id}>
                    {category.title}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Price</span>
            <TextField.Root
              type="number"
              placeholder="e.g., 49.99"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              size="3"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Purchase Date</span>
            <TextField.Root
              type="date"
              value={formData.purchaseDate}
              onChange={(e) =>
                setFormData({ ...formData, purchaseDate: e.target.value })
              }
              size="3"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Initial Wear Count</span>
            <TextField.Root
              type="number"
              placeholder="0"
              value={formData.initialWearCount}
              onChange={(e) =>
                setFormData({ ...formData, initialWearCount: e.target.value })
              }
              size="3"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Notes (Optional)</span>
            <TextField.Root
              placeholder="e.g., T-shirt, favorite jeans, scratched"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              size="3"
            />
          </div>

          <Text as="label" size="3">
            <Flex gap="2" align="center">
              <Checkbox
                checked={formData.isSecondHand}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isSecondHand: checked === true })
                }
              />
              Second Hand / Thrifted
            </Flex>
          </Text>

          <Text as="label" size="3">
            <Flex gap="2" align="center">
              <Checkbox
                checked={formData.isDogCasual}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDogCasual: checked === true })
                }
              />
              Dog casual
            </Flex>
          </Text>

          <Text as="label" size="3">
            <Flex gap="2" align="center">
              <Checkbox
                checked={formData.isHandmade}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isHandmade: checked === true })
                }
              />
              Handmade
            </Flex>
          </Text>
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
