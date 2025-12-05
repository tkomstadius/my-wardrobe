import { CameraIcon, TrashIcon } from '@radix-ui/react-icons';
import { Button, Heading, Text, TextArea, Checkbox } from '@radix-ui/themes';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOutfit } from '../contexts/OutfitContext';
import { useWardrobe } from '../contexts/WardrobeContext';
import { compressImage } from '../utils/imageCompression';
import styles from './CreateOutfitPage.module.css';

export function CreateOutfitPage() {
  const navigate = useNavigate();
  const { addOutfit } = useOutfit();
  const { items } = useWardrobe();

  const [formData, setFormData] = useState({
    notes: '',
    wornDate: new Date().toISOString().split('T')[0], // Today's date
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

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
        console.error('Failed to process image:', error);
        alert('Failed to process image. Please try another file.');
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
      alert('Please select at least one item for this outfit');
      return;
    }

    setIsSaving(true);

    try {
      await addOutfit({
        photo: imagePreview || undefined,
        itemIds: Array.from(selectedItems),
        wornDate: new Date(formData.wornDate),
        notes: formData.notes.trim() || undefined,
      });

      // Navigate to outfits page
      navigate('/outfits');
    } catch (error) {
      console.error('Failed to save outfit:', error);
      alert('Failed to save outfit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Group items by category for easier selection
  const itemsByCategory = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof items>
  );

  const categories = Object.keys(itemsByCategory).sort();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Heading size="6">Create Outfit</Heading>
        <Button variant="ghost" onClick={() => navigate('/outfits')}>
          Cancel
        </Button>
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
                  <img src={imagePreview} alt="Outfit preview" className={styles.previewImage} />
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
              onChange={(e) => setFormData({ ...formData, wornDate: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              <Button type="button" onClick={() => navigate('/add-item')} variant="soft" size="2">
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
                    {itemsByCategory[category].map((item) => (
                      <label key={item.id} className={styles.itemCheckbox}>
                        <div
                          className={`${styles.itemCard} ${
                            selectedItems.has(item.id) ? styles.selected : ''
                          }`}
                        >
                          <img src={item.imageUrl} alt={item.notes || 'Item'} />
                          <div className={styles.checkboxOverlay}>
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() => toggleItemSelection(item.id)}
                            />
                          </div>
                        </div>
                        <Text size="1" className={styles.itemLabel}>
                          {item.notes || item.brand || 'Unnamed'}
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
          <Button type="submit" size="4" disabled={isSaving || selectedItems.size === 0}>
            {isSaving ? 'Creating...' : 'Create Outfit'}
          </Button>
        </div>
      </form>
    </div>
  );
}

