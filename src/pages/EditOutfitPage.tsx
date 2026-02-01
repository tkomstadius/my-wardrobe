import { useMemo, useState } from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useNavigate,
  useNavigation,
} from 'react-router';
import { BackLink } from '../components/common/BackLink';
import { CategoryItemsAccordion } from '../components/common/CategoryItemsAccordion';
import { DeleteConfirmDialog } from '../components/common/DeleteConfirmDialog';
import {
  CREATED_DATE_NAME,
  IMAGE_URL_NAME,
  ITEM_IDS_NAME,
  NOTES_NAME,
  RATING_NAME,
} from '../components/common/form/constants';
import { ImageInput } from '../components/common/form/ImageInput';
import { RatingButtons } from '../components/common/form/RatingButtons';
import { SearchBar } from '../components/common/SearchBar';
import { Button } from '../components/common/ui/Button';
import { Flex } from '../components/common/ui/Flex';
import { Heading } from '../components/common/ui/Heading';
import { Text } from '../components/common/ui/Text';
import { TextArea } from '../components/common/ui/TextArea';
import { TextField } from '../components/common/ui/TextField';
import { useItemSearch } from '../hooks/useItemSearch';
import type { OutfitRating } from '../types/outfit';
import { formatDate } from '../utils/dateFormatter';
import { getOutfitById, loadItems, removeOutfit, updateOutfit } from '../utils/storageCommands';
import { getCurrentUserId } from '../utils/supabase';
import { dataUrlToBlob, uploadOutfitPhoto } from '../utils/supabaseStorage';
import styles from './EditOutfitPage.module.css';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  if (!id) {
    return { outfit: null, items: [] };
  }

  const [outfit, items] = await Promise.all([getOutfitById(id), loadItems()]);

  return { outfit, items };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  if (!id) {
    return { error: 'Outfit ID is required' };
  }

  const formData = await request.formData();
  const imageUrl = formData.get(IMAGE_URL_NAME) as string;
  const createdDate = formData.get(CREATED_DATE_NAME) as string;
  const notes = formData.get(NOTES_NAME) as string;
  const rating = formData.get(RATING_NAME) as string;
  const itemIds = formData.get(ITEM_IDS_NAME) as string;

  try {
    // Handle photo: upload if new, omit from update if unchanged
    const updates: Parameters<typeof updateOutfit>[1] = {
      createdAt: new Date(createdDate),
      notes: notes.trim() || undefined,
      rating: rating ? (Number.parseInt(rating, 10) as OutfitRating) : undefined,
      itemIds: JSON.parse(itemIds),
    };

    if (imageUrl?.startsWith('data:')) {
      const userId = await getCurrentUserId();
      const blob = dataUrlToBlob(imageUrl);
      const storagePath = await uploadOutfitPhoto(userId, id, blob);
      updates.photo = storagePath;
    }
    // If image unchanged (signed URL), don't update photo — DB value is preserved

    await updateOutfit(id, updates);

    return redirect(`/outfit/${id}`);
  } catch (error) {
    console.error('Failed to update outfit:', error);
    return { error: 'Failed to update outfit. Please try again.' };
  }
}

// TODO maybe handle delete differently using a form action instead

export function EditOutfitPage() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { outfit, items } = useLoaderData<typeof loader>();
  const { searchQuery, setSearchQuery, clearSearch, filteredItems } = useItemSearch(items);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(outfit?.itemIds || []));
  const [isDeleting, setIsDeleting] = useState(false);

  const isSubmitting = navigation.state === 'submitting';
  const isLoading = navigation.state === 'loading';

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

  // Memoize the JSON string to avoid unnecessary re-renders
  const itemIdsJson = useMemo(() => JSON.stringify(Array.from(selectedItems)), [selectedItems]);

  const handleDelete = async () => {
    if (!outfit?.id) return;

    setIsDeleting(true);
    try {
      await removeOutfit(outfit.id);
      navigate('/outfits');
    } catch (error) {
      console.error('Failed to delete outfit:', error);
      alert('Failed to delete outfit. Please try again.');
      setIsDeleting(false);
    }
  };

  if (!outfit) {
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
    <section className={styles.container}>
      <div className={styles.header}>
        <BackLink to={`/outfit/${outfit.id}`} />
        <Heading size="6">Edit Outfit</Heading>
        <DeleteConfirmDialog
          title="Delete Outfit"
          description="Are you sure you want to delete this outfit? This action cannot be undone."
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          triggerButton={
            <Button variant="destructive">
              <IoTrashOutline />
            </Button>
          }
        />
      </div>

      <Form method="post" className={styles.form}>
        <ImageInput originalImageUrl={outfit.photo} />

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="bold">
            Purchase Date
          </Text>
          <TextField.Root size="3">
            <TextField.Input
              name={CREATED_DATE_NAME}
              type="date"
              defaultValue={outfit.createdAt ? formatDate(outfit.createdAt) : ''}
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
            placeholder="e.g., too warm, uncomfortable"
            rows={2}
            defaultValue={outfit.notes || ''}
            size="3"
          />
        </Flex>

        <Flex direction="column" gap="2">
          <Text size="2" weight="bold">
            Rating
          </Text>
          <RatingButtons name={RATING_NAME} defaultValue={outfit.rating} />
        </Flex>

        <div className={styles.itemsSection}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearSearch}
            resultCount={filteredItems.length}
          />

          <CategoryItemsAccordion
            items={filteredItems}
            selectedItems={selectedItems}
            onToggleSelection={toggleItemSelection}
          />
        </div>

        {/* Hidden input to include selected items in form submission */}
        <input type="hidden" name={ITEM_IDS_NAME} value={itemIdsJson} />

        <Button type="submit" disabled={isSubmitting || isLoading || selectedItems.size === 0}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </Form>
    </section>
  );
}
