import { useLoaderData } from 'react-router-dom'
import { Text } from '../components/common/ui/Text'
import { loadItems } from '../utils/storageCommands'
import styles from './SettingsPage.module.css'

export async function loader() {
  const items = await loadItems()
  return { itemCount: items.length }
}

export function SettingsPage() {
  const { itemCount } = useLoaderData<typeof loader>()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Settings</h2>
      </div>

      <Text size="2" color="gray">
        {itemCount} items in wardrobe
      </Text>
    </div>
  )
}
