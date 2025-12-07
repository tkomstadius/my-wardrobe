import { ArrowLeftIcon, TrashIcon } from "@radix-ui/react-icons";
import { Button, Select, Text, TextField } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useWardrobe } from "../contexts/WardrobeContext";
import { useImageUpload } from "../hooks/useImageUpload";
import { DeleteConfirmDialog } from "../components/common/DeleteConfirmDialog";
import { CheckboxField } from "../components/common/CheckboxField";
import { getImageEmbedding } from "../utils/aiEmbedding";
import type { ItemCategory } from "../types/wardrobe";
import { CATEGORIES, CATEGORY_IDS } from "../utils/categories";
import styles from "./EditItemPage.module.css";

export function EditItemPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    getItemById,
    updateItem,
    deleteItem,
    getAllBrands,
    incrementWearCount,
  } = useWardrobe();

  const { imagePreview, setImagePreview, handleImageUpload } = useImageUpload();

  const [formData, setFormData] = useState({
    notes: "",
    brand: "",
    category: "tops" as ItemCategory,
    price: "",
    isSecondHand: false,
    isDogCasual: false,
    isHandmade: false,
    purchaseDate: "",
    initialWearCount: "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingEmbedding, setIsGeneratingEmbedding] = useState(false);
  const [itemNotFound, setItemNotFound] = useState(false);
  const [categoryWarning, setCategoryWarning] = useState("");
  const [originalImageData, setOriginalImageData] = useState<string>("");

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

    // Validate category
    let itemCategory = item.category;
    if (!CATEGORY_IDS.includes(item.category)) {
      console.warn(
        `Invalid category "${item.category}" for item ${id}. Defaulting to "tops".`
      );
      setCategoryWarning(
        `Warning: This item had an invalid category "${item.category}". Please select the correct category and save.`
      );
      itemCategory = "tops";
    }

    // Pre-fill form with existing data
    setFormData({
      notes: item.notes || "",
      brand: item.brand || "",
      category: itemCategory, // Use validated category (defaults to "tops" if invalid)
      price: item.price !== undefined ? item.price.toString() : "",
      isSecondHand: item.isSecondHand || false,
      isDogCasual: item.isDogCasual || false,
      isHandmade: item.isHandmade || false,
      purchaseDate: item.purchaseDate
        ? new Date(item.purchaseDate).toISOString().split("T")[0] ?? ""
        : "",
      initialWearCount: (item.initialWearCount ?? 0).toString(),
    });
    setImagePreview(item.imageUrl);
    setOriginalImageData(item.imageUrl);
  }, [id, getItemById, setImagePreview]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setCategoryWarning("");

    // Validate form
    if (!imagePreview) {
      setError("Please add an image of the item");
      return;
    }

    // Validate category
    if (!CATEGORY_IDS.includes(formData.category)) {
      setError(
        `Invalid category "${formData.category}". Please select a valid category.`
      );
      return;
    }

    setIsSaving(true);

    try {
      const item = getItemById(id!);
      if (!item) {
        throw new Error("Item not found");
      }

      // Regenerate embedding if image has changed
      let embeddingUpdate: number[] | undefined;

      if (imagePreview !== originalImageData) {
        try {
          setIsGeneratingEmbedding(true);
          embeddingUpdate = await getImageEmbedding(imagePreview);
        } catch (error) {
          console.error("Failed to generate embedding:", error);
          // Continue without embedding - user can generate later in Settings
        } finally {
          setIsGeneratingEmbedding(false);
        }
      }

      const newInitialWearCount = formData.initialWearCount
        ? Number.parseInt(formData.initialWearCount, 10)
        : 0;

      // Calculate total wear count: initial + wear history
      const totalWearCount =
        newInitialWearCount + (item.wearHistory?.length || 0);

      await updateItem(id!, {
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
        initialWearCount: newInitialWearCount,
        wearCount: totalWearCount,
        ...(embeddingUpdate && { embedding: embeddingUpdate }),
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

    setIsDeleting(true);
    try {
      await deleteItem(id);
      navigate("/"); // Navigate to home after delete
    } catch (err) {
      console.error("Failed to delete item:", err);
      setError("Failed to delete item. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleMarkAsWorn = async () => {
    if (!id) return;

    try {
      await incrementWearCount(id);
      // No need to update form data - initialWearCount doesn't change when marking as worn
      // The total count display will update automatically when component re-renders
    } catch (err) {
      console.error("Failed to increment wear count:", err);
      setError("Failed to update wear count. Please try again.");
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
              <Button
                type="button"
                size="2"
                className={styles.changeImageButton}
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                Change Image
              </Button>
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
              <Button
                type="button"
                size="3"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                Upload New Image
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
              />
            </div>
          )}
        </div>

        {/* Category Warning */}
        {categoryWarning && (
          <div className={styles.warningMessage}>
            <Text color="orange" size="2">
              {categoryWarning}
            </Text>
          </div>
        )}

        {/* Form Fields */}
        <div className={styles.fields}>
          <div className={styles.field}>
            <span className={styles.label}>Brand</span>
            <TextField.Root
              placeholder="e.g., Nike, Zara, H&M"
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
              list="brand-suggestions-edit"
              size="3"
            />
            <datalist id="brand-suggestions-edit">
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
            <span className={styles.label}>
              Initial Wear Count (before adding to app)
            </span>
            <TextField.Root
              type="number"
              placeholder="0"
              value={formData.initialWearCount}
              onChange={(e) =>
                setFormData({ ...formData, initialWearCount: e.target.value })
              }
              size="3"
            />
            <Text size="1" color="gray" className={styles.helpText}>
              Use this for items you already owned. Leave at 0 for new items.
            </Text>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Total Wear Count</span>
            <div className={styles.wearCountContainer}>
              <TextField.Root
                type="number"
                value={
                  id && getItemById(id)
                    ? getItemById(id)!.wearCount.toString()
                    : "0"
                }
                size="3"
                className={styles.wearCountInput}
                disabled
                readOnly
              />
              <Button
                type="button"
                variant="soft"
                size="3"
                onClick={handleMarkAsWorn}
                className={styles.markWornButton}
              >
                Mark as Worn
              </Button>
            </div>
            <Text size="1" color="gray" className={styles.helpText}>
              {id && getItemById(id)
                ? `${getItemById(id)!.initialWearCount || 0} initial + ${
                    getItemById(id)!.wearHistory?.length || 0
                  } worn in app`
                : ""}
            </Text>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Notes (Optional)</span>
            <TextField.Root
              placeholder="e.g., favorite jeans, scratched"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              size="3"
            />
          </div>

          <CheckboxField
            checked={formData.isSecondHand}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isSecondHand: checked })
            }
            label="Second Hand / Thrifted"
          />

          <CheckboxField
            checked={formData.isDogCasual}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isDogCasual: checked })
            }
            label="Dog casual"
          />

          <CheckboxField
            checked={formData.isHandmade}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isHandmade: checked })
            }
            label="Handmade"
          />
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
            disabled={isSaving || isGeneratingEmbedding}
            className={styles.saveButton}
          >
            {isGeneratingEmbedding
              ? "Processing image..."
              : isSaving
              ? "Saving..."
              : "Save Changes"}
          </Button>

          <DeleteConfirmDialog
            title="Delete Item"
            description="Are you sure you want to delete this item? This action cannot be undone."
            onConfirm={handleDelete}
            isDeleting={isDeleting}
            triggerButton={
              <Button type="button" color="red" variant="soft" size="3">
                <TrashIcon />
                Delete
              </Button>
            }
          />
        </div>
      </form>
    </div>
  );
}
