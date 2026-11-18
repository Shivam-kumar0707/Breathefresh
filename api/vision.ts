import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import { callGroq, GROQ_CONFIG } from './_lib/groq';
import { VisionOutputSchema } from './_lib/schemas';
import { checkRateLimit, getClientIp } from './_lib/rateLimit';

const VisionInputSchema = z.object({
  imageBase64: z.string().min(10).max(2800000), // ~2MB raw image
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

  // Rate limit: 10 room scan requests per minute per IP
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp, 10, 60000);
  if (!rateCheck.allowed) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Retry-After', String(rateCheck.resetInSec));
    res.end(JSON.stringify({ error: 'Too many image scan requests. Please wait a moment.', retryAfter: rateCheck.resetInSec }));
    return;
  }

  let bodyData: unknown = req.body;
  if (!bodyData) {
    bodyData = await new Promise((resolve) => {
      let data = '';
      let isTooLarge = false;
      req.on('data', (chunk) => {
        data += chunk;
        if (data.length > 3000000) {
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
    res.end(JSON.stringify({ error: 'Image too large (max 2 MB)' }));
    return;
  }

  const parsed = VisionInputSchema.safeParse(bodyData);
  if (!parsed.success) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid vision payload', details: parsed.error.format() }));
    return;
  }

  // Graceful fallback if vision model is unavailable or key is not provided
  const fallbackVisionResponse = {
    roomType: 'Living Area / Bedroom',
    issues: [
      {
        type: 'Door & Window Gap Infiltration',
        severity: 'moderate' as const,
        note: 'Visible gaps under doors allow ambient outdoor PM2.5 to bypass closed windows.',
      },
      {
        type: 'Purifier Obstruction',
        severity: 'low' as const,
        note: 'Purifiers placed tight against a wall or heavy curtains suffer reduced intake airflow.',
      },
    ],
    purifierSpot: 'Place the purifier 1.5–2 feet away from walls, centrally located in the breathing zone.',
    ventilationNotes: 'Keep windows latched tight during morning inversion hours; open for 15 mins around 2 PM.',
    suggestedActionIds: ['seal_gaps', 'purifier_bedroom', 'ventilate_best_window_only'],
  };

  if (!GROQ_CONFIG.apiKey) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(fallbackVisionResponse));
    return;
  }

  try {
    const groqRes = await callGroq({
      model: GROQ_CONFIG.modelVision,
      messages: [
        {
          role: 'system',
          content:
            'You are BreatheFresh Room Scan. Analyze room photos for indoor air pollution factors (open doors, windows facing traffic, gas stoves, air purifier placement, unsealed frames). Return a valid JSON object matching: {"roomType": string, "issues": [{"type": string, "severity": "low"|"moderate"|"high", "note": string}], "purifierSpot": string, "ventilationNotes": string, "suggestedActionIds": string[]}. Choose suggestedActionIds only from: seal_gaps, purifier_bedroom, purifier_living, ventilate_best_window_only, cook_with_hood_or_window, wet_mop, diy_corsi_box.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this room photo for air quality and purifier placement.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${parsed.data.imageBase64}`,
              },
            },
          ] as unknown as string,
        },
      ],
      json: true,
      maxTokens: 800,
    });

    if (!groqRes.ok) {
      throw new Error(`Vision API returned ${groqRes.status}`);
    }

    const groqJson = await groqRes.json();
    const rawContent = groqJson.choices?.[0]?.message?.content || '{}';
    const parsedVision = VisionOutputSchema.parse(JSON.parse(rawContent));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(parsedVision));
  } catch (err) {
    console.warn('Vision analysis failed, returning rule-based recommendation:', err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(fallbackVisionResponse));
  }
}
