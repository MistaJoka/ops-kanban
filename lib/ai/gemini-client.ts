import 'server-only';

import { GoogleGenerativeAI } from '@google/generative-ai';

import { getServerEnv } from '@/lib/env/server';

export function getGeminiModel() {
  const { geminiApiKey } = getServerEnv();
  if (!geminiApiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable.');
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}
