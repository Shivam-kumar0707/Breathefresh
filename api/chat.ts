import type { IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import { callGroq, GROQ_CONFIG } from './_lib/groq';
import { getChatSystemPrompt, hasRedFlagSymptoms } from './_lib/prompts';

const ChatInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(600),
    })
  ).max(6),
  contextPack: z.string(),
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

  const parsed = ChatInputSchema.safeParse(bodyData);
  if (!parsed.success) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid chat payload' }));
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
    const fallbackMsg =
      "I'm operating in zero-config offline mode. Based on your current air quality, keep your windows closed during morning smog peaks, run your indoor purifier if available, and limit strenuous outdoor workouts until the cleaner afternoon window.";
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
      throw new Error(`Groq stream failed with status ${groqRes.status}`);
    }

    // Pipe SSE stream from Groq
    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }

        try {
          const parsedChunk = JSON.parse(dataStr);
          const content = parsedChunk.choices?.[0]?.delta?.content || '';
          if (content) {
            res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
          }
        } catch {
          // ignore chunk parse errors
        }
      }
    }

    res.end();
  } catch (err) {
    console.warn('Chat stream encountered error:', err);
    res.write(
      `data: ${JSON.stringify({
        token:
          'Our AI server is momentarily busy. Please keep windows sealed and wear an N95 mask outdoors.',
      })}\n\n`
    );
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
