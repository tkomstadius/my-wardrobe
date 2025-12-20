import { ArrowLeftIcon } from "@radix-ui/react-icons";
import {
  Button,
  Callout,
  Flex,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import {
  Form,
  useNavigate,
  useNavigation,
  useActionData,
  redirect,
  type ActionFunctionArgs,
} from "react-router";
import { useState } from "react";
import { useWardrobe } from "../contexts/WardrobeContext";
import { CheckboxField } from "../components/common/CheckboxField";
import { getImageEmbedding } from "../utils/aiEmbedding";
import { saveItem } from "../utils/indexedDB";
import { generateId } from "../utils/storage";
import type {
  ItemCategory,
  ItemTrait,
  WardrobeItem,
  NewWardrobeItem,
} from "../types/wardrobe";
import { CATEGORIES, getSubCategoriesForCategory } from "../utils/categories";
import styles from "./AddItemPage.module.css";
import { TextInput } from "../components/common/form/TextInput";
import { ImageInput } from "../components/common/form/ImageInput";
import {
  BRAND_NAME,
  IMAGE_URL_NAME,
  CATEGORY_NAME,
  INITIAL_WEAR_COUNT_NAME,
  DOG_CASUAL_NAME,
  HANDMADE_NAME,
  ITEM_TRAIT_NAME,
  NOTES_NAME,
  PURCHASE_DATE_NAME,
  PRICE_NAME,
  SECOND_HAND_NAME,
  SUBCATEGORY_NAME,
} from "../components/common/form/formNames";
import { SelectInput } from "../components/common/form/SelectInput";

type ActionData = {
  error?: string;
};

export async function clientAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const imageUrl = formData.get(IMAGE_URL_NAME) as string;
  const brand = formData.get(BRAND_NAME) as string;
  const category = formData.get(CATEGORY_NAME) as ItemCategory;
  const subCategory = formData.get(SUBCATEGORY_NAME) as string;
  const price = formData.get(PRICE_NAME) as string;
  const purchaseDate = formData.get(PURCHASE_DATE_NAME) as string;
  const initialWearCount = formData.get(INITIAL_WEAR_COUNT_NAME) as string;
  const trait = formData.get(ITEM_TRAIT_NAME) as string;
  const notes = formData.get(NOTES_NAME) as string;
  const isSecondHand = formData.get(SECOND_HAND_NAME) === "on";
  const isDogCasual = formData.get(DOG_CASUAL_NAME) === "on";
  const isHandmade = formData.get(HANDMADE_NAME) === "on";

  if (!imageUrl) {
    return { error: "Please add an image of the item" };
  }

  if (!category) {
    return { error: "Please select a category" };
  }

  try {
    // Generate embedding for AI wear logging
    let embedding: number[] | undefined;

    try {
      embedding = await getImageEmbedding(imageUrl);
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      // Continue without embedding - user can generate later in Settings
    }

    const now = new Date();
    const initialCount = initialWearCount
      ? Number.parseInt(initialWearCount, 10)
      : 0;

    const newItemData: NewWardrobeItem = {
      imageUrl,
      notes: notes?.trim() ?? undefined,
      brand: brand?.trim() ?? undefined,
      category,
      subCategory: subCategory?.trim() ?? undefined,
      price: price ? Number.parseFloat(price) : undefined,
      isSecondHand,
      isDogCasual,
      isHandmade,
      trait: trait === "none" || !trait ? undefined : (trait as ItemTrait),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      initialWearCount: initialCount,
      embedding,
    };

    const item: WardrobeItem = {
      ...newItemData,
      id: generateId(),
      initialWearCount: initialCount,
      wearCount: initialCount,
      wearHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    await saveItem(item);

    return redirect(`/items/${category}`);
  } catch (err) {
    console.error("Failed to save item:", err);
    return { error: "Failed to save item. Please try again." };
  }
}

export function AddItemPage() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const actionData = useActionData<ActionData>();
  const { getAllBrands } = useWardrobe();
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | "">(
    ""
  );

  const isSubmitting = navigation.state === "submitting";
  const isLoading = navigation.state === "loading";

  const availableSubCategories = selectedCategory
    ? getSubCategoriesForCategory(selectedCategory)
    : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate("/items")}>
          <ArrowLeftIcon />
        </Button>
        <h2 className={styles.title}>Add Item</h2>
        <div className={styles.spacer} />
      </div>

      <Form method="post" className={styles.form}>
        <ImageInput />

        <TextInput
          label="Brand"
          name={BRAND_NAME}
          placeholder="e.g., Ganni, Hope"
          suggestions={getAllBrands()}
        />

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

        <TextInput label="Price" name={PRICE_NAME} placeholder="e.g., 499" />

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="bold">
            Purchase Date
          </Text>
          <TextField.Root
            variant="soft"
            name="purchaseDate"
            type="date"
            size="3"
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="bold">
            Initial Wear Count
          </Text>
          <TextField.Root
            variant="soft"
            name="initialWearCount"
            type="number"
            placeholder="0"
            size="3"
          />
        </Flex>

        <SelectInput
          label="Item Trait"
          name={ITEM_TRAIT_NAME}
          options={[
            { id: "none", title: "None" },
            { id: "comfort", title: "Comfort (cozy, relaxed)" },
            { id: "confidence", title: "Confidence (powerful, bold)" },
            { id: "creative", title: "Creative (expressive, artistic)" },
          ]}
          defaultValue="none"
        />

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

        <CheckboxField name="isSecondHand" label="Second Hand / Thrifted" />

        <CheckboxField name="isDogCasual" label="Dog casual" />

        <CheckboxField name="isHandmade" label="Handmade" />

        {actionData?.error && (
          <Callout.Root color="red" size="1">
            <Callout.Text>{actionData.error}</Callout.Text>
          </Callout.Root>
        )}

        <Button
          type="submit"
          size="3"
          className={styles.saveButton}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "Saving..." : "Save Item"}
        </Button>
      </Form>
    </div>
  );
}
