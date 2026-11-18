import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import { callGroq, GROQ_CONFIG } from './_lib/groq';
import { getPlanSystemPrompt } from './_lib/prompts';
import { PlanOutputSchema } from './_lib/schemas';

const PlanInputSchema = z.object({
  language: z.enum(['en', 'hi', 'hinglish']).default('en'),
  city: z.string(),
  aqiContext: z.object({
    aqi: z.number(),
    pm25: z.number(),
    category: z.string(),
    bestWindow: z.string(),
    worstWindow: z.string(),
  }),
  profileSummary: z.string(),
  applicableActions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: z.string(),
      cost: z.string(),
      deltaEiPct: z.number(),
      deltaCigEq: z.number(),
      deltaCo2eKgWeek: z.number(),
    })
  ),
  grapStage: z.string().optional(),
});

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  // CORS headers
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
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let bodyData: unknown = req.body;
  if (!bodyData) {
    bodyData = await new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
    });
  }

  const parsedInput = PlanInputSchema.safeParse(bodyData);
  if (!parsedInput.success) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid input payload', details: parsedInput.error.format() }));
    return;
  }

  const input = parsedInput.data;

  // If no Groq API Key is configured, trigger client rule-based fallback immediately
  if (!GROQ_CONFIG.apiKey) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ fallback: true, reason: 'GROQ_API_KEY missing' }));
    return;
  }

  const systemPrompt = getPlanSystemPrompt(input.language);
  const userContent = `CITY: ${input.city}
CURRENT AIR: AQI ${input.aqiContext.aqi} (${input.aqiContext.category}), PM2.5 ${input.aqiContext.pm25} µg/m³
CLEANEST WINDOW: ${input.aqiContext.bestWindow}
PEAK SMOG: ${input.aqiContext.worstWindow}
${input.grapStage ? `GRAP STAGE: ${input.grapStage}` : ''}
FAMILY PROFILE: ${input.profileSummary}

APPLICABLE ACTIONS (Choose only from these IDs):
${JSON.stringify(input.applicableActions, null, 2)}`;

  try {
    const groqRes = await callGroq({
      model: GROQ_CONFIG.modelMain,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      json: true,
      temperature: 0.3,
      maxTokens: 1200,
    });

    if (!groqRes.ok) {
      throw new Error(`Groq returned ${groqRes.status}`);
    }

    const groqJson = await groqRes.json();
    let rawContent = groqJson.choices?.[0]?.message?.content || '{}';
    rawContent = rawContent.trim();
    if (rawContent.startsWith('```json')) {
      rawContent = rawContent.slice(7);
    } else if (rawContent.startsWith('```')) {
      rawContent = rawContent.slice(3);
    }
    if (rawContent.endsWith('```')) {
      rawContent = rawContent.slice(0, -3);
    }
    rawContent = rawContent.trim();

    const parsedJson = JSON.parse(rawContent);

    // Validate with Zod
    const validatedPlan = PlanOutputSchema.parse(parsedJson);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(validatedPlan));
  } catch (err) {
    console.warn('Groq /api/plan call failed, signaling fallback:', err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ fallback: true, error: (err as Error).message }));
  }
}
