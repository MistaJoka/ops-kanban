import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/ai/gemini-client';
import { OPERATIONAL_COPILOT_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { loadAiContext } from '@/lib/ai/context-loader';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { command, context } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Missing command.' }, { status: 400 });
    }

    const loadedContext = await loadAiContext(context);
    const model = getGeminiModel();

    const prompt = `
${OPERATIONAL_COPILOT_SYSTEM_PROMPT}

Current context:
${JSON.stringify(loadedContext, null, 2)}

User command:
${command}

Return a concise operational response. If an action is needed, describe the intended tool call in JSON.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ message: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI command error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
