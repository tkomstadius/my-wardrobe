import { useMemo, useState } from 'react';
import {
  type ActionFunctionArgs,
  Form,
  redirect,
  useLoaderData,
  useNavigation,
} from 'react-router';
import { BackLink } from '../components/common/BackLink';
import { CategoryItemsAccordion } from '../components/common/CategoryItemsAccordion';
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
import { addOutfit, generateId, loadItems } from '../utils/storageCommands';
import { getCurrentUserId } from '../utils/supabase';
import { dataUrlToBlob, uploadOutfitPhoto } from '../utils/supabaseStorage';
import styles from './CreateOutfitPage.module.css';

export async function loader() {
  const items = await loadItems();
  return { items };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const imageUrl = formData.get(IMAGE_URL_NAME) as string;
  const createdDate = formData.get(CREATED_DATE_NAME) as string;
  const notes = formData.get(NOTES_NAME) as string;
  const rating = formData.get(RATING_NAME) as string;
  const itemIdsJson = formData.get(ITEM_IDS_NAME) as string;

  // Parse the JSON array of item IDs
  const itemIds: string[] = itemIdsJson ? (JSON.parse(itemIdsJson) as string[]) : [];

  try {
    // Upload photo to Storage if provided
    let photoPath: string | undefined;
    if (imageUrl?.startsWith('data:')) {
      const userId = await getCurrentUserId();
      const outfitId = generateId();
      const blob = dataUrlToBlob(imageUrl);
      photoPath = await uploadOutfitPhoto(userId, outfitId, blob);
    }

    await addOutfit({
      photo: photoPath,
      createdAt: new Date(createdDate),
      notes: notes.trim() || undefined,
      rating: rating ? (Number.parseInt(rating, 10) as OutfitRating) : undefined,
      itemIds,
    });

    return redirect('/outfits');
  } catch (error) {
    console.error('Failed to save outfit:', error);
    alert('Failed to save outfit. Please try again.');
  }
}

export function CreateOutfitPage() {
  const { items } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const { searchQuery, setSearchQuery, clearSearch, filteredItems } = useItemSearch(items);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <BackLink to={'/outfits'} />
        <Heading size="6">Create Outfit</Heading>
      </div>

      <Form method="post" className={styles.form}>
        <ImageInput />

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="bold">
            Created Date
          </Text>
          <TextField.Root size="3">
            <TextField.Input defaultValue={formatDate(new Date())} name="createdDate" type="date" />
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
            size="3"
          />
        </Flex>

        <Text weight="bold" size="2" className={styles.ratingHeader}>
          Rate This Outfit
        </Text>

        <Flex direction="column" gap="2">
          <Text size="2" weight="bold">
            Rating
          </Text>
          <RatingButtons name={RATING_NAME} />
        </Flex>

        <div className={styles.divider} />

        <div>
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

        <div className={styles.stickyFooter}>
          <Button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || isLoading || selectedItems.size === 0}
          >
            {isSubmitting ? 'Creating...' : 'Create Outfit'}
          </Button>
        </div>
      </Form>
    </section>
  );
}
