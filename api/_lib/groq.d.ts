/**
 * Groq Models & Server Environment Configuration
 * Model IDs read strictly from environment variables.
 */
export declare const GROQ_CONFIG: {
    apiKey: string;
    modelMain: string;
    modelFast: string;
    modelVision: string;
    allowedOrigin: string;
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
export declare function callGroq({ model, messages, json, stream, maxTokens, temperature, }: CallGroqParams): Promise<Response>;
