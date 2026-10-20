import { useEffect, useState } from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
} from 'react-router';
import { BackLink } from '../components/common/BackLink';
import { CheckboxField } from '../components/common/CheckboxField';
import { DeleteConfirmDialog } from '../components/common/DeleteConfirmDialog';
import {
  AI_CATEGORY_NAME,
  AI_COLOR_NAME,
  AI_DESCRIPTION_NAME,
  AI_MATERIAL_NAME,
  AI_PATTERN_NAME,
  BRAND_NAME,
  CATEGORY_NAME,
  DOG_CASUAL_NAME,
  HANDMADE_NAME,
  IMAGE_URL_NAME,
  INITIAL_WEAR_COUNT_NAME,
  NOTES_NAME,
  PRICE_NAME,
  PURCHASE_DATE_NAME,
  RATING_NAME,
  SECOND_HAND_NAME,
  SUBCATEGORY_NAME,
} from '../components/common/form/constants';
import { ImageInput } from '../components/common/form/ImageInput';
import { RatingButtons } from '../components/common/form/RatingButtons';
import { SelectInput } from '../components/common/form/SelectInput';
import { TextInput } from '../components/common/form/TextInput';
import { Button } from '../components/common/ui/Button';
import { Callout } from '../components/common/ui/Callout';
import { Flex } from '../components/common/ui/Flex';
import { Heading } from '../components/common/ui/Heading';
import { Text } from '../components/common/ui/Text';
import { TextArea } from '../components/common/ui/TextArea';
import { TextField } from '../components/common/ui/TextField';
import type { OutfitRating } from '../types/outfit';
import type { ItemCategory, WardrobeItem } from '../types/wardrobe';
import {
  clearItemAiAnalysis,
  triggerEmbeddingRegeneration,
  triggerItemProcessing,
} from '../utils/aiProcessing';
import { CATEGORIES, CATEGORY_IDS, getSubCategoriesForCategory } from '../utils/categories';
import {
  getAllBrands,
  getItemById,
  getItemStoragePath,
  removeItem,
  saveItem,
} from '../utils/storageCommands';
import { getCurrentUserId } from '../utils/supabase';
import { dataUrlToBlob, uploadItemImage } from '../utils/supabaseStorage';
import { showError } from '../utils/toast';
import styles from './EditItemPage.module.css';

type ActionData = {
  error?: string;
};

export async function clientLoader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  if (!id) {
    return { item: null };
  }

  const [item, brands] = await Promise.all([getItemById(id), getAllBrands()]);

  return { item, brands };
}

