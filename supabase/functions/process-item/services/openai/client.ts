import OpenAI from 'npm:openai@^4.87.0';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

if (!OPENAI_API_KEY) {
  // Don't throw at module load — let the first actual API call fail with a clear error instead,
  // so a missing key surfaces through the normal processing_status='failed' + logged-error path
  // rather than crashing the function outright.
  console.error('[openai/client] OPENAI_API_KEY is not set — AI generation calls will fail');
}

export const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
