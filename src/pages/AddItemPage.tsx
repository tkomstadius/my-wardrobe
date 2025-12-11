import { ArrowLeftIcon, CameraIcon } from "@radix-ui/react-icons";
import { Button, Callout, Select, TextField } from "@radix-ui/themes";
import {
  Form,
  useNavigate,
  useNavigation,
  useActionData,
  redirect,
  type ActionFunctionArgs,
} from "react-router";
import { useWardrobe } from "../contexts/WardrobeContext";
import { useImageUpload } from "../hooks/useImageUpload";
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
import { CATEGORIES } from "../utils/categories";
import styles from "./AddItemPage.module.css";

type ActionData = {
  error?: string;
};

export async function clientAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const imageUrl = formData.get("imageUrl") as string;
  const brand = formData.get("brand") as string;
  const category = formData.get("category") as ItemCategory;
  const notes = formData.get("notes") as string;
  const price = formData.get("price") as string;
  const purchaseDate = formData.get("purchaseDate") as string;
  const initialWearCount = formData.get("initialWearCount") as string;
  const trait = formData.get("trait") as string;
  const isSecondHand = formData.get("isSecondHand") === "on";
  const isDogCasual = formData.get("isDogCasual") === "on";
  const isHandmade = formData.get("isHandmade") === "on";

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

    return redirect(`/category/${category}`);
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
  const { imagePreview, handleImageUpload } = useImageUpload();

  const isSubmitting = navigation.state === "submitting";
  const isLoading = navigation.state === "loading";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeftIcon />
        </Button>
        <h2 className={styles.title}>Add Item</h2>
        <div className={styles.spacer} />
      </div>

      <Form method="post" className={styles.form}>
        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Item preview"
                className={styles.previewImage}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <p>No image selected</p>
              </div>
            )}

            <label htmlFor="image-upload" className={styles.cameraButton}>
              <CameraIcon width={24} height={24} />
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className={styles.fileInput}
            />
            {/* Hidden field to store image data */}
            <input type="hidden" name="imageUrl" value={imagePreview || ""} />
          </div>
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <span className={styles.label}>Brand (Optional)</span>
            <TextField.Root
              name="brand"
              placeholder="e.g., Ganni, Hope"
              list="brand-suggestions"
              size="3"
            />
            <datalist id="brand-suggestions">
              {getAllBrands().map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Category</span>
            <Select.Root name="category" size="3">
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
            <span className={styles.label}>Price</span>
            <TextField.Root
              name="price"
              type="number"
              placeholder="e.g., 49.99"
              size="3"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Purchase Date</span>
            <TextField.Root name="purchaseDate" type="date" size="3" />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Initial Wear Count</span>
            <TextField.Root
              name="initialWearCount"
              type="number"
              placeholder="0"
              size="3"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Item Trait (Optional)</span>
            <Select.Root name="trait" defaultValue="none" size="3">
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
            placeholder="e.g., T-shirt, favorite jeans, scratched"
            size="3"
          />
        </div>

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
