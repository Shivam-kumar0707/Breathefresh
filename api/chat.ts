import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import { callGroq, GROQ_CONFIG } from './_lib/groq';
import { getChatSystemPrompt, hasRedFlagSymptoms, getDynamicChatFallback } from './_lib/prompts';
import { checkRateLimit, getClientIp } from './_lib/rateLimit';

const ChatInputSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(1000),
      })
    )
    .max(8),
  contextPack: z.string().max(3000),
  language: z.enum(['en', 'hi', 'hinglish']).default('en'),
});

/**
 * Serverless API handler for /api/chat.
 * Provides Server-Sent Events (SSE) streaming conversational answers to user smog questions.
 * Enforces medical safety rules, prompt-injection defenses, strict IP rate limiting,
 * and falls back cleanly to context-aware local generation if the external model is unavailable.
 *
 * @param req - Incoming HTTP request with conversation messages and air context.
 * @param res - Outgoing server response streaming SSE chunks.
 */
export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  res.setHeader('Access-Control-Allow-Origin', GROQ_CONFIG.allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  // Per-IP rate limiting (30 requests/minute)
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp, 30, 60000);
  if (!rateCheck.allowed) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Retry-After', String(rateCheck.resetInSec));
    res.end(
      JSON.stringify({
        error: 'Too many requests. Please wait a moment.',
        retryAfter: rateCheck.resetInSec,
      })
    );
    return;
  }

  let bodyData: unknown = req.body;
  if (!bodyData) {
    bodyData = await new Promise((resolve) => {
      let data = '';
      let isTooLarge = false;
      req.on('data', (chunk) => {
        data += chunk;
        if (data.length > 15000) {
          isTooLarge = true;
        }
      });
      req.on('end', () => {
        if (isTooLarge) {
          resolve({ __payloadTooLarge: true });
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
    });
  }

  if (bodyData && typeof bodyData === 'object' && '__payloadTooLarge' in bodyData) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Request payload too large (max 15KB)' }));
    return;
  }

  const parsed = ChatInputSchema.safeParse(bodyData);
  if (!parsed.success) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid chat payload', details: parsed.error.format() }));
    return;
  }

  const { messages, contextPack, language } = parsed.data;
  const lastUserMsg = messages[messages.length - 1]?.content || '';

  // Red-flag symptom check
  const isRedFlag = hasRedFlagSymptoms(lastUserMsg);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (isRedFlag) {
    const alertMsg =
      'CRITICAL MEDICAL ALERT: You have mentioned symptoms of severe distress (such as chest pain or severe breathlessness). Please seek immediate emergency medical care or call your local emergency service right now. Do not wait for indoor air adjustments.';
    res.write(`data: ${JSON.stringify({ token: alertMsg, isRedFlag: true })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // If no Groq key configured, stream rule-based assistant advice
  if (!GROQ_CONFIG.apiKey) {
    const fallbackMsg = getDynamicChatFallback(lastUserMsg, contextPack, language);
    res.write(`data: ${JSON.stringify({ token: fallbackMsg })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  const systemPrompt = getChatSystemPrompt(contextPack, language);
  const groqMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const groqRes = await callGroq({
      model: GROQ_CONFIG.modelFast,
      messages: groqMessages,
      stream: true,
      maxTokens: 600,
      temperature: 0.3,
    });

    if (!groqRes.ok || !groqRes.body) {
      throw new Error(`Groq returned ${groqRes.status}`);
    }

    interface StreamBodySource {
      getReader?: () => ReadableStreamDefaultReader<Uint8Array>;
      on?: (event: string, listener: (chunk: Buffer) => void) => void;
    }

    const streamBody = groqRes.body as unknown as StreamBodySource;

    if (typeof streamBody?.getReader === 'function') {
      const reader = streamBody.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const parsedChunk = JSON.parse(jsonStr);
            const deltaToken = parsedChunk.choices?.[0]?.delta?.content;
            if (deltaToken) {
              res.write(`data: ${JSON.stringify({ token: deltaToken })}\n\n`);
            }
          } catch {
            // ignore malformed SSE line
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else if (typeof streamBody?.on === 'function') {
      let streamBuffer = '';
      streamBody.on('data', (chunk: Buffer) => {
        streamBuffer += chunk.toString('utf-8');
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const parsedChunk = JSON.parse(jsonStr);
            const deltaToken = parsedChunk.choices?.[0]?.delta?.content;
            if (deltaToken) {
              res.write(`data: ${JSON.stringify({ token: deltaToken })}\n\n`);
            }
          } catch {
            // ignore malformed SSE line
          }
        }
      });

      streamBody.on('end', () => {
        res.write('data: [DONE]\n\n');
        res.end();
      });

      streamBody.on('error', (err: unknown) => {
        console.warn('Groq stream error:', err);
        res.end();
      });
    } else {
      throw new Error('Unsupported response body stream type from fetch');
    }
  } catch (err) {
    console.warn('Groq chat call failed, streaming fallback:', err);
    const errorFallback = getDynamicChatFallback(lastUserMsg, contextPack, language);
    res.write(`data: ${JSON.stringify({ token: errorFallback })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
