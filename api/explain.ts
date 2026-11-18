import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import { callGroq, GROQ_CONFIG } from './_lib/groq';
import { getExplainSystemPrompt } from './_lib/prompts';
import { ExplainOutputSchema } from './_lib/schemas';

const ExplainInputSchema = z.object({
  actionId: z.string(),
  actionTitle: z.string(),
  deltas: z.object({
    deltaEiPct: z.number(),
    deltaCigEq: z.number(),
    deltaCo2eKgWeek: z.number(),
  }),
  memberContext: z.string().optional(),
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

  const parsed = ExplainInputSchema.safeParse(bodyData);
  if (!parsed.success) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid input payload' }));
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
    console.warn('Explain failed, returning local fallback explanation:', err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        explanation: `Adopting "${input.actionTitle}" reduces your household daily inhalation dose by ${Math.abs(
          input.deltas.deltaEiPct
        )}%.`,
        soWhat: 'Measurable scientific reduction in daily air pollution intake.',
      })
    );
  }
}
