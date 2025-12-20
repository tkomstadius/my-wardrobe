// Background removal utilities
// Uses @imgly/background-removal to remove backgrounds from images

import { removeBackground } from "@imgly/background-removal";

/**
 * Remove background from an image data URL
 * @param dataURL - Base64 data URL of the image
 * @returns Data URL with transparent background (PNG format)
 */
export async function removeImageBackground(dataURL: string): Promise<string> {
  try {
    // Convert data URL to Blob for the library
    const response = await fetch(dataURL);
    const blob = await response.blob();

    // Remove background - returns a Blob with transparent background
    const blobWithoutBackground = await removeBackground(blob);

    // Convert Blob back to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blobWithoutBackground);
    });
  } catch (error) {
    console.error("Failed to remove background:", error);
    throw new Error("Failed to remove background from image");
  }
}
