import type { PixelCrop } from "react-image-crop";

/**
 * Creates a cropped image from the source image and crop area
 * Returns the cropped image as a base64 data URL
 */
export async function getCroppedImage(
  imageSrc: string,
  crop: PixelCrop,
  imgElement: HTMLImageElement
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Calculate the scale between displayed image and natural (original) image
  // crop coordinates are relative to the displayed image size (imgElement)
  const scaleX = image.naturalWidth / imgElement.width;
  const scaleY = image.naturalHeight / imgElement.height;

  // Set canvas to the size of the cropped area (in natural image dimensions)
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  ctx.imageSmoothingQuality = "high";

  // Calculate crop coordinates on the natural image
  const sourceX = crop.x * scaleX;
  const sourceY = crop.y * scaleY;
  const sourceWidth = crop.width * scaleX;
  const sourceHeight = crop.height * scaleY;

  // Draw the cropped portion of the image
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Convert canvas to blob and then to data URL
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create blob from canvas"));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      0.95
    );
  });
}

/**
 * Helper function to create an image element from a data URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}
