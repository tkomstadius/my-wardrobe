import { CameraIcon, TrashIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { Button, Heading, Text, TextArea } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useOutfit } from "../contexts/OutfitContext";
import { useWardrobe } from "../contexts/WardrobeContext";
import { useImageUpload } from "../hooks/useImageUpload";
import { DeleteConfirmDialog } from "../components/common/DeleteConfirmDialog";
import { ItemSelector } from "../components/common/ItemSelector";
import { RatingButtons } from "../components/common/RatingButtons";
import styles from "./CreateOutfitPage.module.css";
import { BackLink } from "../components/common/BackLink";

export function EditOutfitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateOutfit, getOutfitById, deleteOutfit } = useOutfit();
  const { items } = useWardrobe();
  const { imagePreview, setImagePreview, handleImageUpload, clearImage } =
    useImageUpload();

  const [formData, setFormData] = useState({
    createdDate: new Date().toISOString().split("T")[0] as string,
    notes: "",
    rating: undefined as number | undefined,
  });
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
      createdDate: new Date(outfit.createdAt).toISOString().split("T")[0] ?? "",
      notes: outfit.notes || "",
      rating: outfit.rating,
    });
    setImagePreview(outfit.photo || "");
    setSelectedItems(new Set(outfit.itemIds));
  }, [id, getOutfitById, setImagePreview]);

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
        createdAt: new Date(formData.createdDate),
        notes: formData.notes.trim() || undefined,
        rating: formData.rating,
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

  if (outfitNotFound) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            Outfit not found
          </Text>
          <BackLink to="/outfits" />
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
        <DeleteConfirmDialog
          title="Delete Outfit"
          description="Are you sure you want to delete this outfit? This action cannot be undone."
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          triggerButton={
            <Button variant="soft" color="red">
              <TrashIcon />
            </Button>
          }
        />
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
                    onClick={clearImage}
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

              <label
                htmlFor="outfit-image-upload"
                className={styles.cameraButton}
              >
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
              Created
            </Text>
            <input
              type="date"
              value={formData.createdDate}
              onChange={(e) =>
                setFormData({ ...formData, createdDate: e.target.value })
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

        {/* Rating Scales */}
        <section className={styles.section}>
          <Text weight="bold" size="2" className={styles.ratingHeader}>
            Rate This Outfit (Optional)
          </Text>

          <RatingButtons
            label="How do you feel about this outfit? (Optional)"
            value={formData.rating}
            onChange={(value) => setFormData({ ...formData, rating: value })}
          />
        </section>

        {/* Item Selection */}
        <section>
          <ItemSelector
            items={items}
            selectedItems={selectedItems}
            onToggleSelection={toggleItemSelection}
            emptyMessage="No items in your wardrobe yet"
            actionButtons={
              <Button
                type="submit"
                size="3"
                disabled={isSaving || selectedItems.size === 0}
                className={styles.submitButton}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            }
          />
        </section>
      </form>
    </div>
  );
}
