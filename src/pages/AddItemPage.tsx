import { useState } from 'react'
import { type ActionFunctionArgs, Form, redirect, useActionData, useLoaderData, useNavigation } from 'react-router'
import { BackLink } from '../components/common/BackLink'
import { CheckboxField } from '../components/common/CheckboxField'
import {
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
} from '../components/common/form/constants'
import { ImageInput } from '../components/common/form/ImageInput'
import { RatingButtons } from '../components/common/form/RatingButtons'
import { SelectInput } from '../components/common/form/SelectInput'
import { TextInput } from '../components/common/form/TextInput'
import { Button } from '../components/common/ui/Button'
import { Callout } from '../components/common/ui/Callout'
import { Flex } from '../components/common/ui/Flex'
import { Text } from '../components/common/ui/Text'
import { TextArea } from '../components/common/ui/TextArea'
import { TextField } from '../components/common/ui/TextField'
import type { OutfitRating } from '../types/outfit'
import type { ItemCategory, NewWardrobeItem, WardrobeItem } from '../types/wardrobe'
import { getImageEmbedding } from '../utils/aiEmbedding'
import { CATEGORIES, getSubCategoriesForCategory } from '../utils/categories'
import { generateId, getAllBrands, saveItem } from '../utils/storageCommands'
import { getCurrentUserId } from '../utils/supabase'
import { dataUrlToBlob, uploadItemImage } from '../utils/supabaseStorage'
import styles from './AddItemPage.module.css'

type ActionData = {
  error?: string
}

export async function clientLoader() {
  const brands = await getAllBrands()

  return { brands }
}

export async function clientAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  const imageUrl = formData.get(IMAGE_URL_NAME) as string
  const brand = formData.get(BRAND_NAME) as string
  const category = formData.get(CATEGORY_NAME) as ItemCategory
  const subCategory = formData.get(SUBCATEGORY_NAME) as string
  const price = formData.get(PRICE_NAME) as string
  const purchaseDate = formData.get(PURCHASE_DATE_NAME) as string
  const initialWearCount = formData.get(INITIAL_WEAR_COUNT_NAME) as string
  const notes = formData.get(NOTES_NAME) as string
  const rating = formData.get(RATING_NAME) as string
  const isSecondHand = formData.get(SECOND_HAND_NAME) === 'on'
  const isDogCasual = formData.get(DOG_CASUAL_NAME) === 'on'
  const isHandmade = formData.get(HANDMADE_NAME) === 'on'

  if (!imageUrl) {
    return { error: 'Please add an image of the item' }
  }

  if (!category) {
    return { error: 'Please select a category' }
  }

  try {
    // Generate embedding for AI wear logging
    let embedding: number[] | undefined

    try {
      embedding = await getImageEmbedding(imageUrl)
    } catch (error) {
      console.error('Failed to generate embedding:', error)
      // Continue without embedding - user can generate later in Settings
    }

    const now = new Date()
    const initialCount = initialWearCount ? Number.parseInt(initialWearCount, 10) : 0
    const id = generateId()

    // Upload image to Supabase Storage
    const userId = await getCurrentUserId()
    const blob = dataUrlToBlob(imageUrl)
    const storagePath = await uploadItemImage(userId, id, blob)

    const newItemData: NewWardrobeItem = {
      imageUrl: storagePath,
      notes: notes?.trim() ?? undefined,
      brand: brand?.trim() ?? undefined,
      category,
      subCategory: subCategory?.trim() ?? undefined,
      price: price ? Number.parseFloat(price) : undefined,
      isSecondHand,
      isDogCasual,
      isHandmade,
      rating: rating ? (Number.parseInt(rating, 10) as OutfitRating) : undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      initialWearCount: initialCount,
      embedding,
    }

    const item: WardrobeItem = {
      ...newItemData,
      id,
      initialWearCount: initialCount,
      wearCount: initialCount,
      wearHistory: [],
      createdAt: now,
      updatedAt: now,
    }

    await saveItem(item)

    return redirect(`/items/${category}`)
  } catch (err) {
    console.error('Failed to save item:', err)
    return { error: 'Failed to save item. Please try again.' }
  }
}

export function AddItemPage() {
  const navigation = useNavigation()
  const { brands } = useLoaderData<typeof clientLoader>()
  const actionData = useActionData<ActionData>()
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | ''>('')

  const isSubmitting = navigation.state === 'submitting'
  const isLoading = navigation.state === 'loading'

  const availableSubCategories = selectedCategory ? getSubCategoriesForCategory(selectedCategory) : []

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BackLink to={'/items'} />
        <h2 className={styles.title}>Add Item</h2>
        <div className={styles.spacer} />
      </div>

      <Form method="post" className={styles.form}>
        <fieldset className={styles.fieldSection}>
          <ImageInput />
        </fieldset>

        <fieldset className={styles.fieldSection}>
          <TextInput label="Brand" name={BRAND_NAME} placeholder="e.g., Ganni, Hope" suggestions={brands} />

          <SelectInput
            label="Category*"
            name={CATEGORY_NAME}
            options={CATEGORIES.map((category) => ({
              id: category.id,
              title: category.title,
            }))}
            onValueChange={(value) => setSelectedCategory(value as ItemCategory)}
          />

          <SelectInput
            label="Sub category"
            name={SUBCATEGORY_NAME}
            disabled={!selectedCategory}
            options={availableSubCategories.map((subCategory) => ({
              id: subCategory,
              title: subCategory,
            }))}
          />
        </fieldset>

        <fieldset className={styles.fieldSection}>
          <TextInput label="Price" name={PRICE_NAME} placeholder="e.g., 499" />

          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="bold">
              Purchase Date
            </Text>
            <TextField.Root size="3">
              <TextField.Input name="purchaseDate" type="date" />
            </TextField.Root>
          </Flex>

          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="bold">
              Initial Wear Count
            </Text>
            <TextField.Root size="3">
              <TextField.Input name="initialWearCount" type="number" placeholder="0" />
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
        </fieldset>

        <fieldset className={styles.fieldSection}>
          <CheckboxField name="isSecondHand" label="Second Hand / Thrifted" />
          <CheckboxField name="isDogCasual" label="Dog casual" />
          <CheckboxField name="isHandmade" label="Handmade" />
        </fieldset>

        <fieldset className={styles.fieldSection}>
          <RatingButtons name={RATING_NAME} />
        </fieldset>

        {actionData?.error && (
          <Callout.Root color="red" size="1">
            <Callout.Text>{actionData.error}</Callout.Text>
          </Callout.Root>
        )}

        <div className={styles.stickyFooter}>
          <Button type="submit" className={styles.saveButton} disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Saving...' : 'Save Item'}
          </Button>
        </div>
      </Form>
    </div>
  )
}
