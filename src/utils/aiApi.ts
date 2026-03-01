import { Client } from '@gradio/client';

const SPACE_ID = 'stadiljus/wardrobe-ai';

let clientPromise: Promise<Client> | null = null;

function getClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = Client.connect(SPACE_ID).catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

async function callApi(endpoint: string, input: string): Promise<unknown> {
  const client = await getClient();
  const job = client.submit(endpoint, [input]);
  for await (const msg of job) {
    if (msg.type === 'data') {
      return (msg.data as unknown[])[0];
    }
  }
  throw new Error(`No data received from ${endpoint}`);
}

export async function getEmbeddingFromApi(imageDataUrl: string): Promise<number[]> {
  return callApi('/embed', imageDataUrl) as Promise<number[]>;
}

export async function removeBackgroundFromApi(imageDataUrl: string): Promise<string> {
  return callApi('/remove-bg', imageDataUrl) as Promise<string>;
}
