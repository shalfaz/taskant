import { GoogleGenAI } from '@google/genai';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `You are TaskAnt Live Support, the official AI customer care assistant for TaskAnt — an on-demand micro-task and local service marketplace in Bangladesh.

Guidelines:
- Always reply naturally in the same language the user writes in (English, Bengali, or Banglish).
- Help users with:
  1. Posting tasks (title, category, location/pickup-destination, deadline, budget in BDT ৳, and optional photos).
  2. Bidding and applying as a Task Worker (viewing open tasks, submitting an offer, tracking accepted tasks).
  3. Ride Services (finding or sharing local car/bike rides).
  4. Online Store (browsing or listing items locally).
  5. Payments in BDT (৳) including demo bKash, Nagad, and Card checkout flows.
  6. Account verification badges (submitting verification details to earn a Verified badge for trust).
  7. Managing tasks (My Posted Tasks, deleting your own posted tasks, messaging, and reporting suspicious activity).
- Keep replies concise (2–4 short sentences or clean bullet points), warm, and practical.
- Never invent account-specific private data you cannot see; if an issue needs human intervention, advise contacting support@taskant.com.`;

interface HistoryMessage {
  role: 'user' | 'model';
  text: string;
}

interface SupportRequestBody {
  message?: unknown;
  history?: unknown;
}

function buildContents(rawHistory: unknown, latestMessage: string) {
  const validItems: HistoryMessage[] = Array.isArray(rawHistory)
    ? rawHistory
        .filter(
          (item): item is HistoryMessage =>
            typeof item === 'object' &&
            item !== null &&
            ((item as HistoryMessage).role === 'user' || (item as HistoryMessage).role === 'model') &&
            typeof (item as HistoryMessage).text === 'string' &&
            (item as HistoryMessage).text.trim().length > 0
        )
        .slice(-10)
    : [];

  // Enforce strict user -> model alternation starting with 'user' and ending with 'model'
  const alternating: HistoryMessage[] = [];
  for (const item of validItems) {
    const expectedRole = alternating.length % 2 === 0 ? 'user' : 'model';
    if (item.role === expectedRole) {
      alternating.push({ role: item.role, text: item.text.trim().slice(0, 1500) });
    }
  }
  if (alternating.length > 0 && alternating[alternating.length - 1].role === 'user') {
    alternating.pop();
  }

  return [
    ...alternating.map((item) => ({
      role: item.role,
      parts: [{ text: item.text }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: latestMessage.slice(0, 2000) }],
    },
  ];
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: SupportRequestBody;
  try {
    body = (await request.json()) as SupportRequestBody;
  } catch {
    return Response.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({
      reply:
        'TaskAnt Live Support is temporarily unavailable while our AI service is being configured. Please email support@taskant.com if you need immediate assistance.',
    });
  }

  const contents = buildContents(body.history, message);
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
  const config = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.5,
    maxOutputTokens: 1024,
  };

  try {
    const ai = new GoogleGenAI({ apiKey });
    let response;
    try {
      response = await ai.models.generateContent({ model, contents, config });
    } catch (firstError: unknown) {
      const firstStatus = (firstError as { status?: number })?.status;
      if (firstStatus === 400 && contents.length > 1) {
        response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: message.slice(0, 2000) }] }],
          config,
        });
      } else {
        throw firstError;
      }
    }

    const reply = response.text?.trim();
    if (!reply) {
      return Response.json({
        reply:
          'I could not generate a response just now. Could you please rephrase your question about TaskAnt?',
      });
    }

    return Response.json({ reply }, { status: 200 });
  } catch (error: unknown) {
    console.error('Gemini Support API Error:', error);
    const status = (error as { status?: number })?.status;

    if (status === 429) {
      return Response.json(
        {
          reply:
            'TaskAnt Live Support is receiving high traffic right now. Please wait a few seconds and try again!',
        },
        { status: 200 }
      );
    }

    return Response.json(
      {
        reply:
          'Sorry, I am having trouble connecting right now. Please try again in a moment or reach us at support@taskant.com.',
      },
      { status: 200 }
    );
  }
}
