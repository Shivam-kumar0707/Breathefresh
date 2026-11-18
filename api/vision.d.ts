import type { IncomingMessage, ServerResponse } from 'http';
/**
 * Serverless API handler for /api/vision.
 * Performs multimodal room scan analysis using Llama 4 Scout on Groq.
 * Detects indoor pollution hazards (unvented gas burners, incense, open windows, smoking)
 * and recommends targeted actions from the Impact Engine catalog.
 *
 * @param req - Incoming HTTP request with base64-encoded JPEG/PNG image.
 * @param res - Outgoing server response with structured findings, room type, and suggested action IDs.
 */
export default function handler(req: IncomingMessage & {
    body?: unknown;
}, res: ServerResponse): Promise<void>;
