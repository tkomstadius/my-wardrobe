import { removeBackgroundFromApi } from './aiApi';

export async function removeImageBackground(dataURL: string): Promise<string> {
  try {
    return await removeBackgroundFromApi(dataURL);
  } catch (error) {
    console.error('Failed to remove background:', error);
    throw new Error('Failed to remove background from image');
  }
}
