/** Converts a downloaded image Blob into a data URL for the Responses API's input_image content. */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const contentType = blob.type || 'image/jpeg';
  return `data:${contentType};base64,${base64}`;
}
