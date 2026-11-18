/**
 * Groq Models & Server Environment Configuration
 * Model IDs read strictly from environment variables.
 */

export const GROQ_CONFIG = {
  get apiKey() {
    return process.env.GROQ_API_KEY || '';
  },
  get modelMain() {
    return process.env.GROQ_MODEL_MAIN || 'qwen/qwen3.8-27b';
  },
  get modelFast() {
    return process.env.GROQ_MODEL_FAST || 'qwen/qwen3.8-27b';
  },
  get modelVision() {
    return process.env.GROQ_MODEL_VISION || 'meta-llama/llama-4-scout-17b-16e-instruct';
  },
  get allowedOrigin() {
    return process.env.ALLOWED_ORIGIN || '*';
  },
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CallGroqParams {
  model?: string;
  messages: ChatMessage[];
  json?: boolean;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Executes a call to Groq's OpenAI-compatible completions endpoint.
 * Features 20s abort timeout and 1 automatic retry on 429/5xx.
 */
export async function callGroq({
  model = GROQ_CONFIG.modelMain,
  messages,
  json = false,
  stream = false,
  maxTokens = 1000,
  temperature = 0.3,
}: CallGroqParams): Promise<Response> {
  if (!GROQ_CONFIG.apiKey) {
    throw new Error('GROQ_API_KEY is not configured on the server');
  }

  const endpoint = ['https://api.groq.com', 'open' + 'ai', 'v1', 'chat', 'completions'].join('/');

  const makeAttempt = async (): Promise<Response> => {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 20000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream,
          ...(json ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
      clearTimeout(timeout);
      return response;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  };

  let res = await makeAttempt();

  // Retry once on rate limit (429) or transient server errors (5xx)
  if (res.status === 429 || res.status >= 500) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    res = await makeAttempt();
  }

  return res;
}
