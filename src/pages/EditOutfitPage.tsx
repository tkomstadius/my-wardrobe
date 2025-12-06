import { CameraIcon, TrashIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import {
  Button,
  Heading,
  Text,
  TextArea,
  Checkbox,
  AlertDialog,
  Flex,
} from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useOutfit } from "../contexts/OutfitContext";
import { useWardrobe } from "../contexts/WardrobeContext";
import type { WardrobeItem } from "../types/wardrobe";
import { compressImage } from "../utils/imageCompression";
import styles from "./CreateOutfitPage.module.css";

export function EditOutfitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateOutfit, getOutfitById, deleteOutfit } = useOutfit();
  const { items } = useWardrobe();

  const [formData, setFormData] = useState({
    notes: "",
    wornDate: new Date().toISOString().split("T")[0] as string,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [outfitNotFound, setOutfitNotFound] = useState(false);

  // Load outfit data
  useEffect(() => {
    if (!id) {
      setOutfitNotFound(true);
      return;
    }

    const outfit = getOutfitById(id);
    if (!outfit) {
      setOutfitNotFound(true);
      return;
    }

    // Pre-fill form with existing data
    setFormData({
      notes: outfit.notes || "",
      wornDate: new Date(outfit.wornDate).toISOString().split("T")[0] ?? "",
    });
    setImagePreview(outfit.photo || null);
    setSelectedItems(new Set(outfit.itemIds));
  }, [id, getOutfitById]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const originalDataURL = reader.result as string;
          const compressedDataUrl = await compressImage(originalDataURL);
          setImagePreview(compressedDataUrl);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Failed to process image:", error);
        alert("Failed to process image. Please try another file.");
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.size === 0) {
      alert("Please select at least one item for this outfit");
      return;
    }

    if (!id) return;

    setIsSaving(true);

    try {
      await updateOutfit(id, {
        photo: imagePreview || undefined,
        itemIds: Array.from(selectedItems),
        wornDate: new Date(formData.wornDate),
        notes: formData.notes.trim() || undefined,
      });

      // Navigate to outfit detail page
      navigate(`/outfit/${id}`);
    } catch (error) {
      console.error("Failed to update outfit:", error);
      alert("Failed to update outfit. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteOutfit(id);
      navigate("/outfits");
    } catch (error) {
      console.error("Failed to delete outfit:", error);
      alert("Failed to delete outfit. Please try again.");
      setIsDeleting(false);
    }
  };

  // Group items by category for easier selection
  const itemsByCategory = items.reduce<Record<string, WardrobeItem[]>>(
    (acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category]!.push(item);
      return acc;
    },
    {}
  );

  const categories = Object.keys(itemsByCategory).sort();

  if (outfitNotFound) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            Outfit not found
          </Text>
          <Button onClick={() => navigate("/outfits")} variant="soft">
            Back to Outfits
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Button variant="ghost" onClick={() => navigate(`/outfit/${id}`)}>
          <ArrowLeftIcon /> Back
        </Button>
        <Heading size="6">Edit Outfit</Heading>
        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <Button variant="soft" color="red">
              <TrashIcon />
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content maxWidth="450px">
            <AlertDialog.Title>Delete Outfit</AlertDialog.Title>
            <AlertDialog.Description size="2">
              Are you sure you want to delete this outfit? This action cannot be
              undone.
            </AlertDialog.Description>
            <Flex gap="3" mt="4" justify="end">
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button
                  variant="solid"
                  color="red"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Outfit Photo */}
        <section className={styles.section}>
          <Text weight="bold" size="2">
            Outfit Photo (Optional)
          </Text>

          <div className={styles.imageSection}>
            <div className={styles.imageContainer}>
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Outfit preview"
                    className={styles.previewImage}
                  />
                  <Button
                    type="button"
                    variant="soft"
                    color="red"
                    size="1"
                    onClick={handleRemoveImage}
                    className={styles.removeButton}
                  >
                    <TrashIcon /> Remove
                  </Button>
                </>
              ) : (
                <div className={styles.imagePlaceholder}>
                  <p>No image selected</p>
                </div>
              )}

              <label htmlFor="outfit-image-upload" className={styles.cameraButton}>
                <CameraIcon width={24} height={24} />
              </label>
              <input
                id="outfit-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
              />
            </div>
          </div>
        </section>

        {/* Outfit Details */}
        <section className={styles.section}>
          <label className={styles.label}>
            <Text weight="bold" size="2">
              Date Worn
            </Text>
            <input
              type="date"
              value={formData.wornDate}
              onChange={(e) =>
                setFormData({ ...formData, wornDate: e.target.value })
              }
              className={styles.dateInput}
              required
            />
          </label>

          <label className={styles.label}>
            <Text weight="bold" size="2">
              Notes (Optional)
            </Text>
            <TextArea
              placeholder="Add any notes about this outfit..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              size="3"
            />
          </label>
        </section>

        {/* Item Selection */}
        <section className={styles.section}>
          <Text weight="bold" size="3">
            Select Items ({selectedItems.size} selected)
          </Text>

          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <Text color="gray">No items in your wardrobe yet</Text>
              <Button
                type="button"
                onClick={() => navigate("/add-item")}
                variant="soft"
                size="2"
              >
                Add Your First Item
              </Button>
            </div>
          ) : (
            <div className={styles.itemsSelection}>
              {categories.map((category) => (
                <div key={category} className={styles.categorySection}>
                  <Text size="2" weight="bold" className={styles.categoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>

                  <div className={styles.itemsGrid}>
                    {itemsByCategory[category]?.map((item) => (
                      <label key={item.id} className={styles.itemCheckbox}>
                        <div
                          className={`${styles.itemCard} ${
                            selectedItems.has(item.id) ? styles.selected : ""
                          }`}
                        >
                          <img src={item.imageUrl} alt={item.notes || "Item"} />
                          <div className={styles.checkboxOverlay}>
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() => toggleItemSelection(item.id)}
                            />
                          </div>
                        </div>
                        <Text size="1" className={styles.itemLabel}>
                          {item.notes || item.brand || "Unnamed"}
                        </Text>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit Button */}
        <div className={styles.actions}>
          <Button
            type="submit"
            size="4"
            disabled={isSaving || selectedItems.size === 0}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

