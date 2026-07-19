const COLORS = ['black', 'white', 'navy', 'beige', 'olive', 'burgundy', 'grey'];
const PATTERNS = ['solid', 'striped', 'floral', 'checked', 'plain'];
const MATERIALS = ['cotton', 'wool', 'polyester', 'linen', 'denim'];

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)] as T;
}

export interface MetadataGenerator {
  generate(image: Blob): Promise<Record<string, unknown>>;
}

/**
 * Placeholder — returns randomized structured attributes instead of calling a real vision model.
 * Independent of descriptionGenerationService by design (separate services, separate providers
 * later), so mock output between the two isn't guaranteed to agree — a real provider analyzing
 * the same image would naturally be consistent; this mock has no shared state to be.
 */
export const mockMetadataGenerator: MetadataGenerator = {
  async generate(_image: Blob): Promise<Record<string, unknown>> {
    return {
      color: pick(COLORS),
      pattern: pick(PATTERNS),
      material: pick(MATERIALS),
      source: 'mock',
    };
  },
};

// Swap this binding for a real implementation of MetadataGenerator when ready — the orchestrator
// and every other service stay unchanged.
export const metadataGenerator: MetadataGenerator = mockMetadataGenerator;
