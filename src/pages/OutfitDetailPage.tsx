import { ArrowLeftIcon, TrashIcon } from '@radix-ui/react-icons';
import { AlertDialog, Button, Flex, Heading, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useOutfit } from '../contexts/OutfitContext';
import { useWardrobe } from '../contexts/WardrobeContext';
import { formatDate } from '../utils/dateFormatter';
import styles from './OutfitDetailPage.module.css';

export function OutfitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOutfitById, deleteOutfit } = useOutfit();
  const { getItemById } = useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);

  const outfit = id ? getOutfitById(id) : null;

  if (!outfit) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <Heading size="5">Outfit not found</Heading>
          <Button onClick={() => navigate('/outfits')} variant="soft">
            Back to Outfits
          </Button>
        </div>
      </div>
    );
  }

  const outfitItems = outfit.itemIds
    .map((itemId) => getItemById(itemId))
    .filter((item): item is NonNullable<typeof item> => item !== undefined);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteOutfit(outfit.id);
      navigate('/outfits');
    } catch (error) {
      console.error('Failed to delete outfit:', error);
      alert('Failed to delete outfit. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/outfits')}>
          <ArrowLeftIcon /> Back
        </Button>

        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <Button variant="soft" color="red">
              <TrashIcon /> Delete
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content maxWidth="450px">
            <AlertDialog.Title>Delete Outfit</AlertDialog.Title>
            <AlertDialog.Description size="2">
              Are you sure you want to delete this outfit? This action cannot be undone.
              <br />
              <Text size="1" color="gray" style={{ marginTop: '0.5rem', display: 'block' }}>
                Note: Item wear counts will not be decreased.
              </Text>
            </AlertDialog.Description>

            <Flex gap="3" mt="4" justify="end">
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button variant="solid" color="red" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete Outfit'}
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </header>

      <div className={styles.content}>
        {/* Outfit Photo */}
        {outfit.photo && (
          <div className={styles.outfitPhoto}>
            <img src={outfit.photo} alt="Outfit" />
          </div>
        )}

        {/* Outfit Info */}
        <section className={styles.infoSection}>
          <Heading size="6">{formatDate(outfit.wornDate)}</Heading>

          <div className={styles.metadata}>
            <div className={styles.metadataItem}>
              <Text size="2" color="gray">
                Date Worn
              </Text>
              <Text size="3" weight="bold">
                {formatDate(outfit.wornDate)}
              </Text>
            </div>

            <div className={styles.metadataItem}>
              <Text size="2" color="gray">
                Items
              </Text>
              <Text size="3" weight="bold">
                {outfit.itemIds.length}
              </Text>
            </div>
          </div>

          {outfit.notes && (
            <div className={styles.notes}>
              <Text size="2" color="gray">
                Notes
              </Text>
              <Text size="2">{outfit.notes}</Text>
            </div>
          )}
        </section>

        {/* Items in Outfit */}
        <section className={styles.itemsSection}>
          <Heading size="4">Items in this Outfit</Heading>

          {outfitItems.length === 0 ? (
            <div className={styles.emptyState}>
              <Text color="gray">No items found in this outfit</Text>
            </div>
          ) : (
            <div className={styles.itemsGrid}>
              {outfitItems.map((item) => (
                <div
                  key={item.id}
                  className={styles.itemCard}
                  onClick={() => navigate(`/edit-item/${item.id}`)}
                >
                  <div className={styles.itemImage}>
                    <img src={item.imageUrl} alt={item.notes || 'Item'} />
                  </div>
                  <div className={styles.itemInfo}>
                    <Text size="2" weight="bold">
                      {item.notes || item.brand || 'Unnamed'}
                    </Text>
                    {item.brand && item.notes && (
                      <Text size="1" color="gray">
                        {item.brand}
                      </Text>
                    )}
                    <Text size="1" color="gray">
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

