import { useLoaderData } from 'react-router';
import { Heading } from '../components/common/ui/Heading';
import { Text } from '../components/common/ui/Text';
import { WearCalendar } from '../components/common/WearCalendar';
import { loadItems, loadOutfits } from '../utils/storageCommands';
import styles from './CalendarPage.module.css';

export async function loader() {
  const [items, outfits] = await Promise.all([loadItems(), loadOutfits()]);
  return { items, outfits };
}

export function CalendarPage() {
  const { items, outfits } = useLoaderData<typeof loader>();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Heading size="6">Calendar</Heading>
        <Text size="2" color="gray">
          What you wore, day by day
        </Text>
      </div>
      <WearCalendar items={items} outfits={outfits} />
    </div>
  );
}
