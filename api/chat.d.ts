import type { IncomingMessage, ServerResponse } from 'http';
/**
 * Serverless API handler for /api/chat.
 * Provides Server-Sent Events (SSE) streaming conversational answers to user smog questions.
 * Enforces medical safety rules, prompt-injection defenses, strict IP rate limiting,
 * and falls back cleanly to context-aware local generation if the external model is unavailable.
 *
 * @param req - Incoming HTTP request with conversation messages and air context.
 * @param res - Outgoing server response streaming SSE chunks.
 */
export default function handler(req: IncomingMessage & {
    body?: unknown;
}, res: ServerResponse): Promise<void>;
