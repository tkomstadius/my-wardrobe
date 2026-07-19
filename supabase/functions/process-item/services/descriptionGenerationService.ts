const COLORS = ['black', 'white', 'navy', 'beige', 'olive', 'burgundy', 'grey'];
const PATTERNS = ['solid', 'striped', 'floral', 'checked', 'plain'];
const MATERIALS = ['cotton', 'wool', 'polyester', 'linen', 'denim'];

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)] as T;
}

export interface DescriptionGenerator {
  generate(image: Blob): Promise<string>;
}

/** Placeholder — returns a randomized sentence instead of calling a real vision model. */
export const mockDescriptionGenerator: DescriptionGenerator = {
  async generate(_image: Blob): Promise<string> {
    const color = pick(COLORS);
    const pattern = pick(PATTERNS);
    const material = pick(MATERIALS);
    return `A ${pattern} ${color} item made of ${material}. (mock description — no AI provider configured yet)`;
  },
};

// Swap this binding for a real implementation of DescriptionGenerator (e.g. an OpenAI vision
// call) when ready — the orchestrator and every other service stay unchanged.
export const descriptionGenerator: DescriptionGenerator = mockDescriptionGenerator;
