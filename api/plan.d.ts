import type { IncomingMessage, ServerResponse } from 'http';
/**
 * Serverless API handler for /api/plan.
 * Receives validated family air context and engine-computed action impacts, calls Groq (Qwen 3.8 / 27B)
 * with strict temperature and JSON mode, validates the response against PlanOutputSchema,
 * and falls back safely to signal fallback if Groq is unreachable, times out, or fails schema validation.
 *
 * @param req - Incoming HTTP request.
 * @param res - Outgoing server response.
 */
export default function handler(req: IncomingMessage & {
    body?: unknown;
}, res: ServerResponse): Promise<void>;
