import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import { callGroq, GROQ_CONFIG } from './_lib/groq';
import { getExplainSystemPrompt } from './_lib/prompts';
import { ExplainOutputSchema } from './_lib/schemas';
import { checkRateLimit, getClientIp } from './_lib/rateLimit';

const ExplainInputSchema = z.object({
  actionId: z.string().min(1).max(60),
  actionTitle: z.string().min(1).max(120),
  deltas: z.object({
    deltaEiPct: z.number(),
    deltaCigEq: z.number(),
    deltaCo2eKgWeek: z.number(),
  }),
  memberContext: z.string().max(300).optional(),
  language: z.enum(['en', 'hi', 'hinglish']).default('en'),
});

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
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

  // Rate limit: 40 explain requests per minute per IP
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp, 40, 60000);
  if (!rateCheck.allowed) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Retry-After', String(rateCheck.resetInSec));
    res.end(JSON.stringify({ error: 'Too many requests. Please wait a moment.', retryAfter: rateCheck.resetInSec }));
    return;
  }

  let bodyData: unknown = req.body;
  if (!bodyData) {
    bodyData = await new Promise((resolve) => {
      let data = '';
      let isTooLarge = false;
      req.on('data', (chunk) => {
        data += chunk;
        if (data.length > 5000) {
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
    res.end(JSON.stringify({ error: 'Request payload too large (max 5KB)' }));
    return;
  }

  const parsed = ExplainInputSchema.safeParse(bodyData);
  if (!parsed.success) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid input payload', details: parsed.error.format() }));
    return;
  }

  const input = parsed.data;

  // Offline / missing key fallback
  if (!GROQ_CONFIG.apiKey) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        explanation: `Executing "${input.actionTitle}" reduces respiratory fine-particle intake by ${Math.abs(
          input.deltas.deltaEiPct
        )}%, equivalent to cutting ${Math.abs(input.deltas.deltaCigEq)} cigarette equivalents daily.`,
        soWhat: 'Direct physics-based reduction in lung exposure for your family.',
      })
    );
    return;
  }

  const userContent = `ACTION: ${input.actionTitle} (${input.actionId})
ENGINE DELTAS:
- Exposure Index change: ${input.deltas.deltaEiPct}%
- Cigarette equivalents saved: ${input.deltas.deltaCigEq} cigs/day
- Weekly CO2e saved: ${input.deltas.deltaCo2eKgWeek} kg CO2e
CONTEXT: ${input.memberContext ?? 'General family protection'}`;

  try {
    const groqRes = await callGroq({
      model: GROQ_CONFIG.modelFast,
      messages: [
        { role: 'system', content: getExplainSystemPrompt(input.language) },
        { role: 'user', content: userContent },
      ],
      json: true,
      maxTokens: 300,
      temperature: 0.2,
    });

    if (!groqRes.ok) {
      throw new Error(`Groq returned ${groqRes.status}`);
    }

    const json = await groqRes.json();
    const parsedExplain = ExplainOutputSchema.parse(JSON.parse(json.choices?.[0]?.message?.content || '{}'));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(parsedExplain));
  } catch (err) {
    console.warn('Groq /api/explain call failed, falling back:', err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        explanation: `Executing "${input.actionTitle}" reduces fine-particle lung deposition by ${Math.abs(
          input.deltas.deltaEiPct
        )}%, saving ${Math.abs(input.deltas.deltaCigEq)} cigarettes daily.`,
        soWhat: 'Calculated directly by physical mass-balance aerosol modeling.',
      })
    );
  }
}
