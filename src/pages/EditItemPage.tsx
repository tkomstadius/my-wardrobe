import { ArrowLeftIcon, TrashIcon } from "@radix-ui/react-icons";
import { Button, Callout, Select, Text, TextField } from "@radix-ui/themes";
import { useState, useEffect } from "react";
import {
  Form,
  redirect,
  useLoaderData,
  useNavigate,
  useNavigation,
  useActionData,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import { useWardrobe } from "../contexts/WardrobeContext";
import { DeleteConfirmDialog } from "../components/common/DeleteConfirmDialog";
import { CheckboxField } from "../components/common/CheckboxField";
import { getImageEmbedding } from "../utils/aiEmbedding";
import {
  loadItemById,
  saveItem,
  deleteItem as deleteItemFromDB,
} from "../utils/indexedDB";
import type { ItemCategory, ItemTrait, WardrobeItem } from "../types/wardrobe";
import {
  CATEGORIES,
  CATEGORY_IDS,
  getSubCategoriesForCategory,
} from "../utils/categories";
import styles from "./EditItemPage.module.css";
import { ImageInput } from "../components/common/form/ImageInput";

type LoaderData = {
  item: WardrobeItem | null;
};

type ActionData = {
  error?: string;
};

export async function clientLoader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  if (!id) {
    return { item: null };
  }

  const item = await loadItemById(id);
  return { item };
}

