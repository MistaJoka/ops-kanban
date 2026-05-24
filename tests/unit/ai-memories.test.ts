import { describe, expect, it, vi } from 'vitest';

import {
  assertAllowedMemoryKey,
  loadOrgAiMemoriesForPrompt,
  setOrgAiMemory,
} from '@/lib/domain/ai/memories';

describe('UNIT-AI ai_memories', () => {
  it('UNIT-AI-MEM-001: assertAllowedMemoryKey rejects unknown keys', () => {
    expect(() => assertAllowedMemoryKey('customer_notes')).toThrow(/not allowed/);
  });

  it('UNIT-AI-MEM-002: assertAllowedMemoryKey accepts brand_voice', () => {
    expect(assertAllowedMemoryKey('brand_voice')).toBe('brand_voice');
  });

  it('UNIT-AI-MEM-003: loadOrgAiMemoriesForPrompt returns null when empty', async () => {
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            })),
          })),
        })),
      })),
    };

    const prompt = await loadOrgAiMemoriesForPrompt(client as never, 'org-1');
    expect(prompt).toBeNull();
  });

  it('UNIT-AI-MEM-004: loadOrgAiMemoriesForPrompt wraps brand voice', async () => {
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: { content: 'Friendly, concise, no jargon.' },
                error: null,
              })),
            })),
          })),
        })),
      })),
    };

    const prompt = await loadOrgAiMemoriesForPrompt(client as never, 'org-1');
    expect(prompt).toContain('Organization brand voice');
    expect(prompt).toContain('Friendly, concise, no jargon.');
  });

  it('UNIT-AI-MEM-005: setOrgAiMemory rejects content over 4000 chars', async () => {
    const client = { from: vi.fn() };
    await expect(
      setOrgAiMemory(client as never, 'org-1', 'brand_voice', 'x'.repeat(4001)),
    ).rejects.toThrow(/4000 characters/);
  });
});
