import 'server-only';

import { getGeminiModel } from '@/lib/ai/gemini-client';
import { hasGeminiAgent } from '@/lib/ai/gemini-agent';

export async function analyzeAttachmentImage(params: {
  mimeType: string;
  base64: string;
  jobTitle?: string;
}): Promise<{ summary: string; scopeNotes: string; lineItemSuggestions: string[] } | null> {
  if (!hasGeminiAgent()) {
    return null;
  }

  const model = getGeminiModel();
  const prompt = `You are a landscaping operations assistant. Analyze this job-site photo for scope planning.
Job: ${params.jobTitle ?? 'Unknown job'}
Return JSON only with keys: summary (1-2 sentences), scopeNotes (bullet-style plain text for the job record), lineItemSuggestions (array of short estimate line descriptions).`;

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: params.mimeType,
              data: params.base64,
            },
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.3 },
  });

  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      summary: text.slice(0, 280),
      scopeNotes: text,
      lineItemSuggestions: [],
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      summary?: string;
      scopeNotes?: string;
      lineItemSuggestions?: string[];
    };
    return {
      summary: String(parsed.summary ?? text.slice(0, 280)),
      scopeNotes: String(parsed.scopeNotes ?? parsed.summary ?? text),
      lineItemSuggestions: Array.isArray(parsed.lineItemSuggestions)
        ? parsed.lineItemSuggestions.map(String)
        : [],
    };
  } catch {
    return {
      summary: text.slice(0, 280),
      scopeNotes: text,
      lineItemSuggestions: [],
    };
  }
}
