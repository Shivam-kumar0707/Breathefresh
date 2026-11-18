import type { IncomingMessage, ServerResponse } from 'http';
/**
 * Serverless API handler for /api/explain.
 * Generates plain-language, non-technical explanations of specific air actions and their physical impact.
 * Validates against ExplainOutputSchema with strict fallback if Groq is unavailable.
 *
 * @param req - Incoming HTTP request with action ID, title, and quantitative deltas.
 * @param res - Outgoing server response with structured explanation and key takeaway.
 */
export default function handler(req: IncomingMessage & {
    body?: unknown;
}, res: ServerResponse): Promise<void>;
