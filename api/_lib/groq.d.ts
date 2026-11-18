/**
 * Groq Models & Server Environment Configuration
 *
 * SECURITY NOTICE:
 * - This module executes strictly in Node.js serverless functions (api/).
 * - Never import this file into the client-side bundle (src/).
 * - GROQ_API_KEY is read strictly from process.env and never exposed to the client.
 * - Set ALLOWED_ORIGIN in production environment variables to lock down CORS.
 */
export declare const GROQ_CONFIG: {
    readonly apiKey: string;
    readonly modelMain: string;
    readonly modelFast: string;
    readonly modelVision: string;
    readonly allowedOrigin: string;
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
 * Executes an HTTP call to Groq's completions endpoint.
 * Features 20s abort timeout and 1 automatic retry on 429/5xx responses.
 *
 * @param params - Call configuration including model ID, messages array, JSON mode flag, and token limits.
 * @returns Standard fetch Response object.
 */
export declare function callGroq({ model, messages, json, stream, maxTokens, temperature, }: CallGroqParams): Promise<Response>;
