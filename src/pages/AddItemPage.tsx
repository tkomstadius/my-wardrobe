import { ArrowLeftIcon, CameraIcon } from "@radix-ui/react-icons";
import { Button, Callout, Select, TextField } from "@radix-ui/themes";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useWardrobe } from "../contexts/WardrobeContext";
import { useImageUpload } from "../hooks/useImageUpload";
import { CheckboxField } from "../components/common/CheckboxField";
import { getImageEmbedding } from "../utils/aiEmbedding";
import type {
  ItemCategory,
  AddItemFormState,
  ItemTrait,
} from "../types/wardrobe";
import { CATEGORIES, CATEGORY_IDS } from "../utils/categories";
import styles from "./AddItemPage.module.css";

export function AddItemPage() {
  const navigate = useNavigate();
  const { addItem, getAllBrands } = useWardrobe();
  const { imagePreview, handleImageUpload } = useImageUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingEmbedding, setIsGeneratingEmbedding] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<AddItemFormState>({
    notes: "",
    brand: "",
    category: undefined,
    price: "",
    isSecondHand: false,
    isDogCasual: false,
    isHandmade: false,
    trait: undefined,
    purchaseDate: "",
    initialWearCount: "",
  });

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
      // Generate embedding for AI wear logging
      let embedding: number[] | undefined;

      try {
        setIsGeneratingEmbedding(true);
        embedding = await getImageEmbedding(imagePreview);
      } catch (error) {
        console.error("Failed to generate embedding:", error);
        // Continue without embedding - user can generate later in Settings
      } finally {
        setIsGeneratingEmbedding(false);
      }

      // Save item to context (which persists to IndexedDB)
      await addItem({
        imageUrl: imagePreview,
        notes: formData.notes?.trim() || undefined,
        brand: formData.brand?.trim() || undefined,
        category: formData.category,
        price: formData.price ? Number.parseFloat(formData.price) : undefined,
        isSecondHand: formData.isSecondHand,
        isDogCasual: formData.isDogCasual,
        isHandmade: formData.isHandmade,
        trait: formData.trait,
        purchaseDate: formData.purchaseDate
          ? new Date(formData.purchaseDate)
          : undefined,
        initialWearCount: formData.initialWearCount
          ? Number.parseInt(formData.initialWearCount, 10)
          : undefined,
        embedding, // Add embedding if generated
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
              placeholder="e.g., Ganni, Hope"
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
              list="brand-suggestions"
              size="3"
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
              value={formData.category}
              onValueChange={(value) => {
                if (CATEGORY_IDS.includes(value as ItemCategory)) {
                  setFormData({ ...formData, category: value as ItemCategory });
                }
              }}
              size="3"
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
            <span className={styles.label}>Item Trait (Optional)</span>
            <Select.Root
              value={formData.trait || "none"}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  trait: value === "none" ? undefined : (value as ItemTrait),
                })
              }
              size="3"
            >
              <Select.Trigger placeholder="Select a vibe..." />
              <Select.Content>
                <Select.Item value="none">None</Select.Item>
                <Select.Item value="comfort">
                  Comfort (cozy, relaxed)
                </Select.Item>
                <Select.Item value="confidence">
                  Confidence (powerful, bold)
                </Select.Item>
                <Select.Item value="creative">
                  Creative (expressive, artistic)
                </Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
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

        <CheckboxField
          checked={Boolean(formData.isSecondHand)}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isSecondHand: checked })
          }
          label="Second Hand / Thrifted"
        />

        <CheckboxField
          checked={Boolean(formData.isDogCasual)}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isDogCasual: checked })
          }
          label="Dog casual"
        />

        <CheckboxField
          checked={Boolean(formData.isHandmade)}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isHandmade: checked })
          }
          label="Handmade"
        />

        <Button
          type="submit"
          size="3"
          className={styles.saveButton}
          disabled={isSubmitting || isGeneratingEmbedding}
        >
          {isGeneratingEmbedding
            ? "Processing image..."
            : isSubmitting
            ? "Saving..."
            : "Save Item"}
        </Button>
      </form>
    </div>
  );
}