export async function clientAction({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  if (!id) {
    return { error: 'Item ID is required' };
  }

  const formData = await request.formData();

  // Handle update action
  const imageUrl = formData.get(IMAGE_URL_NAME) as string;
  const brand = formData.get(BRAND_NAME) as string;
  const category = formData.get(CATEGORY_NAME) as ItemCategory;
  const subCategory = formData.get(SUBCATEGORY_NAME) as string;
  const price = formData.get(PRICE_NAME) as string;
  const purchaseDate = formData.get(PURCHASE_DATE_NAME) as string;
  const initialWearCount = formData.get(INITIAL_WEAR_COUNT_NAME) as string;
  const notes = formData.get(NOTES_NAME) as string;
  const rating = formData.get(RATING_NAME) as string;
  const isSecondHand = formData.get(SECOND_HAND_NAME) === 'on';
  const isDogCasual = formData.get(DOG_CASUAL_NAME) === 'on';
  const isHandmade = formData.get(HANDMADE_NAME) === 'on';
  const aiDescription = formData.get(AI_DESCRIPTION_NAME) as string;
  const aiCategory = formData.get(AI_CATEGORY_NAME) as string;
  const aiColor = formData.get(AI_COLOR_NAME) as string;
  const aiPattern = formData.get(AI_PATTERN_NAME) as string;
  const aiMaterial = formData.get(AI_MATERIAL_NAME) as string;

  if (!imageUrl) {
    return { error: 'Please add an image of the item' };
  }

  if (!category || !CATEGORY_IDS.includes(category)) {
    return { error: 'Please select a valid category' };
  }

  try {
    // Load the existing item
    const existingItem = await getItemById(id);
    if (!existingItem) {
      return { error: 'Item not found' };
    }

    const imageChanged = imageUrl.startsWith('data:');

    // Resolve storage path for image
    let storagePath: string;
    if (imageChanged) {
      const userId = await getCurrentUserId();
      const blob = dataUrlToBlob(imageUrl);
      storagePath = await uploadItemImage(userId, id, blob);
    } else {
      // Image unchanged — retrieve existing storage path from DB
      storagePath = (await getItemStoragePath(id)) ?? '';
    }

    const newInitialWearCount = initialWearCount ? Number.parseInt(initialWearCount, 10) : 0;

    const totalWearCount = newInitialWearCount + existingItem.wearHistory.length;

    const normalizedDescription = aiDescription?.trim() || '';
    const previousDescription = existingItem.description?.trim() || '';
    // Compared before the full-pipeline reprocess path below can overwrite it — only meaningful
    // when the image itself didn't also change (that path regenerates everything from scratch).
    const descriptionChanged = normalizedDescription !== previousDescription;

    const aiMetadataFields = {
      category: aiCategory?.trim() || '',
      color: aiColor?.trim() || '',
      pattern: aiPattern?.trim() || '',
      material: aiMaterial?.trim() || '',
    };
    const hasAiMetadata = Object.values(aiMetadataFields).some((value) => value.length > 0);

    const updatedItem: WardrobeItem = {
      ...existingItem,
      imageUrl: storagePath,
      notes: notes?.trim() || undefined,
      brand: brand?.trim() || undefined,
      category,
      subCategory: subCategory?.trim() || undefined,
      price: price ? Number.parseFloat(price) : undefined,
      isSecondHand,
      isDogCasual,
      isHandmade,
      rating: rating ? (Number.parseInt(rating, 10) as OutfitRating) : undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      initialWearCount: newInitialWearCount,
      wearCount: totalWearCount,
      description: normalizedDescription || undefined,
      metadata: hasAiMetadata ? aiMetadataFields : undefined,
      updatedAt: new Date(),
    };

    await saveItem(updatedItem);

    let shouldWatchProcessing = false;

    if (imageChanged) {
      // Must be awaited and finish before triggering — otherwise process-item could read the
      // still-stale metadata/embedding and skip reprocessing the new photo entirely. Takes
      // precedence over any manual description/metadata edits submitted in this same request,
      // since a new photo needs fresh analysis regardless.
      await clearItemAiAnalysis(id);
      triggerItemProcessing(id, storagePath);
      shouldWatchProcessing = true;
    } else if (descriptionChanged && normalizedDescription) {
      // Only the embedding needs to change — metadata edits don't feed it, and re-running the
      // full image pipeline would blow away the manual correction that was just saved.
      triggerEmbeddingRegeneration(id, normalizedDescription);
      shouldWatchProcessing = true;
    }

    return redirect(`/item/${existingItem.id}${shouldWatchProcessing ? '?reprocessing=true' : ''}`);
  } catch (err) {
    console.error('Failed to update item:', err);
    return { error: 'Failed to save changes. Please try again.' };
  }
}

// TODO maybe handle delete differently using a form action instead

export function EditItemPage() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { item, brands } = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<ActionData>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>(item?.category || 'tops');

  const isSubmitting = navigation.state === 'submitting';

  // Update selected category when item changes
  useEffect(() => {
    if (item?.category) {
      setSelectedCategory(item.category);
    }
  }, [item]);

  const availableSubCategories = getSubCategoriesForCategory(selectedCategory);

  // Validate category and show warning if needed
  const categoryWarning =
    item && !CATEGORY_IDS.includes(item.category)
      ? `Warning: This item had an invalid category "${item.category}". Please select the correct category and save.`
      : '';

  const validCategory = item && CATEGORY_IDS.includes(item.category) ? item.category : 'tops';

  const handleDelete = async () => {
    if (!item) return;

    setIsDeleting(true);
    try {
      await removeItem(item.id);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to delete item:', err);
      showError('Could not delete item. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BackLink to={`/item/${item?.id}`} />
        <h2 className={styles.title}>Edit Item</h2>
        <div className={styles.spacer} />
      </div>
      {!item ? (
        <div className={styles.errorState}>
          <Text size="2" color="gray">
            Item not found
          </Text>
        </div>
      ) : (
        <Form method="post" replace className={styles.form}>
          <fieldset className={styles.fieldSection}>
            <ImageInput originalImageUrl={item.imageUrl} />
          </fieldset>

          {categoryWarning && <Callout>{categoryWarning}</Callout>}

          <fieldset className={styles.fieldSection}>
            <TextInput
              label="Brand"
              name={BRAND_NAME}
              placeholder="e.g., Ganni, Hope"
              defaultValue={item.brand || ''}
              suggestions={brands}
            />

            <SelectInput
              label="Category"
              name={CATEGORY_NAME}
              options={CATEGORIES.map((category) => ({
                id: category.id,
                title: category.title,
              }))}
              defaultValue={validCategory}
              onValueChange={(value) => setSelectedCategory(value as ItemCategory)}
            />

            <SelectInput
              label="Sub category"
              name={SUBCATEGORY_NAME}
              options={availableSubCategories.map((subCategory) => ({
                id: subCategory,
                title: subCategory,
              }))}
              defaultValue={item.subCategory || undefined}
            />
          </fieldset>

          <fieldset className={styles.fieldSection}>
            <TextInput
              label="Price"
              name={PRICE_NAME}
              placeholder="e.g., 499"
              defaultValue={item.price?.toString() || ''}
            />

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="bold">
                Purchase Date
              </Text>
              <TextField.Root size="3">
                <TextField.Input
                  name={PURCHASE_DATE_NAME}
                  type="date"
                  defaultValue={
                    item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : ''
                  }
                />
              </TextField.Root>
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="bold">
                Initial Wear Count
              </Text>
              <TextField.Root size="3">
                <TextField.Input
                  name={INITIAL_WEAR_COUNT_NAME}
                  type="number"
                  placeholder="0"
                  defaultValue={(item.initialWearCount ?? 0).toString()}
                />
              </TextField.Root>
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="bold">
                Notes
              </Text>
              <TextArea
                variant="soft"
                name={NOTES_NAME}
                placeholder="e.g., favorite jeans, scratched"
                rows={2}
                defaultValue={item.notes || ''}
                size="3"
              />
            </Flex>
          </fieldset>

          <fieldset className={styles.fieldSection}>
            <CheckboxField
              name="isSecondHand"
              defaultChecked={item.isSecondHand}
              label="Second Hand / Thrifted"
            />
            <CheckboxField
              name="isDogCasual"
              defaultChecked={item.isDogCasual}
              label="Dog casual"
            />
            <CheckboxField name="isHandmade" defaultChecked={item.isHandmade} label="Handmade" />
          </fieldset>

          <fieldset className={styles.fieldSection}>
            <RatingButtons name={RATING_NAME} defaultValue={item.rating} />
          </fieldset>

          <fieldset className={styles.fieldSection}>
            <Heading size="4">AI Analysis</Heading>
            <Text size="1" color="gray">
              Edit if the AI got something wrong. Changing the description regenerates its
              embedding; metadata edits don't (they don't feed it).
            </Text>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="bold">
                Description
              </Text>
              <TextArea
                variant="soft"
                name={AI_DESCRIPTION_NAME}
                placeholder="No AI description yet"
                rows={3}
                defaultValue={item.description || ''}
                size="3"
              />
            </Flex>

            <TextInput
              label="Category"
              name={AI_CATEGORY_NAME}
              placeholder="e.g., sweater"
              defaultValue={
                typeof item.metadata?.category === 'string' ? item.metadata.category : ''
              }
            />
            <TextInput
              label="Color"
              name={AI_COLOR_NAME}
              placeholder="e.g., black"
              defaultValue={typeof item.metadata?.color === 'string' ? item.metadata.color : ''}
            />
            <TextInput
              label="Pattern"
              name={AI_PATTERN_NAME}
              placeholder="e.g., solid"
              defaultValue={typeof item.metadata?.pattern === 'string' ? item.metadata.pattern : ''}
            />
            <TextInput
              label="Material"
              name={AI_MATERIAL_NAME}
              placeholder="e.g., cotton"
              defaultValue={
                typeof item.metadata?.material === 'string' ? item.metadata.material : ''
              }
            />
          </fieldset>

          {actionData?.error && <Callout>{actionData.error}</Callout>}

          <div className={styles.deleteSection}>
            <DeleteConfirmDialog
              title="Delete Item"
              description="Are you sure you want to delete this item? This action cannot be undone."
              onConfirm={handleDelete}
              isDeleting={isDeleting}
              triggerButton={
                <Button type="button" variant="destructive" className={styles.deleteButton}>
                  <IoTrashOutline />
                  Delete Item
                </Button>
              }
            />
          </div>

          <div className={styles.stickyFooter}>
            <Button type="submit" disabled={isSubmitting} className={styles.saveButton}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
}
