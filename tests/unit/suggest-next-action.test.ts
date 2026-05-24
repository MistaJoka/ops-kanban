import { describe, expect, it } from 'vitest';

import { staticNextActionSuggestion } from '@/lib/ai/suggest-next-action';

describe('UNIT-AI suggestNextAction', () => {
  it('UNIT-AI-SNA-001: static fallback for estimating', () => {
    expect(staticNextActionSuggestion('estimating')).toContain('estimate');
  });

  it('UNIT-AI-SNA-002: static fallback for scheduled', () => {
    expect(staticNextActionSuggestion('scheduled')).toContain('crew');
  });

  it('UNIT-AI-SNA-003: static fallback default', () => {
    expect(staticNextActionSuggestion('inquiry')).toContain('follow-up');
  });
});