export async function clientAction({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  if (!id) {
    return { error: "Item ID is required" };
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Handle delete action
  if (intent === "delete") {
    try {
      await deleteItemFromDB(id);
      return redirect("/");
    } catch (err) {
      console.error("Failed to delete item:", err);
      return { error: "Failed to delete item. Please try again." };
    }
  }

  // Handle update action
  const imageUrl = formData.get("imageUrl") as string;
  const originalImageUrl = formData.get("originalImageUrl") as string;
  const brand = formData.get("brand") as string;
  const category = formData.get("category") as ItemCategory;
  const subCategory = formData.get("subCategory") as string;
  const notes = formData.get("notes") as string;
  const price = formData.get("price") as string;
  const purchaseDate = formData.get("purchaseDate") as string;
  const initialWearCount = formData.get("initialWearCount") as string;
  const wearHistoryLength = formData.get("wearHistoryLength") as string;
  const trait = formData.get("trait") as string;
  const isSecondHand = formData.get("isSecondHand") === "on";
  const isDogCasual = formData.get("isDogCasual") === "on";
  const isHandmade = formData.get("isHandmade") === "on";

  if (!imageUrl) {
    return { error: "Please add an image of the item" };
  }

  if (!category || !CATEGORY_IDS.includes(category)) {
    return { error: "Please select a valid category" };
  }

  try {
    // Load the existing item
    const existingItem = await loadItemById(id);
    if (!existingItem) {
      return { error: "Item not found" };
    }

    // Regenerate embedding if image has changed
    let embedding = existingItem.embedding;
    if (originalImageUrl && imageUrl !== originalImageUrl) {
      try {
        embedding = await getImageEmbedding(imageUrl);
      } catch (error) {
        console.error("Failed to generate embedding:", error);
        // Continue without updating embedding
      }
    }

    const newInitialWearCount = initialWearCount
      ? Number.parseInt(initialWearCount, 10)
      : 0;

    const historyLength = wearHistoryLength
      ? Number.parseInt(wearHistoryLength, 10)
      : 0;

    const totalWearCount = newInitialWearCount + historyLength;

    const updatedItem: WardrobeItem = {
      ...existingItem,
      imageUrl,
      notes: notes?.trim() || undefined,
      brand: brand?.trim() || undefined,
      category,
      subCategory: subCategory?.trim() || undefined,
      price: price ? Number.parseFloat(price) : undefined,
      isSecondHand,
      isDogCasual,
      isHandmade,
      trait: trait === "none" || !trait ? undefined : (trait as ItemTrait),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      initialWearCount: newInitialWearCount,
      wearCount: totalWearCount,
      embedding,
      updatedAt: new Date(),
    };

    await saveItem(updatedItem);

    return redirect(`/item/${existingItem.id}`);
  } catch (err) {
    console.error("Failed to update item:", err);
    return { error: "Failed to save changes. Please try again." };
  }
}

export function EditItemPage() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { item } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const { getAllBrands, incrementWearCount } = useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>(
    item?.category || "tops"
  );

  const isSubmitting = navigation.state === "submitting";

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
      : "";

  const validCategory =
    item && CATEGORY_IDS.includes(item.category) ? item.category : "tops";

  const handleMarkAsWorn = async () => {
    if (!item) return;

    try {
      await incrementWearCount(item.id);
      // Force a reload to update the wear count
      navigate(".", { replace: true });
    } catch (err) {
      console.error("Failed to increment wear count:", err);
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    setIsDeleting(true);
    try {
      await deleteItemFromDB(item.id);
      navigate("/");
    } catch (err) {
      console.error("Failed to delete item:", err);
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeftIcon />
          Back
        </Button>
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
        <Form method="post" className={styles.form}>
          <ImageInput originalImageUrl={item.imageUrl} />

          {/* Category Warning */}
          {categoryWarning && (
            <Callout.Root color="orange" size="1">
              <Callout.Text>{categoryWarning}</Callout.Text>
            </Callout.Root>
          )}

          {/* Form Fields */}
          <div className={styles.fields}>
            <div className={styles.field}>
              <span className={styles.label}>Brand (Optional)</span>
              <TextField.Root
                name="brand"
                placeholder="e.g., Ganni, Hope"
                defaultValue={item.brand || ""}
                list="brand-suggestions-edit"
                size="3"
              />
              <datalist id="brand-suggestions-edit">
                {getAllBrands().map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Category</span>
              <Select.Root
                name="category"
                defaultValue={validCategory}
                size="3"
                onValueChange={(value) =>
                  setSelectedCategory(value as ItemCategory)
                }
              >
                <Select.Trigger placeholder="Select category" />
                <Select.Content>
                  {CATEGORIES.map((category) => (
                    <Select.Item key={category.id} value={category.id}>
                      {category.title}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Sub category (Optional)</span>
              <Select.Root
                name="subCategory"
                defaultValue={item.subCategory || undefined}
                size="3"
              >
                <Select.Trigger placeholder="Select subcategory" />
                <Select.Content>
                  {availableSubCategories.map((subCategory) => (
                    <Select.Item key={subCategory} value={subCategory}>
                      {subCategory}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Price</span>
              <TextField.Root
                name="price"
                type="text"
                placeholder="e.g., 49.99"
                defaultValue={item.price?.toString() || ""}
                size="3"
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Purchase Date</span>
              <TextField.Root
                name="purchaseDate"
                type="date"
                defaultValue={
                  item.purchaseDate
                    ? new Date(item.purchaseDate).toISOString().split("T")[0]
                    : ""
                }
                size="3"
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>
                Initial Wear Count (before adding to app)
              </span>
              <TextField.Root
                name="initialWearCount"
                type="number"
                placeholder="0"
                defaultValue={(item.initialWearCount ?? 0).toString()}
                size="3"
              />
              <Text size="1" color="gray" className={styles.helpText}>
                Use this for items you already owned. Leave at 0 for new items.
              </Text>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Total Wear Count</span>
              <div className={styles.wearCountContainer}>
                <TextField.Root
                  type="number"
                  value={item.wearCount.toString()}
                  size="3"
                  className={styles.wearCountInput}
                  disabled
                  readOnly
                />
                <Button
                  type="button"
                  variant="soft"
                  size="3"
                  onClick={handleMarkAsWorn}
                  className={styles.markWornButton}
                >
                  Mark as Worn
                </Button>
              </div>
              <Text size="1" color="gray" className={styles.helpText}>
                {`${item.initialWearCount || 0} initial + ${
                  item.wearHistory?.length || 0
                } worn in app`}
              </Text>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Item Trait (Optional)</span>
              <Select.Root
                name="trait"
                defaultValue={item.trait || "none"}
                size="3"
              >
                <Select.Trigger placeholder="Select a vibe..." />
                <Select.Content>
                  <Select.Item value="none">None</Select.Item>
                  <Select.Item value="comfort">
                    Comfort (cozy, relaxed)
                  </Select.Item>
                  <Select.Item value="confidence">
                    Confidence (powerful, bold)
                  </Select.Item>
                  <Select.Item value="creative">
                    Creative (expressive, artistic)
                  </Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Notes (Optional)</span>
            <TextField.Root
              name="notes"
              placeholder="e.g., favorite jeans, scratched"
              defaultValue={item.notes || ""}
              size="3"
            />
          </div>

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

          <CheckboxField
            name="isHandmade"
            defaultChecked={item.isHandmade}
            label="Handmade"
          />

          {actionData?.error && (
            <Callout.Root color="red" size="1">
              <Callout.Text>{actionData.error}</Callout.Text>
            </Callout.Root>
          )}

          <div className={styles.actions}>
            <Button
              type="submit"
              size="3"
              disabled={isSubmitting}
              className={styles.saveButton}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>

            <DeleteConfirmDialog
              title="Delete Item"
              description="Are you sure you want to delete this item? This action cannot be undone."
              onConfirm={handleDelete}
              isDeleting={isDeleting}
              triggerButton={
                <Button type="button" color="red" variant="soft" size="3">
                  <TrashIcon />
                  Delete
                </Button>
              }
            />
          </div>
        </Form>
      )}
    </div>
  );
}
