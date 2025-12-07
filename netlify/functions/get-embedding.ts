import type { Handler, HandlerEvent } from "@netlify/functions";

interface EmbeddingRequest {
  image: string; // base64 data URL
}

interface ClarifaiResponse {
  status: {
    code: number;
    description: string;
  };
  outputs: Array<{
    data: {
      embeddings: Array<{
        vector: number[];
      }>;
    };
  }>;
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Get API token from environment (server-side, secure)
  const apiToken = process.env.CLARIFAI_TOKEN;

  if (!apiToken) {
    console.error("Missing Clarifai API token");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  try {
    // Parse request body
    const { image }: EmbeddingRequest = JSON.parse(event.body || "{}");

    if (!image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing image data" }),
      };
    }

    // Extract base64 data (remove "data:image/...;base64," prefix if present)
    let base64Data = image.includes(",") ? image.split(",")[1] : image;

    // Ensure base64 is clean (no whitespace, newlines, etc.)
    base64Data = base64Data.trim().replace(/\s/g, "");

    // Call Clarifai API
    // Using general-image-embedding model
    const response = await fetch(
      "https://api.clarifai.com/v2/users/clarifai/apps/main/models/general-image-embedding/versions/bb186755eda04f9cbb6fe32e816be104/outputs",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: [
            {
              data: {
                image: {
                  base64: base64Data,
                },
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Clarifai API error:", response.status, errorText);

      // Handle rate limiting
      if (response.status === 429) {
        return {
          statusCode: 429,
          body: JSON.stringify({
            error: "Rate limit exceeded. Please try again later.",
            details: errorText,
          }),
        };
      }

      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: `Clarifai API error: ${response.status}`,
          details: errorText,
        }),
      };
    }

    const result: ClarifaiResponse = await response.json();

    // Check if the API call was successful
    if (result.status.code !== 10000) {
      console.error("Clarifai API returned error:", result.status);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Clarifai processing error",
          details: result.status.description,
        }),
      };
    }

    // Extract embedding from response
    const embedding = result.outputs?.[0]?.data?.embeddings?.[0]?.vector;

    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      console.error("Invalid embedding in response:", result);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to extract valid embedding from response",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embedding }),
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
