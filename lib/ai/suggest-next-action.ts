import 'server-only';

import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import { getGeminiModel } from '@/lib/ai/gemini-client';
import { hasGeminiAgent } from '@/lib/ai/gemini-agent';

export function staticNextActionSuggestion(stateKey: string): string {
  if (stateKey === 'estimating') {
    return 'Finalize scope notes and draft the estimate line items.';
  }
  if (stateKey === 'scheduled') {
    return 'Confirm crew assignment and site access notes.';
  }
  if (stateKey === 'complete') {
    return 'Create the invoice draft and confirm balance due.';
  }
  return 'Review property details and set the next follow-up date.';
}

export async function suggestNextActionWithGemini(params: {
  detail: CardDetailView;
  recentComments: Array<{ body: string; createdAt: string }>;
  recentActivities: Array<{ action: string; summary: string }>;
  orgMemoryPrompt?: string | null;
}): Promise<string | null> {
  if (!hasGeminiAgent()) {
    return null;
  }

  const { detail, recentComments, recentActivities, orgMemoryPrompt } = params;
  const memoryBlock = orgMemoryPrompt ? `\nBrand voice:\n${orgMemoryPrompt}\n` : '';

  const context = {
    title: detail.title,
    stateKey: detail.stateKey,
    jobType: detail.jobType,
    nextAction: detail.nextAction,
    dueDate: detail.dueDate,
    scheduledStart: detail.scheduledStart,
    scheduledEnd: detail.scheduledEnd,
    description: detail.description?.slice(0, 500) ?? null,
    customer: detail.customer
      ? { name: detail.customer.name, address: detail.customer.address }
      : null,
    quoteTotal: detail.quoteTotal,
    checklistOpen: detail.checklist.filter((item) => !item.done).map((item) => item.text),
    recentComments: recentComments.slice(0, 5).map((c) => c.body.slice(0, 200)),
    recentActivities: recentActivities.slice(0, 5),
  };

  try {
    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a landscaping operations assistant. Propose exactly ONE next action for this job card — a single imperative sentence (≤120 chars) the office manager can paste into the "next action" field.
${memoryBlock}
Job context:
${JSON.stringify(context)}

Rules:
- Be specific to the job state and recent thread/activity when possible.
- Do not invent dates, prices, or customer details not in context.
- No quotes, markdown, or preamble — return only the next action line.`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.35, maxOutputTokens: 80 },
    });

    const text = result.response.text()?.trim();
    if (!text) {
      return null;
    }

    const line = text.split('\n')[0]?.replace(/^[-*]\s*/, '').trim();
    if (!line || line.length > 200) {
      return null;
    }

    return line;
  } catch {
    return null;
  }
}
