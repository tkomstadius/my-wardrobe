import { ArrowLeftIcon, TrashIcon } from "@radix-ui/react-icons";
import {
  AlertDialog,
  Button,
  Checkbox,
  Flex,
  Select,
  Text,
  TextField,
} from "@radix-ui/themes";
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
  const {
    getItemById,
    updateItem,
    deleteItem,
    getAllBrands,
    incrementWearCount,
  } = useWardrobe();

  const [formData, setFormData] = useState({
    notes: "",
    brand: "",
    category: "tops" as ItemCategory,
    price: "",
    isSecondHand: false,
    isDogCasual: false,
    purchaseDate: "",
    wearCount: "",
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
      notes: item.notes || "",
      brand: item.brand || "",
      category: item.category,
      price: item.price !== undefined ? item.price.toString() : "",
      isSecondHand: item.isSecondHand || false,
      isDogCasual: item.isDogCasual || false,
      purchaseDate: item.purchaseDate
        ? new Date(item.purchaseDate).toISOString().split("T")[0] ?? ""
        : "",
      wearCount: item.wearCount.toString(),
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

    setIsSaving(true);

    try {
      await updateItem(id!, {
        imageUrl: imagePreview,
        notes: formData.notes.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        category: formData.category,
        price: formData.price ? Number.parseFloat(formData.price) : undefined,
        isSecondHand: formData.isSecondHand,
        isDogCasual: formData.isDogCasual,
        purchaseDate: formData.purchaseDate
          ? new Date(formData.purchaseDate)
          : undefined,
        wearCount: formData.wearCount
          ? Number.parseInt(formData.wearCount, 10)
          : 0,
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

  const handleMarkAsWorn = async () => {
    if (!id) return;

    try {
      await incrementWearCount(id);
      // Update the form data to reflect the new wear count
      const updatedItem = getItemById(id);
      if (updatedItem) {
        setFormData((prev) => ({
          ...prev,
          wearCount: updatedItem.wearCount.toString(),
        }));
      }
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
            <span className={styles.label}>Brand</span>
            <input
              type="text"
              placeholder="e.g., Nike, Zara, H&M"
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
              list="brand-suggestions-edit"
              className={styles.input}
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
            <span className={styles.label}>Wear Count</span>
            <div className={styles.wearCountContainer}>
              <TextField.Root
                type="number"
                placeholder="0"
                value={formData.wearCount}
                onChange={(e) =>
                  setFormData({ ...formData, wearCount: e.target.value })
                }
                size="3"
                className={styles.wearCountInput}
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
