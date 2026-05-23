import 'server-only';

import { SchemaType } from '@google/generative-ai';

import { getGeminiModel } from '@/lib/ai/gemini-client';

export type EstimateLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

const FALLBACK_LINE_ITEM: EstimateLineItem = {
  description: 'Site work per scope notes',
  quantity: 1,
  unitPrice: 150,
};

export async function parseEstimateLineItems(params: {
  scopeNotes: string;
  jobTitle?: string;
  revenueHint?: number;
}): Promise<{ lineItems: EstimateLineItem[]; assumptions: string[] }> {
  const notes = params.scopeNotes.trim();
  if (!notes) {
    return { lineItems: [FALLBACK_LINE_ITEM], assumptions: ['No scope notes provided — using placeholder line.'] };
  }

  try {
    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Extract landscaping estimate line items from these site visit notes.

Job: ${params.jobTitle ?? 'Property job'}
Notes:
${notes}

Return JSON only:
{
  "lineItems": [{ "description": string, "quantity": number, "unitPrice": number }],
  "assumptions": [string]
}

Rules:
- Use realistic USD prices for landscaping (mow, mulch, cleanup, haul-off, planting).
- Mark assumptions when acreage, access, or materials are unclear.
- At least one line item; max 8.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            lineItems: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  description: { type: SchemaType.STRING },
                  quantity: { type: SchemaType.NUMBER },
                  unitPrice: { type: SchemaType.NUMBER },
                },
                required: ['description', 'quantity', 'unitPrice'],
              },
            },
            assumptions: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
          required: ['lineItems', 'assumptions'],
        },
      },
    });

    const parsed = JSON.parse(result.response.text()) as {
      lineItems: EstimateLineItem[];
      assumptions: string[];
    };

    const lineItems = parsed.lineItems
      .filter((item) => item.description && item.quantity > 0 && item.unitPrice >= 0)
      .slice(0, 8);

    if (lineItems.length === 0) {
      return {
        lineItems: [
          {
            description: notes.slice(0, 120),
            quantity: 1,
            unitPrice: params.revenueHint && params.revenueHint > 0 ? params.revenueHint : 150,
          },
        ],
        assumptions: parsed.assumptions?.length ? parsed.assumptions : ['Parsed from scope notes.'],
      };
    }

    return {
      lineItems,
      assumptions: parsed.assumptions ?? [],
    };
  } catch {
    return {
      lineItems: [
        {
          description: notes.slice(0, 120),
          quantity: 1,
          unitPrice: params.revenueHint && params.revenueHint > 0 ? params.revenueHint : 150,
        },
      ],
      assumptions: ['LLM unavailable — using scope excerpt as a single line item.'],
    };
  }
}
